import { Calendar, Home, ListTodo, Tag, UserRound } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/lib/theme'

const items = [
  { name: 'index', Icon: Home },
  { name: 'depenses', Icon: Tag },
  { name: 'todos', Icon: ListTodo },
  { name: 'agenda', Icon: Calendar },
] as const

type TabBarProps = {
  state: { index: number; routes: { name: string }[] }
  navigation: {
    navigate: (name: string) => void
    getParent?: () => { openDrawer?: () => void } | undefined
  }
}

export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()
  const current = state.routes[state.index]?.name

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {items.map((item) => {
          const focused = current === item.name
          const Icon = item.Icon
          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={styles.item}
              hitSlop={8}
            >
              <Icon size={22} color={focused ? colors.white : 'rgba(255,255,255,0.45)'} />
            </Pressable>
          )
        })}
        <Pressable
          onPress={() => navigation.getParent()?.openDrawer()}
          style={styles.item}
          hitSlop={8}
        >
          <View style={styles.profileOrb}>
            <UserRound size={20} color={colors.white} />
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.tabBar,
    borderRadius: 40,
    paddingHorizontal: 22,
    paddingVertical: 12,
    width: '88%',
    maxWidth: 420,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
