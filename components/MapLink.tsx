import { colors, fonts } from '@/lib/theme'
import { openGoogleMaps, type MapPoint } from '@/lib/maps'
import { FlatIcon } from '@/components/FlatIcon'
import { Pressable } from 'react-native'
import { Text, XStack } from 'tamagui'

export function MapLink({ point }: { point?: MapPoint | null }) {
  if (!point) return null
  return (
    <Pressable onPress={() => openGoogleMaps(point)}>
      <XStack alignItems="center" gap={6} marginTop={4}>
        <FlatIcon name="pin" size={14} />
        <Text style={{ ...fonts.semibold, fontSize: 12, color: colors.indigo }} numberOfLines={1}>
          {point.label} · Google Maps
        </Text>
      </XStack>
    </Pressable>
  )
}
