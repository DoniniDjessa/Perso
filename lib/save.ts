import { supabase } from '@/lib/supabase'
import { errorMessage, missingColumn } from '@/lib/errors'
import type { AssignedPerson } from '@/lib/types'

export function peoplePayload(people: AssignedPerson[] | null | undefined) {
  return (people ?? [])
    .filter((person) => person?.id && person?.name)
    .map((person) => ({
      id: String(person.id),
      name: String(person.name).slice(0, 120),
    }))
}

async function write<T>(
  run: (payload: Record<string, unknown>) => Promise<{ data: T | null; error: { message?: string } | null }>,
  payload: Record<string, unknown>
) {
  let next = { ...payload }
  for (let i = 0; i < 10; i += 1) {
    const { data, error } = await run(next)
    if (!error) return data
    const column = missingColumn(error.message)
    if (column && column in next) {
      const { [column]: _dropped, ...rest } = next
      next = rest
      continue
    }
    throw new Error(errorMessage(error))
  }
  throw new Error('Enregistrement impossible.')
}

export async function insertRow(table: string, payload: Record<string, unknown>) {
  const data = await write<{ id: string }>(
    async (next) =>
      await supabase.from(table).insert(next).select('id').single(),
    payload
  )
  if (!data?.id) throw new Error('Enregistrement impossible.')
  return data
}

export async function updateRow(table: string, id: string, payload: Record<string, unknown>) {
  if (!Object.keys(payload).length) return
  await write(
    async (next) => {
      const { error } = await supabase.from(table).update(next).eq('id', id)
      return { data: { id }, error }
    },
    payload
  )
}

export async function tryUpdateColumns(table: string, id: string, payload: Record<string, unknown>) {
  for (const [column, value] of Object.entries(payload)) {
    const { error } = await supabase.from(table).update({ [column]: value }).eq('id', id)
    if (error && !missingColumn(error.message)) throw new Error(errorMessage(error))
  }
}
