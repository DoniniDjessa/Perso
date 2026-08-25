import { ScreenShell } from '@/components/ScreenShell'
import { PeopleChips } from '@/components/PeopleChips'
import { MapLink } from '@/components/MapLink'
import { SummaryBalloon } from '@/components/SummaryBalloon'
import { FlatIcon, type FlatIconName } from '@/components/FlatIcon'
import { ExpenseRow } from '@/components/ExpenseRow'
import { SummaryAmount } from '@/components/SummaryAmount'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { formatDay, formatTime, isInPeriod, SPEND_PERIOD_CAPTION, type SpendPeriod } from '@/lib/format'
import { mapPointFrom } from '@/lib/maps'
import { priorityLabel } from '@/lib/priority'
import { useAgenda, useExpenses, useTodos } from '@/lib/hooks'
import type { AgendaEvent } from '@/lib/types'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { PeriodTabs } from '@/components/PeriodTabs'

export default function HomeScreen() {
  const { openForm } = useFormDrawer()
  const expenses = useExpenses()
  const todos = useTodos()
  const agenda = useAgenda()
  const error = expenses.error || todos.error || agenda.error
  const [period, setPeriod] = useState<SpendPeriod>('day')

  const spend = expenses.items
    .filter((e) => isInPeriod(e.spent_at, period))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const loading =
    (expenses.loading && expenses.items.length === 0) ||
    (todos.loading && todos.items.length === 0) ||
    (agenda.loading && agenda.items.length === 0)
  const openTodos = todos.items.filter((t) => !t.done)

  const { important, nearest } = useMemo(() => pickAgendaHighlights(agenda.items), [agenda.items])

  return (
    <ScreenShell loading={loading} error={error}>
      <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
        <LinearGradient
          colors={[colors.indigo, colors.violetLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18, overflow: 'hidden' }}
        >
          <SummaryBalloon
            id="home-balloon-a"
            size={260}
            color="#FFFFFF"
            opacity={0.2}
            style={{ right: -80, top: -90 }}
          />
          <SummaryBalloon
            id="home-balloon-b"
            size={180}
            color="#111111"
            opacity={0.16}
            style={{ left: -56, bottom: -70 }}
          />
          <PeriodTabs value={period} onChange={setPeriod} />
          <SummaryAmount caption={`Dépensé · ${SPEND_PERIOD_CAPTION[period]}`} amount={spend} />
        </LinearGradient>
      </View>

      <HomeCard
        title="Agenda"
        subtitle="Le plus important, puis le plus proche"
        icon="calendar"
        tint="#EEF2FF"
        balloons={[
          { id: 'agenda-a', color: '#4F46E5', opacity: 0.12, size: 180, style: { right: -50, top: -70 } },
          { id: 'agenda-b', color: '#38BDF8', opacity: 0.1, size: 140, style: { left: -40, bottom: -50 } },
        ]}
      >
        {!important ? (
          <Text style={{ ...fonts.regular, color: colors.muted }}>Rien de prévu à venir.</Text>
        ) : (
          <YStack gap={10}>
            <AgendaHighlight
              item={important}
              caption={
                nearest && nearest.id === important.id
                  ? 'Prioritaire · aussi le plus proche'
                  : 'Le plus important'
              }
              featured
            />
            {nearest && nearest.id !== important.id ? (
              <AgendaHighlight item={nearest} caption="Le plus proche" />
            ) : null}
          </YStack>
        )}
      </HomeCard>

      <HomeCard
        title="À faire"
        subtitle={`${openTodos.length} ouverte(s)`}
        icon="todo"
        tint="#FFF7ED"
        balloons={[
          { id: 'todo-a', color: '#F59E0B', opacity: 0.14, size: 170, style: { right: -46, top: -64 } },
          { id: 'todo-b', color: '#FB7185', opacity: 0.1, size: 130, style: { left: -36, bottom: -48 } },
        ]}
      >
        {openTodos.length === 0 ? (
          <Text style={{ ...fonts.regular, color: colors.muted }}>Aucune tâche ouverte.</Text>
        ) : (
          openTodos.slice(0, 4).map((item) => (
            <Pressable key={item.id} onPress={() => openForm('todo', item)}>
            <XStack
              backgroundColor={colors.bg}
              borderRadius={14}
              paddingHorizontal={12}
              paddingVertical={10}
              marginBottom={8}
              alignItems="center"
              gap={10}
            >
              <YStack width={8} height={8} borderRadius={4} backgroundColor={colors.violet} />
              <YStack flex={1}>
                <Text style={{ ...fonts.semibold, color: colors.black }}>{item.title}</Text>
                <PeopleChips people={item.people} />
              </YStack>
            </XStack>
            </Pressable>
          ))
        )}
      </HomeCard>

      <HomeCard
        title="Dépenses"
        subtitle="Les plus récentes"
        icon="wallet"
        tint="#ECFDF5"
        balloons={[
          { id: 'spend-a', color: '#10B981', opacity: 0.14, size: 170, style: { right: -46, top: -64 } },
          { id: 'spend-b', color: '#4F46E5', opacity: 0.1, size: 130, style: { left: -36, bottom: -48 } },
        ]}
      >
        {expenses.items.length === 0 ? (
          <Text style={{ ...fonts.regular, color: colors.muted }}>Pas encore de dépense.</Text>
        ) : (
          expenses.items.slice(0, 4).map((item) => <ExpenseRow key={item.id} item={item} compact />)
        )}
      </HomeCard>
    </ScreenShell>
  )
}

