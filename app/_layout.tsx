import 'react-native-gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
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
import tamaguiConfig from '@/tamagui.config'
import { colors } from '@/lib/theme'

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(app)',
}

SplashScreen.preventAutoHideAsync()

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

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <AuthProvider>
          <ThemeProvider value={navTheme}>
            <StatusBar style="dark" />
            <RootNav />
          </ThemeProvider>
        </AuthProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  )
}

function RootNav() {
  const { session, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync()
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
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  )
}
