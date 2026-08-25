import Constants from 'expo-constants'

type Extra = {
  supabaseUrl?: string
  supabaseAnonKey?: string
}

function readExtra(): Extra {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra
  return extra
}

export function getSupabaseUrl(): string {
  const extra = readExtra()
  const url =
    extra.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  }
  return url
}

export function getSupabaseAnonKey(): string {
  const extra = readExtra()
  const key =
    extra.supabaseAnonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  }
  return key
}
