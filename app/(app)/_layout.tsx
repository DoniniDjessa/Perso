import { SidebarMenu } from '@/components/SidebarMenu'
import { FormDrawerProvider } from '@/components/FormDrawer'
import { NotificationSync } from '@/components/NotificationSync'
import { HideLockProvider } from '@/lib/hideLock'
import { AmountMaskProvider } from '@/lib/amountMask'
import { Drawer } from 'expo-router/drawer'
import { colors } from '@/lib/theme'

export default function AppDrawer() {
  return (
    <AmountMaskProvider>
      <HideLockProvider>
        <FormDrawerProvider>
          <NotificationSync />
          <Drawer
            drawerContent={(props) => <SidebarMenu {...props} />}
            screenOptions={{
              headerShown: false,
              drawerType: 'front',
              overlayColor: 'rgba(0,0,0,0.25)',
              drawerStyle: { width: 320, backgroundColor: colors.bg },
            }}
          >
            <Drawer.Screen name="(tabs)" options={{ title: 'Perso' }} />
          </Drawer>
        </FormDrawerProvider>
      </HideLockProvider>
    </AmountMaskProvider>
  )
}
