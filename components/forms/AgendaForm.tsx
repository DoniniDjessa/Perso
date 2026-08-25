import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ImageAttach } from '@/components/ImageAttach'
import { PeopleAttach } from '@/components/PeopleAttach'
import { PriorityPick } from '@/components/PriorityPick'
import { PlaceAttach } from '@/components/PlaceAttach'
import { ReminderPick } from '@/components/ReminderPick'
import { OptionalDateTime, resolveSpentAt } from '@/components/OptionalDateTime'
import { mapColumns, mapPointFrom, type MapPoint } from '@/lib/maps'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { persistItemImage } from '@/lib/compress'
import { dateAndTimeFromIso } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { insertRow, peoplePayload, tryUpdateColumns, updateRow } from '@/lib/save'
import { useItemImage } from '@/lib/useItemImage'
import { parseReminder, reminderPayload } from '@/lib/reminder'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { cancelItemNotification } from '@/lib/notifications'
import type { AssignedPerson, AgendaEvent } from '@/lib/types'
import { asPriority, priorityFromEvent, type AgendaPriority } from '@/lib/priority'
import { useState } from 'react'
import { Text } from 'tamagui'

export function AgendaForm({
  item,
  onClose,
  onSaved,
}: {
  item?: AgendaEvent | null
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const editing = Boolean(item?.id)
  const starts = dateAndTimeFromIso(item?.starts_at)
  const [title, setTitle] = useState(item?.title ?? '')
  const [place, setPlace] = useState(item?.place ?? '')
  const [date, setDate] = useState<Date | null>(starts.date)
  const [time, setTime] = useState<Date | null>(starts.time)
  const [priority, setPriority] = useState<AgendaPriority>(
    asPriority(item ? priorityFromEvent(item) : 2)
  )
  const [people, setPeople] = useState<AssignedPerson[]>(item?.people ?? [])
  const [mapPoint, setMapPoint] = useState<MapPoint | null>(item ? mapPointFrom(item) : null)
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
    setBusy(true)
    try {
      const nextPriority = asPriority(priority)
      const reminderBody = reminderPayload(reminder) ?? {
        enabled: false,
        mode: reminder.mode,
        sound: reminder.sound,
        start_at: reminder.start_at,
        interval_minutes: reminder.interval_minutes,
        count: reminder.count,
      }
      const payload = {
        title: title.trim(),
        starts_at: resolveSpentAt(date, time).toISOString(),
        place: place.trim() || null,
        priority: nextPriority,
        people: peoplePayload(people),
        reminder: { ...reminderBody, priority: nextPriority },
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
        await updateRow(tables.agenda, item.id, {
          ...payload,
          ...(image_path !== undefined ? { image_path } : {}),
        })
        await tryUpdateColumns(tables.agenda, item.id, { priority: nextPriority })
        onSaved()
        return
      }

      const data = await insertRow(tables.agenda, { user_id: user.id, ...payload })
      const image_path = await persistItemImage(user.id, data.id, null, image.uri, Boolean(image.uri))
      if (image_path) await updateRow(tables.agenda, data.id, { image_path })
      await tryUpdateColumns(tables.agenda, data.id, { priority: nextPriority })
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
      await cancelItemNotification('agenda', item.id)
      const { error: err } = await supabase.from(tables.agenda).delete().eq('id', item.id)
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
      title={editing ? 'Modifier l’événement' : 'Nouvel événement'}
      onSave={save}
      onClose={onClose}
      onDelete={editing ? remove : undefined}
      busy={busy}
      disabled={!title}
    >
      <Field label="TITRE" placeholder="Titre" value={title} onChangeText={setTitle} />
      <Field label="LIEU" placeholder="Optionnel" value={place} onChangeText={setPlace} />
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
      <PriorityPick value={priority} onChange={setPriority} />
      <PeopleAttach people={people} onChange={setPeople} />
      <ReminderPick
        value={reminder}
        onChange={setReminder}
        emptyStart="À l’heure de l’événement"
      />
      <PlaceAttach point={mapPoint} onChange={setMapPoint} />
      <ImageAttach uri={image.uri} onChange={image.onChange} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}
