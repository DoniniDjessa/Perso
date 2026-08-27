import { ScreenShell } from '@/components/ScreenShell'
import { ExpenseRow } from '@/components/ExpenseRow'
import { SummaryAmount } from '@/components/SummaryAmount'
import { SummaryBalloon } from '@/components/SummaryBalloon'
import { PeriodTabs } from '@/components/PeriodTabs'
import { CategorySpendPanel, PeriodArrow } from '@/components/CategorySpendPanel'
import { colors, fonts } from '@/lib/theme'
import {
  canShiftPeriodForward,
  formatPeriodCaption,
  isInPeriod,
  shiftPeriodDate,
  type SpendPeriod,
} from '@/lib/format'
import { useExpenses } from '@/lib/hooks'
import { useHideLock } from '@/lib/hideLock'
import { LinearGradient } from 'expo-linear-gradient'
import { PieChart } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'

export default function DepensesScreen() {
  const { items, loading, error } = useExpenses()
  const { unlocked, lock } = useHideLock()
  const [period, setPeriod] = useState<SpendPeriod>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const visible = useMemo(
    () => items.filter((item) => isInPeriod(item.spent_at, period, cursor)),
    [cursor, items, period]
  )
  const page = usePage(visible, `${period}-${cursor.toISOString()}`)
  const total = visible.reduce((sum, e) => sum + Number(e.amount), 0)
  const hiddenCount = visible.filter((item) => item.hidden).length
  const caption = formatPeriodCaption(period, cursor)
  const canNext = canShiftPeriodForward(cursor, period)

  return (
    <YStack flex={1}>
      <ScreenShell title="Dépenses" loading={loading} error={error}>
        <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
          <LinearGradient
            colors={[colors.black, '#1C1638', colors.indigo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 18, paddingHorizontal: 10, overflow: 'hidden' }}
          >
            <SummaryBalloon
              id="spend-balloon"
              size={220}
              color="#FFFFFF"
              opacity={0.12}
              style={{ right: -56, top: -48 }}
            />
            <YStack paddingHorizontal={8}>
              <PeriodTabs value={period} onChange={setPeriod} />
            </YStack>
            <XStack alignItems="center">
              <PeriodArrow
                side="left"
                light
                onPress={() => setCursor((current) => shiftPeriodDate(current, period, -1))}
              />
              <YStack flex={1} paddingHorizontal={6}>
                <SummaryAmount caption={`Total · ${caption}`} amount={total} />
              </YStack>
              <PeriodArrow
                side="right"
                light
                disabled={!canNext}
                onPress={() => setCursor((current) => shiftPeriodDate(current, period, 1))}
              />
            </XStack>
          </LinearGradient>
        </View>
        <XStack justifyContent="flex-end" marginBottom={16}>
          <Pressable onPress={() => setCategoriesOpen(true)} hitSlop={8}>
            <XStack
              height={36}
              borderRadius={14}
              paddingHorizontal={12}
              alignItems="center"
              gap={8}
              backgroundColor={colors.card}
            >
              <PieChart size={16} color={colors.indigo} />
              <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.indigo }}>Catégories</Text>
            </XStack>
          </Pressable>
        </XStack>
        {unlocked && hiddenCount > 0 ? (
          <Pressable onPress={lock}>
            <XStack justifyContent="flex-end" marginBottom={12}>
              <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.indigo }}>
                Verrouiller les dépenses masquées
              </Text>
            </XStack>
          </Pressable>
        ) : null}
        {items.length === 0 ? (
          <Text style={{ ...fonts.regular, color: colors.muted }}>Ajoute ta première dépense.</Text>
        ) : visible.length === 0 ? (
          <Text style={{ ...fonts.regular, color: colors.muted }}>
            Aucune dépense {caption.toLowerCase()}.
          </Text>
        ) : (
          page.slice.map((item) => <ExpenseRow key={item.id} item={item} />)
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
      <CategorySpendPanel
        open={categoriesOpen}
        items={visible}
        period={period}
        cursor={cursor}
        onPeriod={setPeriod}
        onCursor={setCursor}
        onClose={() => setCategoriesOpen(false)}
      />
    </YStack>
  )
}
