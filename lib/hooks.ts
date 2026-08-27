import { useCallback, useEffect, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import type { AgendaEvent, AssignedPerson, Credit, Expense, HistoryProof, Income, Todo } from '@/lib/types'
import { useAuth } from '@/lib/auth'
import { isHabitTodo, parseHabit } from '@/lib/habit'
import { useFormNonce } from '@/components/FormDrawer'
import { priorityFromEvent } from '@/lib/priority'

function withPeople<T extends { people?: AssignedPerson[] | null }>(rows: T[] | null | undefined): T[] {
  return (rows ?? []).map((row) => ({
    ...row,
    people: Array.isArray(row.people) ? row.people : [],
  }))
}

export function useExpenses() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase
      .from(tables.expenses)
      .select('*')
      .order('spent_at', { ascending: false })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems(withPeople(data as Expense[]))
    }
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  useEffect(() => {
    void refresh()
  }, [nonce, refresh])

  return { items, loading, error, refresh }
}

export function useIncomes() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase
      .from(tables.incomes)
      .select('*')
      .order('received_at', { ascending: false })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems(withPeople(data as Income[]))
    }
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  useEffect(() => {
    void refresh()
  }, [nonce, refresh])

  return { items, loading, error, refresh }
}

export function useCredits() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase
      .from(tables.credits)
      .select('*')
      .order('opened_at', { ascending: false })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems(withPeople(data as Credit[]))
    }
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  useEffect(() => {
    void refresh()
  }, [nonce, refresh])

  return { items, loading, error, refresh }
}

export function useTodos() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase
      .from(tables.todos)
      .select('*')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems(
        withPeople(data as Todo[]).map((row) => {
          const habit = parseHabit(row.habit)
          return {
            ...row,
            habit,
            kind: row.kind === 'habit' || habit ? 'habit' : 'once',
          }
        })
      )
    }
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  useEffect(() => {
    void refresh()
  }, [nonce, refresh])

  return { items, loading, error, refresh }
}

export function useAgenda() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<AgendaEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase
      .from(tables.agenda)
      .select('*')
      .order('starts_at', { ascending: true })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems(
        withPeople(data as AgendaEvent[]).map((row) => ({
          ...row,
          priority: priorityFromEvent(row),
        }))
      )
    }
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  useEffect(() => {
    void refresh()
  }, [nonce, refresh])

  return { items, loading, error, refresh }
}

export function useHistory() {
  const { user } = useAuth()
  const nonce = useFormNonce()
  const [items, setItems] = useState<HistoryProof[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase
      .from(tables.history)
      .select('*')
      .order('proof_at', { ascending: false })
    if (err) setError(err.message)
    else {
      setError(null)
      setItems(withPeople(data as HistoryProof[]).map((row) => ({
        ...row,
        links: Array.isArray(row.links) ? row.links.filter((item) => typeof item === 'string') : [],
      })))
    }
    setLoading(false)
  }, [user])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh])
  )

  useEffect(() => {
    void refresh()
  }, [nonce, refresh])

  return { items, loading, error, refresh }
}
