import { ScreenShell } from '@/components/ScreenShell'
import { PeopleChips } from '@/components/PeopleChips'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { formatAmount, formatDay } from '@/lib/format'
import { creditDirectionLabel } from '@/lib/categories'
import { useCredits } from '@/lib/hooks'
import { useAmountMask } from '@/lib/amountMask'
import { Eye, EyeOff } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'

export default function CreditsScreen() {
  const { openForm } = useFormDrawer()
  const { items, loading, error } = useCredits()
  const page = usePage(items)
  const { hidden, toggle } = useAmountMask()
  const openItems = items.filter((item) => !item.repaid)
  const owedToMe = openItems
    .filter((item) => item.direction === 'lent')
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const iOwe = openItems
    .filter((item) => item.direction === 'borrowed')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  return (
    <ScreenShell title="Crédits" loading={loading} error={error}>
      <XStack gap={10} marginBottom={16} alignItems="stretch">
        <YStack flex={1} backgroundColor={colors.card} borderRadius={16} padding={14}>
          <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>On me doit</Text>
          <Text style={{ ...fonts.extra, fontSize: 20, color: colors.indigo, marginTop: 4 }}>
            {hidden ? '****' : formatAmount(owedToMe)}
          </Text>
        </YStack>
        <YStack flex={1} backgroundColor={colors.card} borderRadius={16} padding={14}>
          <XStack alignItems="center" justifyContent="space-between">
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>Je dois</Text>
            <Pressable onPress={toggle} hitSlop={10}>
              {hidden ? (
                <EyeOff size={18} color={colors.muted} />
              ) : (
                <Eye size={18} color={colors.muted} />
              )}
            </Pressable>
          </XStack>
          <Text style={{ ...fonts.extra, fontSize: 20, color: colors.black, marginTop: 4 }}>
            {hidden ? '****' : formatAmount(iOwe)}
          </Text>
        </YStack>
      </XStack>
      {items.length === 0 ? (
        <Text style={{ ...fonts.regular, color: colors.muted }}>
          Ajoute un crédit : un prêt que tu as fait, ou une somme que tu dois.
        </Text>
      ) : (
        page.slice.map((item) => (
          <Pressable key={item.id} onPress={() => openForm('credit', item)}>
            <XStack
              backgroundColor={colors.card}
              borderRadius={16}
              padding={16}
              marginBottom={10}
              justifyContent="space-between"
              alignItems="center"
              opacity={item.repaid ? 0.55 : 1}
            >
              <YStack flex={1} paddingRight={12}>
                <Text
                  style={{
                    ...fonts.bold,
                    color: colors.black,
                    textDecorationLine: item.repaid ? 'line-through' : 'none',
                  }}
                >
                  {item.label}
                </Text>
                <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12, marginTop: 2 }}>
                  {creditDirectionLabel(item.direction)}
                  {item.repaid ? ' · Remboursé' : ''}
                  {' · '}
                  {formatDay(item.opened_at)}
                  {item.due_at ? ` · échéance ${formatDay(item.due_at)}` : ''}
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
              <Text style={{ ...fonts.extra, color: item.direction === 'lent' ? colors.indigo : colors.black }}>
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
