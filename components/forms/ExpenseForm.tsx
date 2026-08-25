import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ImageAttach } from '@/components/ImageAttach'
import { CategoryPick } from '@/components/CategoryPick'
import { PeopleAttach } from '@/components/PeopleAttach'
import { PlaceAttach } from '@/components/PlaceAttach'
import { OptionalDateTime, resolveSpentAt } from '@/components/OptionalDateTime'
import { mapColumns, mapPointFrom, type MapPoint } from '@/lib/maps'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { persistItemImage } from '@/lib/compress'
import { dateAndTimeFromIso } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { asExpenseCategory, EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/categories'
import { insertRow, peoplePayload, updateRow } from '@/lib/save'
import { useItemImage } from '@/lib/useItemImage'
import { useHideLock } from '@/lib/hideLock'
import type { AssignedPerson, Expense } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { useState } from 'react'
import { Switch } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function ExpenseForm({
  item,
  onClose,
  onSaved,
}: {
  item?: Expense | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const { hasCode } = useHideLock()
  const editing = Boolean(item?.id)
  const spent = dateAndTimeFromIso(item?.spent_at)
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [label, setLabel] = useState(item?.label ?? '')
  const [category, setCategory] = useState<ExpenseCategory | null>(asExpenseCategory(item?.category))
  const [date, setDate] = useState<Date | null>(spent.date)
  const [time, setTime] = useState<Date | null>(spent.time)
  const image = useItemImage(item?.image_path)
  const [people, setPeople] = useState<AssignedPerson[]>(item?.people ?? [])
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(item ? mapPointFrom(item) : null)
  const [hidden, setHidden] = useState(Boolean(item?.hidden))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!user) return
    const value = Number(amount.replace(/\s/g, '').replace(',', '.'))
    if (!value || !label.trim()) {
      setError('Montant et libellé sont requis.')
      return
    }
    if (hidden && !hasCode) {
      setError('Définis un code de confidentialité dans Paramètres pour masquer une dépense.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        amount: value,
        currency: item?.currency ?? 'XOF',
        label: label.trim(),
        category,
        people: peoplePayload(people),
        spent_at: resolveSpentAt(date, time).toISOString(),
        hidden,
        ...mapColumns(mapPoint),
      }

      if (editing && item) {
        const image_path = await persistItemImage(
          user.id,
          item.id,
          item.image_path,
          image.uri,
          image.dirty
        )
        await updateRow(tables.expenses, item.id, {
          ...payload,
          ...(image_path !== undefined ? { image_path } : {}),
        })
        onSaved()
        return
      }

      const data = await insertRow(tables.expenses, { user_id: user.id, ...payload })
      const image_path = await persistItemImage(user.id, data.id, null, image.uri, Boolean(image.uri))
      if (image_path) await updateRow(tables.expenses, data.id, { image_path })
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
      const { error: err } = await supabase.from(tables.expenses).delete().eq('id', item.id)
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
      title={editing ? 'Modifier la dépense' : 'Nouvelle dépense'}
      onSave={save}
      onClose={onClose}
      onDelete={editing ? remove : undefined}
      busy={busy}
      disabled={!amount || !label}
    >
      <Field label="LIBELLÉ" placeholder="Ex. carburant" value={label} onChangeText={setLabel} />
      <Field
        label="MONTANT"
        placeholder="Montant (FCFA)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <CategoryPick
        value={category}
        onChange={(value) => setCategory(asExpenseCategory(value))}
        options={EXPENSE_CATEGORIES}
      />
      <OptionalDateTime date={date} time={time} onDate={setDate} onTime={setTime} />
      <PeopleAttach people={people} onChange={setPeople} />
      <PlaceAttach point={mapPoint} onChange={setMapPoint} />
      <YStack
        backgroundColor={colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={12}
        gap={6}
      >
        <XStack alignItems="center" justifyContent="space-between">
          <Text style={{ ...fonts.semibold, color: colors.black }}>Masquer cette dépense</Text>
          <Switch
            value={hidden}
            onValueChange={setHidden}
            trackColor={{ true: colors.indigo }}
          />
        </XStack>
        <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
          Elle reste dans les totaux. Pour la lire, il faudra le code défini dans Paramètres.
        </Text>
      </YStack>
      <ImageAttach uri={image.uri} onChange={image.onChange} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}
