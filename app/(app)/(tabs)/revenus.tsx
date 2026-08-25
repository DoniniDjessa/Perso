import { ScreenShell } from '@/components/ScreenShell'
import { PeopleChips } from '@/components/PeopleChips'
import { SummaryAmount } from '@/components/SummaryAmount'
import { SummaryBalloon } from '@/components/SummaryBalloon'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { formatAmount, formatDay } from '@/lib/format'
import { useIncomes } from '@/lib/hooks'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, View } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'

export default function RevenusScreen() {
  const { openForm } = useFormDrawer()
  const { items, loading, error } = useIncomes()
  const page = usePage(items)
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0)

  return (
    <ScreenShell title="Revenus" loading={loading} error={error}>
      <View style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
        <LinearGradient
          colors={[colors.indigo, colors.violetLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18, overflow: 'hidden' }}
        >
          <SummaryBalloon
            id="income-balloon"
            size={220}
            color="#111111"
            opacity={0.12}
            style={{ right: -56, top: -48 }}
          />
          <SummaryAmount caption="Total reçu" amount={total} />
        </LinearGradient>
      </View>
      {items.length === 0 ? (
        <Text style={{ ...fonts.regular, color: colors.muted }}>
          Ajoute un revenu : salaire, business, famille, cadeau…
        </Text>
      ) : (
        page.slice.map((item) => (
          <Pressable key={item.id} onPress={() => openForm('income', item)}>
            <XStack
              backgroundColor={colors.card}
              borderRadius={16}
              padding={16}
              marginBottom={10}
              justifyContent="space-between"
              alignItems="center"
            >
              <YStack flex={1} paddingRight={12}>
                <Text style={{ ...fonts.bold, color: colors.black }}>{item.label}</Text>
                <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12, marginTop: 2 }}>
                  {item.category ? `${item.category} · ` : ''}
                  {formatDay(item.received_at)}
                </Text>
                {item.notes ? (
                  <Text
                    style={{ ...fonts.regular, color: colors.muted, fontSize: 13, marginTop: 4 }}
                    numberOfLines={2}
                  >
                    {item.notes}
                  </Text>
                ) : null}
                <PeopleChips people={item.people} />
              </YStack>
              <Text style={{ ...fonts.extra, color: colors.indigo }}>
                {formatAmount(item.amount, item.currency)}
              </Text>
            </XStack>
          </Pressable>
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
