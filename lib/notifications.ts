import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { AppState, Platform } from 'react-native'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { normalizePseudo } from '@/lib/pseudo'
import type { AgendaEvent, Credit, Profile, Todo } from '@/lib/types'
import {
  expoWeekday,
  habitSummary,
  isDailyHabit,
  isHabitDoneToday,
  isHabitDueToday,
  isHabitTodo,
  nextHabitDates,
  parseHabit,
} from '@/lib/habit'
import {
  parseReminder,
  reminderFireDates,
  reminderFireDatesBefore,
  reminderFireDatesUntilDone,
  reminderOccurrences,
  REMINDER_SOUND_FILES,
  type ReminderConfig,
  type ReminderMode,
  type ReminderSound,
} from '@/lib/reminder'

type ReminderKind = 'todo' | 'agenda' | 'credit'

if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const mode = String(notification.request.content.data?.mode ?? 'push')
        const isAlert = mode === 'alert'
        const foreground = AppState.currentState === 'active'
        if (isAlert) {
          return {
            shouldShowAlert: !foreground,
            shouldPlaySound: !foreground,
            shouldSetBadge: false,
            shouldShowBanner: !foreground,
            shouldShowList: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          }
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        }
      },
    })
  } catch {
    // Native notifications can fail in a release APK; never crash startup.
  }
}

export const NOTIFY_OFFSETS = [
  { label: '5 min avant', value: 5 },
  { label: '15 min avant', value: 15 },
  { label: '30 min avant', value: 30 },
  { label: '1 h avant', value: 60 },
  { label: '1 jour avant', value: 1440 },
  { label: '2 jours avant', value: 2880 },
  { label: '3 jours avant', value: 4320 },
  { label: '1 semaine avant', value: 10080 },
] as const

function itemPrefix(kind: ReminderKind, id: string) {
  return `perso-${kind}-${id}`
}

function alertChannel(sound: ReminderSound) {
  return sound === 'default' ? 'perso-alert-default' : `perso-alert-${sound}`
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return
  const channels: {
    id: string
    name: string
    importance: Notifications.AndroidImportance
    sound?: string
    vibrationPattern: number[]
  }[] = [
    {
      id: 'perso',
      name: 'Perso',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    },
    {
      id: 'perso-push',
      name: 'Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120],
    },
    {
      id: 'perso-alert-default',
      name: 'Alertes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
    },
    {
      id: 'perso-alert-alarm',
      name: 'Alerte réveil',
      importance: Notifications.AndroidImportance.MAX,
      sound: REMINDER_SOUND_FILES.alarm,
      vibrationPattern: [0, 500, 180, 500, 180, 500],
    },
    {
      id: 'perso-alert-chime',
      name: 'Alerte carillon',
      importance: Notifications.AndroidImportance.MAX,
      sound: REMINDER_SOUND_FILES.chime,
      vibrationPattern: [0, 220, 120, 220],
    },
    {
      id: 'perso-alert-urgent',
      name: 'Alerte urgente',
      importance: Notifications.AndroidImportance.MAX,
      sound: REMINDER_SOUND_FILES.urgent,
      vibrationPattern: [0, 250, 80, 250, 80, 250, 80, 250],
    },
  ]
  for (const channel of channels) {
    const isAlert = channel.id.startsWith('perso-alert')
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: channel.importance,
      vibrationPattern: channel.vibrationPattern,
      lightColor: '#4F46E5',
      sound: channel.sound ?? 'default',
      enableVibrate: isAlert,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      ...(isAlert
        ? {
            bypassDnd: true,
            audioAttributes: {
              usage: Notifications.AndroidAudioUsage.ALARM,
              contentType: Notifications.AndroidAudioContentType.SONIFICATION,
              flags: { enforceAudibility: true, requestHardwareAudioVideoSynchronization: false },
            },
          }
        : {}),
    } as Notifications.NotificationChannelInput)
  }
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false
  await ensureAndroidChannels()
  const current = await Notifications.getPermissionsAsync()
  const status = current.granted
    ? current
    : await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      })
  return Boolean(
    status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  )
}

