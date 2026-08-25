import { FloatingTabBar } from '@/components/FloatingTabBar'
import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="depenses" options={{ title: 'Dépenses' }} />
      <Tabs.Screen name="todos" options={{ title: 'TODOs' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="historique" options={{ title: 'Historique', href: null }} />
      <Tabs.Screen name="revenus" options={{ title: 'Revenus', href: null }} />
      <Tabs.Screen name="credits" options={{ title: 'Crédits', href: null }} />
    </Tabs>
  )
}
