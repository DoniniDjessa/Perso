import { PeopleChips } from '@/components/PeopleChips'
import { MapLink } from '@/components/MapLink'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { formatAmount, formatDay } from '@/lib/format'
import { useHideLock } from '@/lib/hideLock'
import { mapPointFrom } from '@/lib/maps'
import type { Expense } from '@/lib/types'
import { EyeOff } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function ExpenseRow({
  item,
  compact,
}: {
  item: Expense
  compact?: boolean
}) {
  const { openForm } = useFormDrawer()
  const { unlocked, requestUnlock, hasCode } = useHideLock()
  const masked = Boolean(item.hidden) && !unlocked

  const open = () => {
    if (!item.hidden || unlocked) {
      openForm('expense', item)
      return
    }
    if (!hasCode) {
      openForm('expense', item)
      return
    }
    requestUnlock(() => openForm('expense', item))
  }

  return (
    <Pressable onPress={open}>
      <XStack
        backgroundColor={compact ? colors.bg : colors.card}
        borderRadius={compact ? 14 : 16}
        padding={compact ? undefined : 16}
        paddingHorizontal={compact ? 12 : undefined}
        paddingVertical={compact ? 10 : undefined}
        marginBottom={compact ? 8 : 10}
        justifyContent="space-between"
        alignItems="center"
        gap={10}
      >
        <YStack flex={1} paddingRight={compact ? 0 : 12}>
          <XStack alignItems="center" gap={8}>
            {item.hidden ? <EyeOff size={16} color={colors.muted} /> : null}
            <Text
              style={{ ...(compact ? fonts.semibold : fonts.bold), color: colors.black, flex: 1 }}
              numberOfLines={1}
            >
              {masked ? '••••••••' : item.label}
            </Text>
          </XStack>
          <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12, marginTop: 2 }}>
            {masked
              ? 'Masquée'
              : compact
                ? item.category ?? 'Sans catégorie'
                : `${item.category ? `${item.category} · ` : ''}${formatDay(item.spent_at)}`}
          </Text>
          {!compact && !masked ? (
            <>
              <PeopleChips people={item.people} />
              <MapLink point={mapPointFrom(item)} />
            </>
          ) : null}
        </YStack>
        <Text style={{ ...fonts.extra, color: compact ? colors.indigo : colors.black }}>
          {masked ? '••••' : formatAmount(item.amount, item.currency)}
        </Text>
      </XStack>
    </Pressable>
  )
}
