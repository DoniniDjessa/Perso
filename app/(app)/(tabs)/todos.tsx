import { ScreenShell } from '@/components/ScreenShell'
import { PeopleChips } from '@/components/PeopleChips'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { dateKey, formatDay, formatTime } from '@/lib/format'
import { useTodos } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { cancelItemNotification } from '@/lib/notifications'
import {
  habitSummary,
  isHabitDoneToday,
  isHabitDueThisWeek,
  isHabitDueToday,
  isHabitTodo,
  nextHabitAt,
  parseHabit,
  WEEKDAYS,
} from '@/lib/habit'
import { consumeTodosView, subscribeTodosView } from '@/lib/todoView'
import { deleteRow } from '@/lib/save'
import { errorMessage } from '@/lib/errors'
import type { Todo } from '@/lib/types'
import { Alert, Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { FlatIcon } from '@/components/FlatIcon'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'
import { useEffect, useMemo, useState } from 'react'

type TodoTab = 'once' | 'habit'
type HabitScope = 'today' | 'week'

export default function TodosScreen() {
  const { openForm } = useFormDrawer()
  const { items, loading, error, refresh } = useTodos()
  const [tab, setTab] = useState<TodoTab>('once')
  const [habitScope, setHabitScope] = useState<HabitScope>('today')

  useEffect(() => {
    return subscribeTodosView(() => {
      const next = consumeTodosView()
      if (!next) return
      setTab(next.tab)
      if (next.scope) setHabitScope(next.scope)
    })
  }, [])

  const list = useMemo(() => {
    const once = items.filter((item) => !isHabitTodo(item))
    const habits = items.filter((item) => isHabitTodo(item))
    if (tab !== 'habit') return once
    if (habitScope === 'week') {
      return habits.filter((item) => {
        const habit = parseHabit(item.habit)
        return habit ? isHabitDueThisWeek(habit) : true
      })
    }
    return habits.filter((item) => {
      const habit = parseHabit(item.habit)
      return habit ? isHabitDueToday(habit) : false
    })
  }, [habitScope, items, tab])
  const page = usePage(list, `${tab}-${habitScope}`)

  const toggle = async (item: Todo) => {
    const habit = parseHabit(item.habit)
    if (habit && isHabitTodo(item)) {
      const today = dateKey(new Date())
      const doneToday = isHabitDoneToday(habit)
      const next = {
        ...habit,
        last_done_on: doneToday ? null : today,
      }
      const due = nextHabitAt(next)
      await supabase
        .from(tables.todos)
        .update({
          habit: next,
          done: false,
          due_at: due ? due.toISOString() : null,
        })
        .eq('id', item.id)
      await refresh()
      return
    }
    const nextDone = !item.done
    await supabase.from(tables.todos).update({ done: nextDone }).eq('id', item.id)
    if (nextDone) await cancelItemNotification('todo', item.id)
    await refresh()
  }

  const remove = (item: Todo) => {
    Alert.alert('Supprimer ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await cancelItemNotification('todo', item.id)
              await deleteRow(tables.todos, item.id, [item.image_path])
              await refresh()
            } catch (e) {
              Alert.alert('Suppression impossible', errorMessage(e))
            }
          })()
        },
      },
    ])
  }

  return (
    <ScreenShell title="TODOs" loading={loading} error={error}>
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        padding={4}
        marginBottom={16}
        gap={4}
      >
        <TabButton label="Une fois" active={tab === 'once'} onPress={() => setTab('once')} />
        <TabButton label="Habitudes" active={tab === 'habit'} onPress={() => setTab('habit')} />
      </XStack>
      {tab === 'habit' ? (
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          padding={4}
          marginBottom={16}
          gap={4}
        >
          <TabButton
            label="Aujourd’hui"
            active={habitScope === 'today'}
            onPress={() => setHabitScope('today')}
          />
          <TabButton
            label="Semaine"
            active={habitScope === 'week'}
            onPress={() => setHabitScope('week')}
          />
        </XStack>
      ) : null}
      {list.length === 0 ? (
        <Text style={{ ...fonts.regular, color: colors.muted }}>
          {tab === 'habit'
            ? habitScope === 'week'
              ? 'Aucune habitude. Ajoute une routine (sport, course, post…).'
              : 'Rien de prévu aujourd’hui. Ouvre Semaine pour voir le reste de tes routines.'
            : 'Aucune tâche. Ajoutes-en une.'}
        </Text>
      ) : (
        page.slice.map((item) => (
          <TodoRow
            key={item.id}
            item={item}
            onToggle={() => void toggle(item)}
            onOpen={() => openForm('todo', item)}
            onDelete={
              isHabitTodo(item) || item.done ? () => remove(item) : undefined
            }
          />
        ))
      )}
      <ListPager
        from={page.from}
        to={page.to}
        total={page.total}
        canPrev={page.canPrev}
        canNext={page.canNext}
        onPrev={page.prev}
        onNext={page.next}
      />
    </ScreenShell>
  )
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <YStack
        height={36}
        borderRadius={12}
        alignItems="center"
        justifyContent="center"
        backgroundColor={active ? colors.indigo : 'transparent'}
      >
        <Text style={{ ...fonts.semibold, fontSize: 13, color: active ? colors.white : colors.muted }}>
          {label}
        </Text>
      </YStack>
    </Pressable>
  )
}