export async function registerPushToken() {
  if (Platform.OS === 'web') {
    console.log('[Perso] Push token: web — pas de token Expo')
    return null
  }

  const allowed = await requestNotificationPermission()
  if (!allowed) {
    console.log('[Perso] Push token: permission notifications refusée')
    return null
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    console.log('[Perso] Push token: extra.eas.projectId manquant')
    return null
  }

  try {
    const result = await Notifications.getExpoPushTokenAsync({ projectId })
    console.log('[Perso] Expo push token:', result.data)
    return result.data
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.log('[Perso] Push token: échec —', message)
    if (!Device.isDevice) {
      console.log('[Perso] Utilise un téléphone physique (ou un émulateur avec Google Play).')
    }
    console.log('[Perso] Android Expo Go ne délivre plus de token FCM — un development build est requis.')
    return null
  }
}

function fallbackPseudo(user: User) {
  const meta = normalizePseudo(String(user.user_metadata?.pseudo ?? ''))
  const fromEmail = normalizePseudo((user.email ?? 'user').split('@')[0]).replace(/[^a-z0-9._]/g, '')
  const base = (meta || fromEmail || 'user').replace(/[^a-z0-9._]/g, '') || 'user'
  const suffix = user.id.replace(/-/g, '').slice(0, 6)
  return `${base.slice(0, 17)}_${suffix}`.toLowerCase()
}

export async function persistPushToken(user: User, current?: string | null) {
  const token = await registerPushToken()
  if (!token) return null
  if (token === current) return token

  const { data, error } = await supabase
    .from(tables.profiles)
    .update({ push_token: token })
    .eq('id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.log('[Perso] Push token non enregistré en base:', error.message)
    console.log('[Perso] Exécute supabase/migrations/007_push_token.sql si la colonne manque.')
    return token
  }

  if (data) {
    console.log('[Perso] Push token enregistré pour', user.id)
    return token
  }

  const { error: insertError } = await supabase.from(tables.profiles).insert({
    id: user.id,
    email: user.email ?? '',
    pseudo: fallbackPseudo(user),
    push_token: token,
  })
  if (insertError) {
    console.log('[Perso] Impossible de créer le profil + token:', insertError.message)
    return token
  }
  console.log('[Perso] Profil existant complété avec un push token pour', user.id)
  return token
}

function contentSound(mode: ReminderMode, sound: ReminderSound) {
  if (mode === 'push' || sound === 'default') return true
  return REMINDER_SOUND_FILES[sound]
}

type Trigger =
  | { type: 'date'; date: Date }
  | { type: 'daily'; hour: number; minute: number }
  | { type: 'weekly'; weekday: number; hour: number; minute: number }

async function scheduleAt(
  identifier: string,
  title: string,
  body: string,
  trigger: Trigger,
  data: { kind: ReminderKind; id: string; mode: ReminderMode; sound: ReminderSound },
  channelId: string
) {
  if (trigger.type === 'date' && trigger.date.getTime() <= Date.now() + 5000) return
  const isAlert = data.mode === 'alert'
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined)
  const nativeTrigger =
    trigger.type === 'daily'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: trigger.hour,
          minute: trigger.minute,
          channelId,
        }
      : trigger.type === 'weekly'
        ? {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: trigger.weekday,
            hour: trigger.hour,
            minute: trigger.minute,
            channelId,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger.date,
            channelId,
          }
  try {
    await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: contentSound(data.mode, data.sound),
      interruptionLevel: isAlert ? 'timeSensitive' : 'active',
      sticky: isAlert,
      autoDismiss: !isAlert,
      priority: isAlert
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.DEFAULT,
      vibrate: isAlert ? [0, 900, 400, 900, 400, 1200] : [0, 120],
      data: { ...data, alarmTitle: title, alarmBody: body, identifier },
    },
    trigger: nativeTrigger,
  })
  } catch (e) {
    console.log('[Perso] Planification rappel impossible:', e instanceof Error ? e.message : e)
  }
}

