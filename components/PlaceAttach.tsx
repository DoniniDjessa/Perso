import { colors, fonts } from '@/lib/theme'
import { captureCurrentPosition, type MapPoint } from '@/lib/maps'
import { FlatIcon } from '@/components/FlatIcon'
import { X } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Platform, Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function PlaceAttach({
  point,
  onChange,
}: {
  point: MapPoint | null
  onChange: (point: MapPoint | null) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const capture = async () => {
    if (Platform.OS === 'web') {
      setError('La position est disponible sur iOS et Android.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      onChange(await captureCurrentPosition())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Position impossible.')
    }
    setBusy(false)
  }

  return (
    <YStack gap={8}>
      <Pressable onPress={() => void capture()} disabled={busy}>
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={16}
          paddingVertical={14}
          alignItems="center"
          gap={14}
        >
          {busy ? <ActivityIndicator color={colors.indigo} /> : <FlatIcon name="pin" size={22} />}
          <YStack flex={1}>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>
              {point ? 'Position ajoutée' : 'Ajouter la position'}
            </Text>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={2}>
              {point ? point.label : 'Enregistrer le GPS pour ouvrir Google Maps plus tard'}
            </Text>
          </YStack>
          {point ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                onChange(null)
              }}
              hitSlop={8}
            >
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </XStack>
      </Pressable>
      {error ? <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text> : null}
    </YStack>
  )
}
