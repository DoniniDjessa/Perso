import { ScreenShell } from '@/components/ScreenShell'
import { ExpenseRow } from '@/components/ExpenseRow'
import { SummaryAmount } from '@/components/SummaryAmount'
import { SummaryBalloon } from '@/components/SummaryBalloon'
import { PeriodTabs } from '@/components/PeriodTabs'
import { colors, fonts } from '@/lib/theme'
import { isInPeriod, SPEND_PERIOD_CAPTION, type SpendPeriod } from '@/lib/format'
import { useExpenses } from '@/lib/hooks'
import { useHideLock } from '@/lib/hideLock'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text, XStack } from 'tamagui'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'

export default function DepensesScreen() {
  const { items, loading, error } = useExpenses()
  const { unlocked, lock } = useHideLock()
  const [period, setPeriod] = useState<SpendPeriod>('month')
  const visible = items.filter((item) => isInPeriod(item.spent_at, period))
  const page = usePage(visible, period)
  const total = visible.reduce((sum, e) => sum + Number(e.amount), 0)
  const hiddenCount = visible.filter((item) => item.hidden).length

  return (
    <ScreenShell title="Dépenses" loading={loading} error={error}>
      <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
        <LinearGradient
          colors={[colors.black, '#1C1638', colors.indigo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18, overflow: 'hidden' }}
        >
          <SummaryBalloon
            id="spend-balloon"
            size={220}
            color="#FFFFFF"
            opacity={0.12}
            style={{ right: -56, top: -48 }}
          />
          <PeriodTabs value={period} onChange={setPeriod} />
          <SummaryAmount caption={`Total · ${SPEND_PERIOD_CAPTION[period]}`} amount={total} />
        </LinearGradient>
      </View>
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
          Aucune dépense {SPEND_PERIOD_CAPTION[period].toLowerCase()}.
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
  )
}
