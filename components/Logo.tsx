import { Image } from 'expo-image'
import { colors, fonts } from '@/lib/theme'
import { Text, XStack, YStack } from 'tamagui'

export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/icon.png')}
      style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: '#111111' }}
      contentFit="cover"
      cachePolicy="none"
    />
  )
}

export function LogoLockup() {
  return (
    <XStack alignItems="center" gap="$3">
      <LogoMark size={40} />
      <YStack>
        <Text style={{ ...fonts.extra, fontSize: 18, color: colors.black }}>Perso</Text>
        <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted }}>
          Dépenses · TODOs · Agenda
        </Text>
      </YStack>
    </XStack>
  )
}
