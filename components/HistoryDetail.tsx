import { AudioPlayer, VideoPlayer } from '@/components/MediaPlayers'
import { MapLink } from '@/components/MapLink'
import { PeopleChips } from '@/components/PeopleChips'
import { PrimaryButton } from '@/components/PrimaryButton'
import { signedImageUrl } from '@/lib/compress'
import { formatDay, formatTime } from '@/lib/format'
import { asLinkList } from '@/lib/links'
import { mapPointFrom } from '@/lib/maps'
import { deleteRow } from '@/lib/save'
import { errorMessage } from '@/lib/errors'
import { colors, fonts } from '@/lib/theme'
import { tables } from '@/lib/db'
import type { HistoryProof } from '@/lib/types'
import { Image as ExpoImage } from 'expo-image'
import * as Linking from 'expo-linking'
import { ExternalLink, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Separator, Text, XStack, YStack } from 'tamagui'

export function HistoryDetail({
  item,
  onClose,
  onEdit,
  onDeleted,
}: {
  item: HistoryProof
  onClose: () => void
  onEdit: () => void
  onDeleted: () => void
}) {
  const insets = useSafeAreaInsets()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const links = asLinkList(item.links)

  useEffect(() => {
    let active = true
    signedImageUrl(item.image_path).then((url) => {
      if (active) setImageUrl(url)
    })
    signedImageUrl(item.video_path).then((url) => {
      if (active) setVideoUrl(url)
    })
    signedImageUrl(item.audio_path).then((url) => {
      if (active) setAudioUrl(url)
    })
    return () => {
      active = false
    }
  }, [item.audio_path, item.image_path, item.video_path])

  const remove = () => {
    Alert.alert('Supprimer ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true)
            try {
              await deleteRow(tables.history, item.id, [item.image_path, item.audio_path, item.video_path])
              onDeleted()
            } catch (e) {
              setError(errorMessage(e, 'Suppression impossible.'))
            } finally {
              setBusy(false)
            }
          })()
        },
      },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={20}
        paddingTop={insets.top + 28}
        paddingBottom={16}
      >
        <Text
          style={{ ...fonts.extra, fontSize: 22, color: colors.black, flex: 1, paddingRight: 12 }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <XStack
            width={40}
            height={40}
            borderRadius={16}
            backgroundColor={colors.card}
            alignItems="center"
            justifyContent="center"
          >
            <X size={18} color={colors.black} />
          </XStack>
        </Pressable>
      </XStack>
      <Separator borderColor={colors.border} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 12, gap: 12, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 13 }}>
          {formatDay(item.proof_at)} · {formatTime(item.proof_at)}
        </Text>
        {item.notes ? (
          <Text style={{ ...fonts.regular, color: colors.black, fontSize: 15, lineHeight: 22 }}>
            {item.notes}
          </Text>
        ) : null}
        <PeopleChips people={item.people} />
        <MapLink point={mapPointFrom(item)} />
        {imageUrl ? (
          <ExpoImage
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: 220, borderRadius: 16, backgroundColor: colors.gray }}
            contentFit="cover"
          />
        ) : null}
        {videoUrl ? <VideoPlayer uri={videoUrl} /> : null}
        {audioUrl ? <AudioPlayer uri={audioUrl} /> : null}
        {links.map((link) => (
          <Pressable key={link} onPress={() => void Linking.openURL(link)}>
            <XStack
              backgroundColor={colors.card}
              borderRadius={16}
              paddingHorizontal={16}
              paddingVertical={14}
              alignItems="center"
              gap={12}
            >
              <ExternalLink size={18} color={colors.indigo} />
              <Text style={{ ...fonts.semibold, color: colors.indigo, flex: 1 }} numberOfLines={2}>
                {link}
              </Text>
            </XStack>
          </Pressable>
        ))}
        {error ? <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text> : null}
      </ScrollView>
      <YStack padding={20} paddingTop={8} gap={10}>
        <PrimaryButton label="Modifier" onPress={onEdit} disabled={busy} />
        <Pressable onPress={remove} disabled={busy}>
          <YStack height={48} alignItems="center" justifyContent="center">
            <Text style={{ ...fonts.semibold, color: colors.danger }}>Supprimer</Text>
          </YStack>
        </Pressable>
      </YStack>
    </SafeAreaView>
  )
}
