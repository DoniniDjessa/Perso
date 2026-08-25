import { ScreenShell } from '@/components/ScreenShell'
import { MonthCalendar } from '@/components/MonthCalendar'
import { PeopleChips } from '@/components/PeopleChips'
import { MapLink } from '@/components/MapLink'
import { FlatIcon } from '@/components/FlatIcon'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { dateKey, formatDay, formatTime } from '@/lib/format'
import { priorityColor, priorityLabel } from '@/lib/priority'
import { useAgenda } from '@/lib/hooks'
import { mapPointFrom } from '@/lib/maps'
import type { AgendaEvent } from '@/lib/types'
import { X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'

type AgendaTab = 'upcoming' | 'history'

export default function AgendaScreen() {
  const { items, loading, error } = useAgenda()
  const [month, setMonth] = useState(() => new Date())
  const [dayFilter, setDayFilter] = useState<Date | null>(null)
  const [tab, setTab] = useState<AgendaTab>('upcoming')

  const marked = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      const key = dateKey(item.starts_at)
      map.set(key, Math.max(map.get(key) ?? 0, Number(item.priority) || 2))
    }
    return [...map.entries()].map(([date, priority]) => ({ date, priority }))
  }, [items])
  const now = Date.now()

  const list = useMemo(() => {
    if (dayFilter) {
      const key = dateKey(dayFilter)
      return items
        .filter((item) => dateKey(item.starts_at) === key)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    }

    if (tab === 'history') {
      return items
        .filter((item) => new Date(item.starts_at).getTime() < now)
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    }

    return items
      .filter((item) => new Date(item.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  }, [dayFilter, items, now, tab])

  const page = usePage(list, dayFilter ? `day-${dateKey(dayFilter)}` : tab)

  const onSelectDay = (day: Date) => {
    if (dayFilter && dateKey(day) === dateKey(dayFilter)) {
      setDayFilter(null)
      return
    }
    setDayFilter(day)
    if (day.getMonth() !== month.getMonth() || day.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(day.getFullYear(), day.getMonth(), 1))
    }
  }

  return (
    <ScreenShell title="Agenda" loading={loading} error={error}>
      <MonthCalendar
        month={month}
        selected={dayFilter}
        marked={marked}
        onMonthChange={setMonth}
        onSelect={onSelectDay}
      />

      {dayFilter ? (
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={16}
          paddingVertical={12}
          marginBottom={14}
          alignItems="center"
          justifyContent="space-between"
          gap={12}
        >
          <YStack flex={1}>
            <Text style={{ ...fonts.bold, fontSize: 10, color: colors.indigo, letterSpacing: 1.1 }}>
              JOUR SÉLECTIONNÉ
            </Text>
            <Text style={{ ...fonts.semibold, color: colors.black, marginTop: 2, textTransform: 'capitalize' }}>
              {dayFilter.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </YStack>
          <Pressable onPress={() => setDayFilter(null)} hitSlop={8}>
            <XStack
              height={36}
              paddingHorizontal={12}
              borderRadius={12}
              backgroundColor={colors.violetSoft}
              alignItems="center"
              gap={6}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.indigo }}>Tout voir</Text>
              <X size={14} color={colors.indigo} />
            </XStack>
          </Pressable>
        </XStack>
      ) : (
        <XStack backgroundColor={colors.card} borderRadius={16} padding={4} marginBottom={14}>
          <TabButton label="À venir" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
          <TabButton label="Historique" active={tab === 'history'} onPress={() => setTab('history')} />
        </XStack>
      )}

      {list.length === 0 ? (
        <Text style={{ ...fonts.regular, color: colors.muted }}>
          {dayFilter
            ? 'Aucun événement ce jour-là.'
            : tab === 'upcoming'
              ? 'Aucun événement à venir.'
              : 'Aucun événement passé.'}
        </Text>
      ) : (
        page.slice.map((item) => <AgendaRow key={item.id} item={item} />)
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

function AgendaRow({ item }: { item: AgendaEvent }) {
  const { openForm } = useFormDrawer()
  const tone = priorityColor(item.priority)
  return (
    <Pressable onPress={() => openForm('agenda', item)}>
      <XStack backgroundColor={colors.card} borderRadius={16} padding={16} marginBottom={10} gap={12}>
        <YStack width={4} borderRadius={4} backgroundColor={tone} />
        <YStack flex={1} gap={4}>
          <XStack justifyContent="space-between" alignItems="center">
            <Text style={{ ...fonts.extra, color: colors.black, flex: 1, paddingRight: 8 }}>{item.title}</Text>
            <Text style={{ ...fonts.bold, color: colors.indigo }}>{formatTime(item.starts_at)}</Text>
          </XStack>
          <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12 }}>
            {priorityLabel(item.priority)} · {formatDay(item.starts_at)}
          </Text>
          {item.place ? (
            <XStack alignItems="center" gap={6} marginTop={4}>
              <FlatIcon name="pin" size={14} />
              <Text style={{ ...fonts.regular, color: colors.muted }}>{item.place}</Text>
            </XStack>
          ) : null}
          <PeopleChips people={item.people} />
          <MapLink point={mapPointFrom(item)} />
        </YStack>
      </XStack>
    </Pressable>
  )
}
