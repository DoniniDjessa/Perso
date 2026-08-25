import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ImageAttach } from '@/components/ImageAttach'
import { CategoryPick } from '@/components/CategoryPick'
import { PeopleAttach } from '@/components/PeopleAttach'
import { OptionalDateTime, resolveSpentAt } from '@/components/OptionalDateTime'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { persistItemImage } from '@/lib/compress'
import { dateAndTimeFromIso } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { asIncomeCategory, INCOME_CATEGORIES, type IncomeCategory } from '@/lib/categories'
import { insertRow, peoplePayload, updateRow } from '@/lib/save'
import { useItemImage } from '@/lib/useItemImage'
import type { AssignedPerson, Income } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { useState } from 'react'
import { Text } from 'tamagui'

export function IncomeForm({
  item,
  onClose,
  onSaved,
}: {
  item?: Income | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const editing = Boolean(item?.id)
  const received = dateAndTimeFromIso(item?.received_at)
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [label, setLabel] = useState(item?.label ?? '')
  const [category, setCategory] = useState<IncomeCategory | null>(asIncomeCategory(item?.category))
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [date, setDate] = useState<Date | null>(received.date)
  const [time, setTime] = useState<Date | null>(received.time)
  const image = useItemImage(item?.image_path)
  const [people, setPeople] = useState<AssignedPerson[]>(item?.people ?? [])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!user) return
    const value = Number(amount.replace(/\s/g, '').replace(',', '.'))
    if (!value || !label.trim()) {
      setError('Montant et libellé sont requis.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        amount: value,
        currency: item?.currency ?? 'XOF',
        label: label.trim(),
        category,
        notes: notes.trim() || null,
        people: peoplePayload(people),
        received_at: resolveSpentAt(date, time).toISOString(),
      }

      if (editing && item) {
        const image_path = await persistItemImage(
          user.id,
          item.id,
          item.image_path,
          image.uri,
          image.dirty
        )
        await updateRow(tables.incomes, item.id, {
          ...payload,
          ...(image_path !== undefined ? { image_path } : {}),
        })
        onSaved()
        return
      }

      const data = await insertRow(tables.incomes, { user_id: user.id, ...payload })
      const image_path = await persistItemImage(user.id, data.id, null, image.uri, Boolean(image.uri))
      if (image_path) await updateRow(tables.incomes, data.id, { image_path })
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!item) return
    setBusy(true)
    try {
      const { error: err } = await supabase.from(tables.incomes).delete().eq('id', item.id)
      if (err) throw err
      onSaved()
    } catch (e) {
      setError(errorMessage(e, 'Suppression impossible.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormPanel
      title={editing ? 'Modifier le revenu' : 'Nouveau revenu'}
      onSave={save}
      onClose={onClose}
      onDelete={editing ? remove : undefined}
      busy={busy}
      disabled={!amount || !label}
    >
      <Field label="LIBELLÉ" placeholder="Ex. salaire mars" value={label} onChangeText={setLabel} />
      <Field
        label="MONTANT"
        placeholder="Montant (FCFA)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <CategoryPick
        value={category}
        onChange={(value) => setCategory(asIncomeCategory(value))}
        options={INCOME_CATEGORIES}
        label="SOURCE"
      />
      <OptionalDateTime
        date={date}
        time={time}
        onDate={setDate}
        onTime={setTime}
        dateLabel="DATE"
        timeLabel="HEURE"
        emptyDate="Aujourd’hui"
        emptyTime="Maintenant"
      />
      <Field label="NOTES" placeholder="Détail optionnel" value={notes} onChangeText={setNotes} />
      <PeopleAttach people={people} onChange={setPeople} />
      <ImageAttach uri={image.uri} onChange={image.onChange} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}
