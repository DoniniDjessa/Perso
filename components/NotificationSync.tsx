import { useAgenda, useCredits, useTodos } from '@/lib/hooks'
import { useAuth } from '@/lib/auth'
import { persistPushToken, syncNotifications } from '@/lib/notifications'
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

  return null
}
