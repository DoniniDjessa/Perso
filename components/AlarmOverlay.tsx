import { colors, fonts } from '@/lib/theme'
import type { AlarmPayload } from '@/lib/alarm'
import { notificationTarget } from '@/lib/notifications'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { BellRing } from 'lucide-react-native'
import { Modal, Pressable, StatusBar } from 'react-native'
import { Text, YStack } from 'tamagui'

export function AlarmOverlay({
  alarm,
  onStop,
}: {
  alarm: AlarmPayload | null
  onStop: () => void
}) {
  if (!alarm) return null

  const open = () => {
    const href = notificationTarget({ kind: alarm.kind })
    onStop()
    if (href) router.push(href)
  }

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1E1B4B', '#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', padding: 28 }}
      >
        <YStack alignItems="center" gap={18}>
          <YStack
            width={88}
            height={88}
            borderRadius={44}
            backgroundColor="rgba(255,255,255,0.16)"
            alignItems="center"
            justifyContent="center"
          >
            <BellRing size={40} color={colors.white} />
          </YStack>
          <Text style={{ ...fonts.bold, fontSize: 13, letterSpacing: 2, color: 'rgba(255,255,255,0.7)' }}>
            ALERTE
          </Text>
          <Text
            style={{
              ...fonts.extra,
              fontSize: 32,
              lineHeight: 38,
              color: colors.white,
              textAlign: 'center',
            }}
          >
            {alarm.title}
          </Text>
          {alarm.body ? (
            <Text
              style={{
                ...fonts.medium,
                fontSize: 16,
                color: 'rgba(255,255,255,0.82)',
                textAlign: 'center',
              }}
            >
              {alarm.body}
            </Text>
          ) : null}
        </YStack>
        <YStack marginTop={48} gap={12}>
          <Pressable onPress={onStop}>
            <YStack
              height={58}
              borderRadius={18}
              backgroundColor={colors.white}
              alignItems="center"
              justifyContent="center"
            >
              <Text style={{ ...fonts.bold, fontSize: 16, color: colors.indigo }}>Arrêter</Text>
            </YStack>
          </Pressable>
          <Pressable onPress={open}>
            <YStack height={48} alignItems="center" justifyContent="center">
              <Text style={{ ...fonts.semibold, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                Ouvrir l’élément
              </Text>
            </YStack>
          </Pressable>
        </YStack>
      </LinearGradient>
    </Modal>
  )
}
