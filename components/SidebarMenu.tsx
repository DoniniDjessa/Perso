import { useRouter } from 'expo-router'
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer'
import {
  Archive,
  Banknote,
  Calendar,
  ChevronRight,
  CircleHelp,
  CreditCard,
  ListTodo,
  LogOut,
  Settings,
  Tag,
  UserRound,
} from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Image } from 'expo-image'
import { Separator, Text, XStack, YStack } from 'tamagui'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { useFormDrawer } from '@/components/FormDrawer'

type Item = {
  label: string
  icon: typeof UserRound
  onPress: () => void
  danger?: boolean
}

function MenuRow({ item }: { item: Item }) {
  const Icon = item.icon
  return (
    <Pressable onPress={item.onPress}>
      <XStack
        backgroundColor={colors.card}
        borderRadius={16}
        paddingHorizontal={16}
        paddingVertical={16}
        alignItems="center"
        justifyContent="space-between"
        marginBottom={10}
      >
        <XStack alignItems="center" gap={14}>
          <Icon size={20} color={item.danger ? colors.danger : colors.black} />
          <Text
            fontSize={16}
            style={{ ...fonts.semibold }}
            color={item.danger ? colors.danger : colors.black}
          >
            {item.label}
          </Text>
        </XStack>
        <ChevronRight size={18} color={colors.muted} />
      </XStack>
    </Pressable>
  )
}

export function SidebarMenu(props: DrawerContentComponentProps) {
  const { navigation } = props
  const { signOut } = useAuth()
  const { openForm } = useFormDrawer()
  const router = useRouter()

  const go = (
    href:
      | '/(app)/(tabs)'
      | '/(app)/(tabs)/depenses'
      | '/(app)/(tabs)/todos'
      | '/(app)/(tabs)/agenda'
      | '/(app)/(tabs)/historique'
      | '/(app)/(tabs)/revenus'
      | '/(app)/(tabs)/credits'
  ) => {
    navigation.closeDrawer()
    router.push(href)
  }

  const items: Item[] = [
    { label: 'Infos personnelles', icon: UserRound, onPress: () => go('/(app)/(tabs)') },
    { label: 'Dépenses', icon: Tag, onPress: () => go('/(app)/(tabs)/depenses') },
    { label: 'Revenus', icon: Banknote, onPress: () => go('/(app)/(tabs)/revenus') },
    { label: 'Crédits', icon: CreditCard, onPress: () => go('/(app)/(tabs)/credits') },
    { label: 'TODOs', icon: ListTodo, onPress: () => go('/(app)/(tabs)/todos') },
    { label: 'Agenda', icon: Calendar, onPress: () => go('/(app)/(tabs)/agenda') },
    { label: 'Historique', icon: Archive, onPress: () => go('/(app)/(tabs)/historique') },
    {
      label: 'Paramètres',
      icon: Settings,
      onPress: () => {
        navigation.closeDrawer()
        openForm('settings')
      },
    },
    { label: 'Aide', icon: CircleHelp, onPress: () => go('/(app)/(tabs)') },
    {
      label: 'Déconnexion',
      icon: LogOut,
      danger: true,
      onPress: async () => {
        navigation.closeDrawer()
        await signOut()
      },
    },
  ]

  return (
    <DrawerContentScrollView
      {...props}
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, backgroundColor: colors.bg }}
    >
      <YStack alignItems="center" paddingVertical={24}>
        <YStack position="relative">
          <Image
            source={require('@/assets/images/icon.png')}
            style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.black }}
            contentFit="cover"
            cachePolicy="none"
          />
          <YStack
            position="absolute"
            right={2}
            bottom={2}
            width={22}
            height={22}
            borderRadius={11}
            backgroundColor={colors.indigo}
            alignItems="center"
            justifyContent="center"
            borderWidth={2}
            borderColor={colors.bg}
          >
            <Text style={{ ...fonts.bold, color: colors.white, fontSize: 12 }}>
              ✓
            </Text>
          </YStack>
        </YStack>
      </YStack>
      <Separator marginBottom={16} borderColor={colors.border} />
      {items.map((item) => (
        <MenuRow key={item.label} item={item} />
      ))}
      <Text
        style={{
          ...fonts.medium,
          fontSize: 11,
          color: colors.muted,
          textAlign: 'center',
          marginTop: 18,
          marginBottom: 8,
        }}
      >
        Icônes d’écrans par Flaticon.com
      </Text>
    </DrawerContentScrollView>
  )
}
