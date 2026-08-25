import { ScreenShell } from '@/components/ScreenShell'
import { PeopleChips } from '@/components/PeopleChips'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { formatDay, formatTime } from '@/lib/format'
import { useTodos } from '@/lib/hooks'
import { supabase } from '@/lib/supabase'
import { tables } from '@/lib/db'
import { cancelItemNotification } from '@/lib/notifications'
import { Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'

export default function TodosScreen() {
  const { openForm } = useFormDrawer()
  const { items, loading, error, refresh } = useTodos()
  const page = usePage(items)

  const toggle = async (id: string, done: boolean) => {
    const nextDone = !done
    await supabase.from(tables.todos).update({ done: nextDone }).eq('id', id)
    if (nextDone) await cancelItemNotification('todo', id)
    await refresh()
  }

  return (
    <ScreenShell title="TODOs" loading={loading} error={error}>
      {items.length === 0 ? (
        <Text style={{ ...fonts.regular, color: colors.muted }}>Aucune tâche. Ajoutes-en une.</Text>
      ) : (
        page.slice.map((item) => (
          <XStack
            key={item.id}
            backgroundColor={colors.card}
            borderRadius={16}
            padding={16}
            marginBottom={10}
            alignItems="center"
            gap={14}
          >
            <Pressable onPress={() => void toggle(item.id, item.done)} hitSlop={8}>
              <YStack
                width={22}
                height={22}
                borderRadius={11}
                borderWidth={2}
                borderColor={item.done ? colors.indigo : colors.muted}
                backgroundColor={item.done ? colors.indigo : 'transparent'}
              />
            </Pressable>
            <Pressable onPress={() => openForm('todo', item)} style={{ flex: 1 }}>
              <YStack>
                <Text
                  style={{
                    ...fonts.bold,
                    textDecorationLine: item.done ? 'line-through' : 'none',
                    color: item.done ? colors.muted : colors.black,
                  }}
                >
                  {item.title}
                </Text>
                {item.due_at ? (
                  <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {formatDay(item.due_at)} · {formatTime(item.due_at)}
                  </Text>
                ) : null}
                <PeopleChips people={item.people} />
              </YStack>
            </Pressable>
          </XStack>
        ))
      )}
      <ListPager
        from={page.from}
        to={page.to}
        total={page.total}
        canPrev={page.canPrev}
        canNext={page.canNext}
        onPrev={page.prev}
        onNext={page.next}
      />
    </ScreenShell>
  )
}