async function scheduleOccurrence(
  kind: ReminderKind,
  id: string,
  title: string,
  body: string,
  trigger: Trigger | Date,
  index: string | number,
  config: ReminderConfig
) {
  const prefix = itemPrefix(kind, id)
  const when = trigger instanceof Date ? { type: 'date' as const, date: trigger } : trigger
  const data = { kind, id, mode: config.mode, sound: config.sound }
  if (config.mode === 'push' || config.mode === 'both') {
    await scheduleAt(`${prefix}-p${index}`, title, body, when, { ...data, mode: 'push' }, 'perso-push')
  }
  if (config.mode === 'alert' || config.mode === 'both') {
    await scheduleAt(
      `${prefix}-a${index}`,
      title,
      body,
      when,
      { ...data, mode: 'alert' },
      alertChannel(config.sound)
    )
  }
}

function scheduleReminderDates(
  kind: ReminderKind,
  id: string,
  title: string,
  body: string,
  dates: Date[],
  config: ReminderConfig,
  jobs: (() => Promise<void>)[]
) {
  dates.forEach((when, index) => {
    jobs.push(() => scheduleOccurrence(kind, id, title, body, when, index, config))
  })
}

function habitTimeOn(habit: NonNullable<ReturnType<typeof parseHabit>>, date = new Date()) {
  const when = new Date(date)
  when.setHours(habit.hour, habit.minute, 0, 0)
  return when
}

function scheduleHabitUntilDone(
  todo: Todo,
  habit: NonNullable<ReturnType<typeof parseHabit>>,
  reminder: ReminderConfig,
  jobs: (() => Promise<void>)[]
) {
  if (isHabitDoneToday(habit) || !isHabitDueToday(habit)) return
  const todayAt = habitTimeOn(habit)
  const nag: ReminderConfig = {
    ...reminder,
    interval_minutes: reminder.interval_minutes > 0 ? reminder.interval_minutes : 60,
  }
  const dates = reminderFireDatesUntilDone(nag, todayAt).filter(
    (when) => when.getTime() !== todayAt.getTime()
  )
  dates.forEach((when, index) => {
    jobs.push(() =>
      scheduleOccurrence('todo', todo.id, todo.title, habitSummary(habit), when, `n${index}`, reminder)
    )
  })
}

function scheduleHabitReminder(
  todo: Todo,
  habit: NonNullable<ReturnType<typeof parseHabit>>,
  reminder: ReminderConfig,
  jobs: (() => Promise<void>)[]
) {
  if (reminder.interval_minutes > 0) {
    scheduleReminderDates(
      'todo',
      todo.id,
      todo.title,
      habitSummary(habit),
      reminderOccurrences(reminder, nextHabitDates(habit, 10)),
      reminder,
      jobs
    )
    scheduleHabitUntilDone(todo, habit, reminder, jobs)
    return
  }
  if (isDailyHabit(habit)) {
    jobs.push(() =>
      scheduleOccurrence(
        'todo',
        todo.id,
        todo.title,
        habitSummary(habit),
        { type: 'daily', hour: habit.hour, minute: habit.minute },
        'd',
        reminder
      )
    )
    scheduleHabitUntilDone(todo, habit, reminder, jobs)
    return
  }
  if (habit.every === 'weekly') {
    for (const day of habit.days) {
      jobs.push(() =>
        scheduleOccurrence(
          'todo',
          todo.id,
          todo.title,
          habitSummary(habit),
          { type: 'weekly', weekday: expoWeekday(day), hour: habit.hour, minute: habit.minute },
          `w${day}`,
          reminder
        )
      )
    }
    scheduleHabitUntilDone(todo, habit, reminder, jobs)
    return
  }
  scheduleReminderDates(
    'todo',
    todo.id,
    todo.title,
    habitSummary(habit),
    nextHabitDates(habit, 16),
    reminder,
    jobs
  )
  scheduleHabitUntilDone(todo, habit, reminder, jobs)
}

