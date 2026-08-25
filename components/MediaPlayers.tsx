import { Audio, ResizeMode, Video } from 'expo-av'
import { colors, fonts } from '@/lib/theme'
import { Pause, Play } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function VideoPlayer({ uri }: { uri: string }) {
  return (
    <Video
      source={{ uri }}
      useNativeControls
      resizeMode={ResizeMode.CONTAIN}
      style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: colors.black }}
    />
  )
}

export function AudioPlayer({ uri }: { uri: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    let mounted = true
    const next = new Audio.Sound()
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => undefined)
    next
      .loadAsync({ uri })
      .then(() => {
        if (mounted) setSound(next)
      })
      .catch(() => undefined)
    next.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return
      setPlaying(status.isPlaying)
      if (status.didJustFinish) setPlaying(false)
    })
    return () => {
      mounted = false
      void next.unloadAsync()
    }
  }, [uri])

  const toggle = async () => {
    if (!sound) return
    const status = await sound.getStatusAsync()
    if (!status.isLoaded) return
    if (status.isPlaying) await sound.pauseAsync()
    else await sound.playAsync()
  }

  return (
    <Pressable onPress={() => void toggle()}>
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={14}
        alignItems="center"
        gap={12}
      >
        <YStack
          width={40}
          height={40}
          borderRadius={14}
          backgroundColor={colors.violetSoft}
          alignItems="center"
          justifyContent="center"
        >
          {playing ? <Pause size={18} color={colors.indigo} /> : <Play size={18} color={colors.indigo} />}
        </YStack>
        <Text style={{ ...fonts.semibold, color: colors.black }}>
          {playing ? 'Pause' : 'Écouter l’audio'}
        </Text>
      </XStack>
    </Pressable>
  )
}
