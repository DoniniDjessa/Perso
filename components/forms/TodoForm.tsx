import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ImageAttach } from '@/components/ImageAttach'
import { PeopleAttach } from '@/components/PeopleAttach'
import { ReminderPick } from '@/components/ReminderPick'
import { OptionalDateTime, resolveOptionalAt } from '@/components/OptionalDateTime'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { persistItemImage } from '@/lib/compress'
import { dateAndTimeFromIso } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { insertRow, peoplePayload, updateRow } from '@/lib/save'
import { useItemImage } from '@/lib/useItemImage'
import { parseReminder, reminderPayload } from '@/lib/reminder'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { cancelItemNotification } from '@/lib/notifications'
import type { AssignedPerson, Todo } from '@/lib/types'
import { useState } from 'react'
import { Text } from 'tamagui'

export function TodoForm({
  item,
  onClose,
  onSaved,
}: {
  item?: Todo | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const editing = Boolean(item?.id)
  const due = dateAndTimeFromIso(item?.due_at)
  const [title, setTitle] = useState(item?.title ?? '')
  const [date, setDate] = useState<Date | null>(due.date)
  const [time, setTime] = useState<Date | null>(due.time)
  const [people, setPeople] = useState<AssignedPerson[]>(item?.people ?? [])
  const image = useItemImage(item?.image_path)
  const [reminder, setReminder] = useState(() => parseReminder(item?.reminder, 'both'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!user) return
    if (!title.trim()) {
      setError('Le titre est requis.')
      return
    }
    const dueAt = resolveOptionalAt(date, time)
    if (reminder.enabled && !reminder.start_at && !dueAt) {
      setError('Choisis une échéance ou une date de rappel.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        title: title.trim(),
        due_at: dueAt ? dueAt.toISOString() : null,
        people: peoplePayload(people),
        reminder: reminderPayload(reminder),
      }

      if (editing && item) {
        const image_path = await persistItemImage(
          user.id,
          item.id,
          item.image_path,
          image.uri,
          image.dirty
        )
        await updateRow(tables.todos, item.id, {
          ...payload,
          ...(image_path !== undefined ? { image_path } : {}),
        })
        onSaved()
        return
      }

      const data = await insertRow(tables.todos, { user_id: user.id, done: false, ...payload })
      const image_path = await persistItemImage(user.id, data.id, null, image.uri, Boolean(image.uri))
      if (image_path) await updateRow(tables.todos, data.id, { image_path })
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
      await cancelItemNotification('todo', item.id)
      const { error: err } = await supabase.from(tables.todos).delete().eq('id', item.id)
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
      title={editing ? 'Modifier le TODO' : 'Nouveau TODO'}
      onSave={save}
      onClose={onClose}
      onDelete={editing ? remove : undefined}
      busy={busy}
      disabled={!title}
    >
      <Field
        label="TÂCHE"
        placeholder="Qu'est-ce que tu dois faire ?"
        value={title}
        onChangeText={setTitle}
      />
      <OptionalDateTime
        date={date}
        time={time}
        onDate={setDate}
        onTime={setTime}
        dateLabel="ÉCHÉANCE (OPTIONNEL)"
        timeLabel="HEURE (OPTIONNEL)"
        emptyDate="Pas de date"
        emptyTime="Pas d’heure"
      />
      <PeopleAttach people={people} onChange={setPeople} />
      <ReminderPick
        value={reminder}
        onChange={setReminder}
        emptyStart="À l’échéance"
      />
      <ImageAttach uri={image.uri} onChange={image.onChange} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}
