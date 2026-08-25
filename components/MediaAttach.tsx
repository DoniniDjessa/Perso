import { colors, fonts } from '@/lib/theme'
import { pickAudioFile, pickVideoFile, type PickedMedia } from '@/lib/compress'
import { Mic, Video } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function MediaAttach({
  kind,
  uri,
  label,
  onChange,
}: {
  kind: 'video' | 'audio'
  uri: string | null
  label?: string | null
  onChange: (file: PickedMedia | null) => void
}) {
  const pick = async () => {
    const next = kind === 'video' ? await pickVideoFile() : await pickAudioFile()
    if (next) onChange(next)
  }
  const added = Boolean(uri)
  const Icon = kind === 'video' ? Video : Mic

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
          <Icon size={22} color={colors.black} />
          <YStack flex={1}>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>
              {added
                ? kind === 'video'
                  ? 'Vidéo ajoutée'
                  : 'Audio ajouté'
                : kind === 'video'
                  ? 'Ajouter une vidéo'
                  : 'Ajouter un audio'}
            </Text>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
              {added
                ? label || 'Prêt à enregistrer'
                : 'Si le fichier est trop lourd, ajoute un lien'}
            </Text>
          </YStack>
          {added ? (
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
