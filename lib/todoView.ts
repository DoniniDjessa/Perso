type TodosTab = 'once' | 'habit'
type HabitScope = 'today' | 'week'

type TodosView = {
  tab: TodosTab
  scope?: HabitScope
}

let pending: TodosView | null = null
const listeners = new Set<() => void>()

export function requestTodosView(tab: TodosTab, scope?: HabitScope) {
  pending = { tab, scope }
  listeners.forEach((fn) => fn())
}

export function consumeTodosView() {
  const next = pending
  pending = null
  return next
}

export function subscribeTodosView(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
