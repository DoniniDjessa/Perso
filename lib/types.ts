import type { HabitConfig } from './habit'
import type { ReminderConfig } from './reminder'

export type AssignedPerson = {
  id: string
  name: string
}

export type Expense = {
  id: string
  user_id: string
  amount: number
  currency: string
  label: string
  category: string | null
  image_path: string | null
  people: AssignedPerson[]
  spent_at: string
  created_at: string
  map_lat?: number | null
  map_lng?: number | null
  map_label?: string | null
  hidden?: boolean
}

export type TodoKind = 'once' | 'habit'

export type Todo = {
  id: string
  user_id: string
  title: string
  done: boolean
  due_at: string | null
  image_path: string | null
  people: AssignedPerson[]
  created_at: string
  reminder?: ReminderConfig | null
  kind?: TodoKind
  habit?: HabitConfig | null
}

export type AgendaEvent = {
  id: string
  user_id: string
  title: string
  starts_at: string
  ends_at: string | null
  place: string | null
  notes: string | null
  image_path: string | null
  people: AssignedPerson[]
  priority?: number
  created_at: string
  map_lat?: number | null
  map_lng?: number | null
  map_label?: string | null
  reminder?: ReminderConfig | null
}

export type HistoryProof = {
  id: string
  user_id: string
  title: string
  notes: string | null
  image_path: string | null
  audio_path?: string | null
  video_path?: string | null
  links?: string[] | null
  people?: AssignedPerson[]
  proof_at: string
  created_at: string
  map_lat?: number | null
  map_lng?: number | null
  map_label?: string | null
}

export type Income = {
  id: string
  user_id: string
  amount: number
  currency: string
  label: string
  category: string | null
  notes: string | null
  image_path: string | null
  people: AssignedPerson[]
  received_at: string
  created_at: string
}

export type Credit = {
  id: string
  user_id: string
  amount: number
  currency: string
  label: string
  direction: 'lent' | 'borrowed'
  notes: string | null
  image_path: string | null
  people: AssignedPerson[]
  repaid: boolean
  opened_at: string
  due_at: string | null
  created_at: string
  reminder?: ReminderConfig | null
}

export type Profile = {
  id: string
  pseudo: string
  email: string
  avatar_path: string | null
  created_at: string
  notify_todos?: boolean
  notify_agenda?: boolean
  notify_todo_minutes?: number
  notify_agenda_minutes?: number
  push_token?: string | null
  hide_code_hash?: string | null
}