export async function cancelItemNotification(kind: ReminderKind, id: string) {
  if (Platform.OS === 'web') return
  const prefix = itemPrefix(kind, id)
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      existing
        .filter((item) => item.identifier === prefix || item.identifier.startsWith(`${prefix}-`))
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
    )
  } catch {
    await Notifications.cancelScheduledNotificationAsync(prefix).catch(() => undefined)
  }
}

export function notificationTarget(data: Record<string, unknown> | undefined | null) {
  const kind = data?.kind
  if (kind === 'todo') return '/(app)/(tabs)/todos' as const
  if (kind === 'agenda') return '/(app)/(tabs)/agenda' as const
  if (kind === 'credit') return '/(app)/(tabs)/credits' as const
  return null
}

export async function syncNotifications(
  todos: Todo[],
  events: AgendaEvent[],
  credits: Credit[],
  profile: Profile | null
) {
  if (Platform.OS === 'web') return
  try {
    const existing = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      existing
        .filter((item) => item.identifier.startsWith('perso-'))
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
    )
  } catch {
    // Permission may not be granted yet.
  }

  const todoMinutes = profile?.notify_todo_minutes ?? 60
  const agendaMinutes = profile?.notify_agenda_minutes ?? 30
  const jobs: (() => Promise<void>)[] = []

  if (profile?.notify_todos !== false) {
    for (const todo of todos) {
      const habit = parseHabit(todo.habit)
      if (habit && isHabitTodo(todo)) {
        const reminder = parseReminder(todo.reminder, 'both')
        if (!reminder.enabled) continue
        scheduleHabitReminder(todo, habit, reminder, jobs)
        continue
      }
      if (todo.done) continue
      const custom = todo.reminder
      if (custom) {
        const reminder = parseReminder(custom, 'both')
        if (!reminder.enabled) continue
        scheduleReminderDates(
          'todo',
          todo.id,
          'TODO',
          todo.title,
          reminderFireDatesUntilDone(reminder, todo.due_at ? new Date(todo.due_at) : null),
          reminder,
          jobs
        )
        continue
      }
      if (!todo.due_at) continue
      const when = new Date(new Date(todo.due_at).getTime() - todoMinutes * 60_000)
      const fallback: ReminderConfig = {
        enabled: true,
        mode: 'push',
        sound: 'default',
        start_at: when.toISOString(),
        interval_minutes: 60,
        count: 1,
      }
      scheduleReminderDates(
        'todo',
        todo.id,
        'TODO',
        todo.title,
        reminderFireDatesUntilDone(fallback, new Date(todo.due_at)),
        fallback,
        jobs
      )
    }
  }

  if (profile?.notify_agenda !== false) {
    for (const event of events) {
      const startsAt = new Date(event.starts_at)
      if (startsAt.getTime() <= Date.now()) continue
      const custom = event.reminder
      if (custom) {
        const reminder = parseReminder(custom, 'both')
        if (!reminder.enabled) continue
        scheduleReminderDates(
          'agenda',
          event.id,
          'Agenda',
          event.title,
          reminderFireDatesBefore(reminder, startsAt),
          reminder,
          jobs
        )
        continue
      }
      const when = new Date(startsAt.getTime() - agendaMinutes * 60_000)
      if (when.getTime() >= startsAt.getTime()) continue
      jobs.push(() =>
        scheduleOccurrence('agenda', event.id, 'Agenda', event.title, when, 0, {
          enabled: true,
          mode: 'push',
          sound: 'default',
          start_at: when.toISOString(),
          interval_minutes: 0,
          count: 1,
        })
      )
    }
  }

  for (const credit of credits.filter((item) => !item.repaid)) {
    const reminder = parseReminder(credit.reminder, 'push')
    if (!reminder.enabled) continue
    scheduleReminderDates(
      'credit',
      credit.id,
      'Crédit',
      credit.label,
      reminderFireDates(reminder, credit.due_at ? new Date(credit.due_at) : null),
      { ...reminder, mode: 'push' },
      jobs
    )
  }

  if (!jobs.length) return
  const allowed = await requestNotificationPermission()
  if (!allowed) return
  await Promise.all(jobs.map((run) => run()))
}
