import { colors, fonts } from '@/lib/theme'
import { FlatIcon } from '@/components/FlatIcon'
import { ChevronDown } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function CategoryPick({
  value,
  onChange,
  options,
  label = 'CATÉGORIE',
}: {
  value: string | null
  onChange: (value: string | null) => void
  options: readonly string[]
  label?: string
}) {
  const [open, setOpen] = useState(false)

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
        {label}
      </Text>
      <Pressable onPress={() => setOpen((current) => !current)}>
        <XStack
          alignItems="center"
          justifyContent="space-between"
          backgroundColor={colors.card}
          borderRadius={16}
          height={56}
          paddingHorizontal={16}
        >
          <XStack flex={1} alignItems="center" gap={10} paddingRight={8}>
            <FlatIcon name="tag" size={22} />
            <Text
              style={{
                ...fonts.regular,
                fontSize: 16,
                color: value ? colors.text : 'rgba(17,17,17,0.28)',
              }}
            >
              {value ?? 'Choisir une catégorie'}
            </Text>
          </XStack>
          <ChevronDown size={18} color={colors.muted} />
        </XStack>
      </Pressable>
      {open ? (
        <YStack backgroundColor={colors.card} borderRadius={16} paddingVertical={6} overflow="hidden">
          <Option
            label="Aucune"
            active={!value}
            onPress={() => {
              onChange(null)
              setOpen(false)
            }}
          />
          {options.map((item) => (
            <Option
              key={item}
              label={item}
              active={value === item}
              onPress={() => {
                onChange(item)
                setOpen(false)
              }}
            />
          ))}
        </YStack>
      ) : null}
    </YStack>
  )
}

function Option({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <XStack
        paddingHorizontal={16}
        paddingVertical={12}
        backgroundColor={active ? colors.violetSoft : 'transparent'}
      >
        <Text style={{ ...fonts.medium, fontSize: 15, color: active ? colors.indigo : colors.black }}>
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}
