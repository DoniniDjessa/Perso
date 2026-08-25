import { useAgenda, useCredits, useTodos } from '@/lib/hooks'
import { useAuth } from '@/lib/auth'
import {
  handleReminderReceived,
  notificationTarget,
  persistPushToken,
  stopReminderAlarm,
  syncNotifications,
} from '@/lib/notifications'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'

export function NotificationSync() {
  const { profile, user, refreshProfile } = useAuth()
  const todos = useTodos()
  const agenda = useAgenda()
  const credits = useCredits()

  useEffect(() => {
    if (Platform.OS === 'web' || !user) return
    let active = true
    void (async () => {
      try {
        const token = await persistPushToken(user, profile?.push_token)
        if (!active || !token || token === profile?.push_token) return
        await refreshProfile()
      } catch {
        // Push registration must never crash the app.
      }
    })()
    return () => {
      active = false
    }
  }, [profile?.push_token, refreshProfile, user])

  useEffect(() => {
    if (Platform.OS === 'web') return
    if (todos.loading || agenda.loading || credits.loading) return
    void syncNotifications(todos.items, agenda.items, credits.items, profile)
  }, [
    agenda.items,
    agenda.loading,
    credits.items,
    credits.loading,
    profile,
    todos.items,
    todos.loading,
  ])

  useEffect(() => {
    if (Platform.OS === 'web') return
    const received = Notifications.addNotificationReceivedListener((notification) => {
      void handleReminderReceived(notification.request.content.data)
    })
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      void stopReminderAlarm()
      const href = notificationTarget(response.notification.request.content.data)
      if (href) router.push(href)
    })
    return () => {
      received.remove()
      sub.remove()
    }
  }, [])

  return null
}
