import { SPEND_PERIODS, type SpendPeriod } from '@/lib/format'
import { colors, fonts } from '@/lib/theme'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function PeriodTabs({
  value,
  onChange,
  tone = 'dark',
}: {
  value: SpendPeriod
  onChange: (value: SpendPeriod) => void
  tone?: 'dark' | 'light'
}) {
  const dark = tone === 'dark'
  return (
    <XStack gap={6} marginBottom={dark ? 18 : 0}>
      {SPEND_PERIODS.map((item) => {
        const active = value === item.id
        return (
          <Pressable key={item.id} onPress={() => onChange(item.id)} style={{ flex: 1 }}>
            <YStack
              height={32}
              borderRadius={16}
              alignItems="center"
              justifyContent="center"
              backgroundColor={
                active
                  ? dark
                    ? 'rgba(255,255,255,0.95)'
                    : colors.indigo
                  : dark
                    ? 'rgba(255,255,255,0.16)'
                    : colors.card
              }
            >
              <Text
                style={{
                  ...fonts.semibold,
                  fontSize: 11,
                  color: active ? (dark ? colors.indigo : colors.white) : dark ? colors.white : colors.muted,
                }}
              >
                {item.label}
              </Text>
            </YStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
