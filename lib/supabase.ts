import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env'

function createStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
      setItem: (key: string, value: string) => {
        globalThis.localStorage?.setItem(key, value)
        return Promise.resolve()
      },
      removeItem: (key: string) => {
        globalThis.localStorage?.removeItem(key)
        return Promise.resolve()
      },
    }
  }

  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store')
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  }
}

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