function TodoRow({
  item,
  onToggle,
  onOpen,
  onDelete,
}: {
  item: Todo
  onToggle: () => void
  onOpen: () => void
  onDelete?: () => void
}) {
  const habit = parseHabit(item.habit)
  const isHabit = Boolean(habit && isHabitTodo(item))
  const done = isHabit ? isHabitDoneToday(habit) : item.done

  return (
    <XStack
      backgroundColor={colors.card}
      borderRadius={16}
      padding={16}
      marginBottom={10}
      alignItems="center"
      gap={14}
    >
      <Pressable onPress={onToggle} hitSlop={8}>
        <YStack
          width={22}
          height={22}
          borderRadius={11}
          borderWidth={2}
          borderColor={done ? colors.indigo : colors.muted}
          backgroundColor={done ? colors.indigo : 'transparent'}
        />
      </Pressable>
      <Pressable onPress={onOpen} style={{ flex: 1 }}>
        <YStack>
          <Text
            style={{
              ...fonts.bold,
              textDecorationLine: done ? 'line-through' : 'none',
              color: done ? colors.muted : colors.black,
            }}
          >
            {item.title}
          </Text>
          {isHabit && habit ? (
            <>
              <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {habitSummary(habit)}
              </Text>
              {habit.every === 'weekly' ? (
                <XStack gap={4} marginTop={8}>
                  {WEEKDAYS.map((day) => {
                    const on = habit.days.includes(day.value)
                    return (
                      <YStack
                        key={day.value}
                        flex={1}
                        height={22}
                        borderRadius={8}
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor={on ? colors.violetSoft : colors.bg}
                      >
                        <Text
                          style={{
                            ...fonts.bold,
                            fontSize: 9,
                            color: on ? colors.indigo : colors.muted,
                          }}
                        >
                          {day.short[0]}
                        </Text>
                      </YStack>
                    )
                  })}
                </XStack>
              ) : null}
            </>
          ) : item.due_at ? (
            <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12, marginTop: 2 }}>
              {formatDay(item.due_at)} · {formatTime(item.due_at)}
            </Text>
          ) : null}
          <PeopleChips people={item.people} />
        </YStack>
      </Pressable>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={8}>
          <YStack
            width={36}
            height={36}
            borderRadius={12}
            alignItems="center"
            justifyContent="center"
            backgroundColor={colors.bg}
          >
            <FlatIcon name="archive" size={18} />
          </YStack>
        </Pressable>
      ) : null}
    </XStack>
  )
}
