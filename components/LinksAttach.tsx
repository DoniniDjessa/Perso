import { Field } from '@/components/Field'
import { colors, fonts } from '@/lib/theme'
import { Plus, Trash2 } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function LinksAttach({
  links,
  onChange,
}: {
  links: string[]
  onChange: (links: string[]) => void
}) {
  const setAt = (index: number, value: string) => {
    onChange(links.map((item, i) => (i === index ? value : item)))
  }
  const removeAt = (index: number) => {
    onChange(links.filter((_, i) => i !== index))
  }

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
        LIENS
      </Text>
      {links.map((link, index) => (
        <Field
          key={`link-${index}`}
          placeholder="https://…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={link}
          onChangeText={(value) => setAt(index, value)}
          right={
            <Pressable onPress={() => removeAt(index)} hitSlop={8} style={{ paddingRight: 12 }}>
              <Trash2 size={16} color={colors.muted} />
            </Pressable>
          }
        />
      ))}
      <Pressable onPress={() => onChange([...links, ''])}>
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={16}
          height={48}
          alignItems="center"
          gap={10}
        >
          <Plus size={18} color={colors.indigo} />
          <Text style={{ ...fonts.semibold, color: colors.indigo }}>Ajouter un lien</Text>
        </XStack>
      </Pressable>
    </YStack>
  )
}
