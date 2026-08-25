import { colors, fonts } from '@/lib/theme'
import { pickCompressedImage } from '@/lib/compress'
import { FlatIcon } from '@/components/FlatIcon'
import { Image as ExpoImage } from 'expo-image'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function ImageAttach({
  uri,
  onChange,
}: {
  uri: string | null
  onChange: (uri: string | null) => void
}) {
  const pick = async () => {
    const next = await pickCompressedImage()
    if (next) onChange(next)
  }

  return (
    <Pressable onPress={() => void pick()}>
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={14}
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack alignItems="center" gap={14} flex={1} paddingRight={12}>
          {uri ? (
            <ExpoImage
              source={{ uri }}
              style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.gray }}
              contentFit="cover"
            />
          ) : (
            <FlatIcon name="image" size={22} />
          )}
          <YStack flex={1}>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>
              {uri ? 'Image ajoutée' : 'Ajouter une image'}
            </Text>
          </YStack>
          {uri ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                onChange(null)
              }}
              hitSlop={8}
            >
              <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.muted }}>Retirer</Text>
            </Pressable>
          ) : null}
        </XStack>
      </XStack>
    </Pressable>
  )
}