function pickAgendaHighlights(items: AgendaEvent[]) {
  const upcoming = items
    .filter((item) => new Date(item.starts_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  const nearest = upcoming[0] ?? null
  const important =
    [...upcoming].sort((a, b) => {
      const byPriority = (b.priority ?? 2) - (a.priority ?? 2)
      if (byPriority !== 0) return byPriority
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    })[0] ?? null
  return { important, nearest }
}

function AgendaHighlight({
  item,
  caption,
  featured,
}: {
  item: AgendaEvent
  caption: string
  featured?: boolean
}) {
  const { openForm } = useFormDrawer()
  return (
    <Pressable onPress={() => openForm('agenda', item)}>
    <YStack
      backgroundColor={featured ? colors.violetSoft : colors.bg}
      borderRadius={16}
      padding={14}
      gap={4}
    >
      <Text style={{ ...fonts.bold, fontSize: 10, color: colors.indigo, letterSpacing: 1.1 }}>
        {caption}
      </Text>
      <XStack justifyContent="space-between" alignItems="center" gap={8}>
        <Text style={{ ...fonts.bold, fontSize: 16, color: colors.black, flex: 1 }}>{item.title}</Text>
        <Text style={{ ...fonts.extra, color: colors.indigo }}>{formatTime(item.starts_at)}</Text>
      </XStack>
      <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
        {priorityLabel(item.priority)} · {formatDay(item.starts_at)}
      </Text>
      <PeopleChips people={item.people} />
      <MapLink point={mapPointFrom(item)} />
    </YStack>
    </Pressable>
  )
}

function HomeCard({
  title,
  subtitle,
  icon,
  tint,
  balloons,
  children,
}: {
  title: string
  subtitle?: string
  icon: FlatIconName
  tint: string
  balloons?: {
    id: string
    color: string
    opacity: number
    size: number
    style: { right?: number; left?: number; top?: number; bottom?: number }
  }[]
  children: ReactNode
}) {
  return (
    <YStack
      backgroundColor={colors.card}
      borderRadius={24}
      padding={18}
      marginBottom={14}
      overflow="hidden"
    >
      {balloons?.map((balloon) => (
        <SummaryBalloon
          key={balloon.id}
          id={balloon.id}
          size={balloon.size}
          color={balloon.color}
          opacity={balloon.opacity}
          style={balloon.style}
        />
      ))}
      <XStack alignItems="center" justifyContent="space-between" marginBottom={14}>
        <YStack flex={1} paddingRight={12}>
          <Text style={{ ...fonts.extra, fontSize: 20, color: colors.black }}>{title}</Text>
          {subtitle ? (
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 }}>
              {subtitle}
            </Text>
          ) : null}
        </YStack>
        <YStack
          width={54}
          height={54}
          borderRadius={18}
          backgroundColor={tint}
          alignItems="center"
          justifyContent="center"
        >
          <FlatIcon name={icon} size={30} />
        </YStack>
      </XStack>
      {children}
    </YStack>
  )
}
