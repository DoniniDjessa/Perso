import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { ImageAttach } from '@/components/ImageAttach'
import { PeopleAttach } from '@/components/PeopleAttach'
import { ReminderPick } from '@/components/ReminderPick'
import { HabitPick } from '@/components/HabitPick'
import { OptionalDateTime, resolveOptionalAt } from '@/components/OptionalDateTime'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { persistItemImage } from '@/lib/compress'
import { dateAndTimeFromIso, dateKey } from '@/lib/format'
import { errorMessage } from '@/lib/errors'
import { insertRow, peoplePayload, updateRow, tryUpdateColumns, deleteRow } from '@/lib/save'
import { useItemImage } from '@/lib/useItemImage'
import { parseReminder, reminderPayload } from '@/lib/reminder'
import {
  defaultHabit,
  habitPayload,
  isHabitDueToday,
  isHabitTodo,
  nextHabitAt,
  parseHabit,
} from '@/lib/habit'
import { requestTodosView } from '@/lib/todoView'
import { tables } from '@/lib/db'
import { cancelItemNotification } from '@/lib/notifications'
import type { AssignedPerson, Todo, TodoKind } from '@/lib/types'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

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
  const initialHabit = parseHabit(item?.habit)
  const [kind, setKind] = useState<TodoKind>(isHabitTodo(item ?? {}) || initialHabit ? 'habit' : 'once')
  const [title, setTitle] = useState(item?.title ?? '')
  const [date, setDate] = useState<Date | null>(due.date)
  const [time, setTime] = useState<Date | null>(due.time)
  const [habit, setHabit] = useState(() => initialHabit ?? defaultHabit())
  const [people, setPeople] = useState<AssignedPerson[]>(item?.people ?? [])
  const image = useItemImage(item?.image_path)
  const [reminder, setReminder] = useState(() => parseReminder(item?.reminder, 'both'))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isHabit = kind === 'habit'

  const save = async () => {
    if (!user) return
    if (!title.trim()) {
      setError('Le titre est requis.')
      return
    }
    if (isHabit && habit.every === 'weekly' && habit.days.length === 0) {
      setError('Choisis au moins un jour.')
      return
    }
    const dueAt = isHabit ? nextHabitAt(habit) : resolveOptionalAt(date, time)
    if (!isHabit && reminder.enabled && !reminder.start_at && !dueAt) {
      setError('Choisis une échéance ou une date de rappel.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        title: title.trim(),
        kind,
        done: isHabit ? false : Boolean(item?.done),
        due_at: dueAt ? dueAt.toISOString() : null,
        people: peoplePayload(people),
        reminder: reminderPayload(reminder),
        habit: isHabit
          ? habitPayload({
              ...habit,
              last_done_on: initialHabit?.last_done_on ?? null,
              from: habit.from ?? dateKey(new Date()),
            })
          : null,
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
        if (isHabit) await tryUpdateColumns(tables.todos, item.id, { kind: 'habit', habit: payload.habit })
        if (isHabit) requestTodosView('habit', isHabitDueToday(habit) ? 'today' : 'week')
        onSaved()
        return
      }

      const data = await insertRow(tables.todos, { user_id: user.id, ...payload, done: false })
      if (isHabit) await tryUpdateColumns(tables.todos, data.id, { kind: 'habit', habit: payload.habit })
      const image_path = await persistItemImage(user.id, data.id, null, image.uri, Boolean(image.uri))
      if (image_path) await updateRow(tables.todos, data.id, { image_path })
      if (isHabit) requestTodosView('habit', isHabitDueToday(habit) ? 'today' : 'week')
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
      await deleteRow(tables.todos, item.id, [item.image_path])
      onSaved()
    } catch (e) {
      setError(errorMessage(e, 'Suppression impossible.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormPanel
      title={editing ? (isHabit ? 'Modifier l’habitude' : 'Modifier le TODO') : isHabit ? 'Nouvelle habitude' : 'Nouveau TODO'}
      onSave={save}
      onClose={onClose}
      onDelete={editing ? remove : undefined}
      busy={busy}
      disabled={!title}
    >
      <XStack gap={8}>
        <KindChip
          label="Une fois"
          hint="Tâche unique"
          active={!isHabit}
          onPress={() => setKind('once')}
        />
        <KindChip
          label="Habitude"
          hint="Routine, 7 jours"
          active={isHabit}
          onPress={() => setKind('habit')}
        />
      </XStack>
      <Field
        label="TÂCHE"
        placeholder={isHabit ? 'Ex. Sport, course, post TikTok' : "Qu'est-ce que tu dois faire ?"}
        value={title}
        onChangeText={setTitle}
      />
      {isHabit ? (
        <HabitPick value={habit} onChange={setHabit} />
      ) : (
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
      )}
      <PeopleAttach people={people} onChange={setPeople} />
      <ReminderPick
        value={reminder}
        onChange={setReminder}
        timing="until-done"
        hideStart={isHabit}
        emptyStart="À l’échéance"
      />
      <ImageAttach uri={image.uri} onChange={image.onChange} />
      {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
    </FormPanel>
  )
}

function KindChip({
  label,
  hint,
  active,
  onPress,
}: {
  label: string
  hint: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <YStack
        backgroundColor={active ? colors.indigo : colors.card}
        borderRadius={16}
        paddingHorizontal={14}
        paddingVertical={12}
      >
        <Text style={{ ...fonts.bold, fontSize: 14, color: active ? colors.white : colors.black }}>
          {label}
        </Text>
        <Text
          style={{
            ...fonts.medium,
            fontSize: 11,
            color: active ? 'rgba(255,255,255,0.8)' : colors.muted,
            marginTop: 2,
          }}
        >
          {hint}
        </Text>
      </YStack>
    </Pressable>
  )
}
