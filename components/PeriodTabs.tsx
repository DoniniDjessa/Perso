import { SPEND_PERIODS, type SpendPeriod } from '@/lib/format'
import { colors, fonts } from '@/lib/theme'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function PeriodTabs({
  value,
  onChange,
}: {
  value: SpendPeriod
  onChange: (value: SpendPeriod) => void
}) {
  return (
    <XStack gap={6} marginBottom={18}>
      {SPEND_PERIODS.map((item) => {
        const active = value === item.id
        return (
          <Pressable key={item.id} onPress={() => onChange(item.id)} style={{ flex: 1 }}>
            <YStack
              height={32}
              borderRadius={16}
              alignItems="center"
              justifyContent="center"
              backgroundColor={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.16)'}
            >
              <Text
                style={{
                  ...fonts.semibold,
                  fontSize: 11,
                  color: active ? colors.indigo : colors.white,
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
