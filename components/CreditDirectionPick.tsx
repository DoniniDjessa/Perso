import { CREDIT_DIRECTIONS, type CreditDirection } from '@/lib/categories'
import { colors, fonts } from '@/lib/theme'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function CreditDirectionPick({
  value,
  onChange,
}: {
  value: CreditDirection
  onChange: (value: CreditDirection) => void
}) {
  return (
    <YStack gap={8}>
      <Text
        style={{
          ...fonts.bold,
          fontSize: 10,
          color: colors.indigo,
          letterSpacing: 1.4,
          marginLeft: 4,
        }}
      >
        TYPE
      </Text>
      <XStack gap={8}>
        {CREDIT_DIRECTIONS.map((item) => {
          const active = value === item.value
          return (
            <Pressable key={item.value} onPress={() => onChange(item.value)} style={{ flex: 1 }}>
              <YStack
                backgroundColor={active ? colors.indigo : colors.card}
                borderRadius={16}
                paddingVertical={12}
                paddingHorizontal={10}
                alignItems="center"
              >
                <Text style={{ ...fonts.semibold, color: active ? colors.white : colors.black }}>
                  {item.label}
                </Text>
                <Text
                  style={{
                    ...fonts.medium,
                    fontSize: 11,
                    color: active ? 'rgba(255,255,255,0.8)' : colors.muted,
                    marginTop: 2,
                  }}
                >
                  {item.hint}
                </Text>
              </YStack>
            </Pressable>
          )
        })}
      </XStack>
    </YStack>
  )
}
