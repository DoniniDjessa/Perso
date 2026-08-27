import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Platform, Vibration } from 'react-native'
import { Audio } from 'expo-av'
import * as Notifications from 'expo-notifications'
import { REMINDER_SOUND_ASSETS, type ReminderSound } from '@/lib/reminder'
import { AlarmOverlay } from '@/components/AlarmOverlay'
import { notificationTarget } from '@/lib/notifications'
import { router } from 'expo-router'

export type AlarmPayload = {
  kind: string
  id: string
  title: string
  body: string
  sound: ReminderSound
  identifier?: string
}

type AlarmContextValue = {
  alarm: AlarmPayload | null
  presentAlarm: (payload: AlarmPayload) => void
  dismissAlarm: () => void
}

const AlarmContext = createContext<AlarmContextValue | null>(null)

export function useAlarm() {
  const ctx = useContext(AlarmContext)
  if (!ctx) throw new Error('useAlarm must be used within AlarmProvider')
  return ctx
}

let ringing: Audio.Sound | null = null
let lastAlarmKey = ''

async function stopRing() {
  Vibration.cancel()
  if (!ringing) return
  try {
    await ringing.stopAsync()
    await ringing.unloadAsync()
  } catch {
    // already released
  }
  ringing = null
}

async function startRing(sound: ReminderSound) {
  await stopRing()
  if (Platform.OS === 'web') return
  Vibration.vibrate([0, 900, 350, 900, 350, 1200], true)
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    })
    const { sound: player } = await Audio.Sound.createAsync(REMINDER_SOUND_ASSETS[sound] ?? REMINDER_SOUND_ASSETS.alarm, {
      isLooping: true,
      volume: 1,
      shouldPlay: true,
    })
    ringing = player
  } catch (e) {
    console.log('[Perso] Alerte sonore impossible:', e instanceof Error ? e.message : e)
  }
}

function asAlarm(data: Record<string, unknown> | undefined | null, fallbackTitle = 'Alerte'): AlarmPayload | null {
  if (!data || data.mode !== 'alert') return null
  const sound = data.sound
  return {
    kind: String(data.kind ?? ''),
    id: String(data.id ?? ''),
    title: typeof data.alarmTitle === 'string' ? data.alarmTitle : fallbackTitle,
    body: typeof data.alarmBody === 'string' ? data.alarmBody : '',
    sound: sound === 'chime' || sound === 'urgent' || sound === 'default' ? sound : 'alarm',
    identifier: typeof data.identifier === 'string' ? data.identifier : undefined,
  }
}

export function AlarmProvider({ children }: { children: ReactNode }) {
  const [alarm, setAlarm] = useState<AlarmPayload | null>(null)

  const presentAlarm = useCallback((payload: AlarmPayload) => {
    const key = payload.identifier || `${payload.kind}-${payload.id}-${payload.title}`
    if (key === lastAlarmKey) return
    lastAlarmKey = key
    setAlarm(payload)
    void startRing(payload.sound)
  }, [])

  const dismissAlarm = useCallback(() => {
    lastAlarmKey = ''
    setAlarm(null)
    void stopRing()
    void Notifications.clearLastNotificationResponseAsync?.().catch(() => undefined)
  }, [])

  useEffect(() => {
    return () => {
      void stopRing()
    }
  }, [])

  useEffect(() => {
    if (Platform.OS === 'web') return
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const next = asAlarm(
        notification.request.content.data as Record<string, unknown>,
        notification.request.content.title ?? 'Alerte'
      )
      if (!next) return
      presentAlarm({
        ...next,
        title: notification.request.content.title ?? next.title,
        body: notification.request.content.body ?? next.body,
        identifier: notification.request.identifier,
      })
    })
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      const content = event.notification.request.content
      const data = content.data as Record<string, unknown>
      const next = asAlarm(data, content.title ?? 'Alerte')
      if (next) {
        presentAlarm({
          ...next,
          title: content.title ?? next.title,
          body: content.body ?? next.body,
          identifier: event.notification.request.identifier,
        })
        return
      }
      void stopRing()
      const href = notificationTarget(data)
      if (href) router.push(href)
    })
    void Notifications.getLastNotificationResponseAsync().then((event) => {
      if (!event) return
      const content = event.notification.request.content
      const next = asAlarm(content.data as Record<string, unknown>, content.title ?? 'Alerte')
      if (!next) return
      presentAlarm({
        ...next,
        title: content.title ?? next.title,
        body: content.body ?? next.body,
        identifier: event.notification.request.identifier,
      })
    })
    return () => {
      received.remove()
      response.remove()
    }
  }, [presentAlarm])

  const value = useMemo(() => ({ alarm, presentAlarm, dismissAlarm }), [alarm, presentAlarm, dismissAlarm])

  return (
    <AlarmContext.Provider value={value}>
      {children}
      <AlarmOverlay alarm={alarm} onStop={dismissAlarm} />
    </AlarmContext.Provider>
  )
}
