import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ImageAttach } from '@/components/ImageAttach'
import { PeopleAttach } from '@/components/PeopleAttach'
import { CreditDirectionPick } from '@/components/CreditDirectionPick'
import { ReminderPick } from '@/components/ReminderPick'
import { OptionalDateTime, resolveOptionalAt, resolveSpentAt } from '@/components/OptionalDateTime'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { persistItemImage } from '@/lib/compress'
import { dateAndTimeFromIso } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { asCreditDirection, type CreditDirection } from '@/lib/categories'
import { insertRow, peoplePayload, updateRow, deleteRow } from '@/lib/save'
import { useItemImage } from '@/lib/useItemImage'
import { parseReminder, reminderPayload } from '@/lib/reminder'
import type { AssignedPerson, Credit } from '@/lib/types'
import { tables } from '@/lib/db'
import { cancelItemNotification } from '@/lib/notifications'
import { useState } from 'react'
import { Switch } from 'react-native'
import { Text, XStack } from 'tamagui'

export function CreditForm({
  item,
  onClose,
  onSaved,
}: {
  item?: Credit | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const editing = Boolean(item?.id)
  const opened = dateAndTimeFromIso(item?.opened_at)
  const due = dateAndTimeFromIso(item?.due_at)
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [label, setLabel] = useState(item?.label ?? '')
  const [direction, setDirection] = useState<CreditDirection>(asCreditDirection(item?.direction))
  const [notes, setNotes] = useState(item?.notes ?? '')
  const [date, setDate] = useState<Date | null>(opened.date)
  const [time, setTime] = useState<Date | null>(opened.time)
  const [dueDate, setDueDate] = useState<Date | null>(due.date)
  const [dueTime, setDueTime] = useState<Date | null>(due.time)
  const [repaid, setRepaid] = useState(Boolean(item?.repaid))
  const image = useItemImage(item?.image_path)
  const [people, setPeople] = useState<AssignedPerson[]>(item?.people ?? [])
  const [reminder, setReminder] = useState(() => parseReminder(item?.reminder, 'push'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!user) return
    const value = Number(amount.replace(/\s/g, '').replace(',', '.'))
    if (!value || !label.trim()) {
      setError('Montant et libellé sont requis.')
      return
    }
    const dueAt = resolveOptionalAt(dueDate, dueTime)
    if (reminder.enabled && !reminder.start_at && !dueAt) {
      setError('Choisis une échéance ou une date de rappel.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        amount: value,
        currency: item?.currency ?? 'XOF',
        label: label.trim(),
        direction,
        notes: notes.trim() || null,
        people: peoplePayload(people),
        repaid,
        opened_at: resolveSpentAt(date, time).toISOString(),
        due_at: dueAt ? dueAt.toISOString() : null,
        reminder: reminderPayload({ ...reminder, mode: 'push' }),
      }

      if (editing && item) {
        const image_path = await persistItemImage(
          user.id,
          item.id,
          item.image_path,
          image.uri,
          image.dirty
        )
        await updateRow(tables.credits, item.id, {
          ...payload,
          ...(image_path !== undefined ? { image_path } : {}),
        })
        if (repaid) await cancelItemNotification('credit', item.id)
        onSaved()
        return
      }

      const data = await insertRow(tables.credits, { user_id: user.id, ...payload })
      const image_path = await persistItemImage(user.id, data.id, null, image.uri, Boolean(image.uri))
      if (image_path) await updateRow(tables.credits, data.id, { image_path })
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
      await cancelItemNotification('credit', item.id)
      await deleteRow(tables.credits, item.id, [item.image_path])
      onSaved()
    } catch (e) {
      setError(errorMessage(e, 'Suppression impossible.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormPanel
      title={editing ? 'Modifier le crédit' : 'Nouveau crédit'}
      onSave={save}
      onClose={onClose}
      onDelete={editing ? remove : undefined}
      busy={busy}
      disabled={!amount || !label}
    >
      <Field
        label="LIBELLÉ"
        placeholder="Ex. prêt à Marie"
        value={label}
        onChangeText={setLabel}
      />
      <Field
        label="MONTANT"
        placeholder="Montant (FCFA)"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <CreditDirectionPick value={direction} onChange={setDirection} />
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
      <OptionalDateTime
        date={dueDate}
        time={dueTime}
        onDate={setDueDate}
        onTime={setDueTime}
        dateLabel="ÉCHÉANCE (OPTIONNEL)"
        timeLabel="HEURE (OPTIONNEL)"
        emptyDate="Pas de date"
        emptyTime="Pas d’heure"
      />
      <ReminderPick
        value={reminder}
        onChange={(next) => setReminder({ ...next, mode: 'push' })}
        variant="push"
        emptyStart="À l’échéance"
      />
      <Field label="NOTES" placeholder="Détail optionnel" value={notes} onChangeText={setNotes} />
      <PeopleAttach people={people} onChange={setPeople} />
      {editing ? (
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={16}
          paddingVertical={12}
          alignItems="center"
          justifyContent="space-between"
        >
          <Text style={{ ...fonts.semibold, color: colors.black }}>Remboursé</Text>
          <Switch value={repaid} onValueChange={setRepaid} trackColor={{ true: colors.indigo }} />
        </XStack>
      ) : null}
      <ImageAttach uri={image.uri} onChange={image.onChange} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}
