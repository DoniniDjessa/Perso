import 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { TamaguiProvider } from 'tamagui'
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AlarmProvider } from '@/lib/alarm'
import { isSupabaseConfigured } from '@/lib/env'
import tamaguiConfig from '@/tamagui.config'
import { colors } from '@/lib/theme'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(auth)',
}

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.indigo,
  },
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (fontsLoaded) setReady(true)
    const timer = setTimeout(() => setReady(true), 4000)
    return () => clearTimeout(timer)
  }, [fontsLoaded])

  if (!ready) return null

  if (!isSupabaseConfigured()) {
    return <MissingConfig />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <AuthProvider>
          <AlarmProvider>
            <ThemeProvider value={navTheme}>
              <StatusBar style="dark" />
              <RootNav />
            </ThemeProvider>
          </AlarmProvider>
        </AuthProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  )
}

function MissingConfig() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined)
  }, [])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.black, textAlign: 'center' }}>
        Configuration manquante
      </Text>
      <Text
        style={{
          marginTop: 12,
          fontSize: 15,
          lineHeight: 22,
          color: colors.muted,
          textAlign: 'center',
        }}
      >
        L’app n’a pas reçu l’URL et la clé Supabase. Ajoute EXPO_PUBLIC_SUPABASE_URL et
        EXPO_PUBLIC_SUPABASE_ANON_KEY dans les variables EAS, puis reconstruis l’APK.
      </Text>
    </View>
  )
}

function RootNav() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => undefined)
    }
  }, [loading])

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!session && !inAuth) {
      router.replace('/(auth)/login')
    } else if (session && inAuth) {
      router.replace('/(app)/(tabs)')
    }
  }, [session, loading, segments, router])

  if (loading) return null

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  )
}
