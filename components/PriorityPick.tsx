import { AGENDA_PRIORITIES, type AgendaPriority } from '@/lib/priority'
import { colors, fonts } from '@/lib/theme'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function PriorityPick({
  value,
  onChange,
}: {
  value: AgendaPriority
  onChange: (value: AgendaPriority) => void
}) {
  const current = Number(value)

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
        PRIORITÉ
      </Text>
      <XStack gap={8}>
        {AGENDA_PRIORITIES.map((item) => {
          const active = current === item.value
          return (
            <Pressable
              key={item.value}
              onPress={() => onChange(item.value)}
              style={{ flex: 1 }}
            >
              <YStack
                alignItems="center"
                justifyContent="center"
                gap={6}
                height={56}
                borderRadius={16}
                backgroundColor={active ? colors.violetSoft : colors.card}
                borderWidth={active ? 2 : 0}
                borderColor={item.color}
              >
                <YStack width={10} height={10} borderRadius={5} backgroundColor={item.color} />
                <Text
                  style={{
                    ...fonts.semibold,
                    fontSize: 13,
                    color: active ? colors.indigo : colors.muted,
                  }}
                >
                  {item.label}
                </Text>
              </YStack>
            </Pressable>
          )
        })}
      </XStack>
    </YStack>
  )
}
