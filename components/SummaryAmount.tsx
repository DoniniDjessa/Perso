import { colors, fonts } from '@/lib/theme'
import { formatAmount } from '@/lib/format'
import { useAmountMask } from '@/lib/amountMask'
import { Eye, EyeOff } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function SummaryAmount({
  caption,
  amount,
  currency,
  captionColor = 'rgba(255,255,255,0.8)',
  amountColor = colors.white,
  iconColor = colors.white,
  size = 34,
}: {
  caption: string
  amount: number
  currency?: string
  captionColor?: string
  amountColor?: string
  iconColor?: string
  size?: number
}) {
  const { hidden, toggle } = useAmountMask()

  return (
    <XStack alignItems="flex-end" justifyContent="space-between" gap={12}>
      <YStack flex={1}>
        <Text style={{ ...fonts.medium, fontSize: 13, color: captionColor }}>{caption}</Text>
        <Text style={{ ...fonts.extra, fontSize: size, color: amountColor, marginTop: 4 }}>
          {hidden ? '****' : formatAmount(amount, currency)}
        </Text>
      </YStack>
      <Pressable onPress={toggle} hitSlop={12} style={{ paddingBottom: 6 }}>
        {hidden ? <EyeOff size={22} color={iconColor} /> : <Eye size={22} color={iconColor} />}
      </Pressable>
    </XStack>
  )
}
