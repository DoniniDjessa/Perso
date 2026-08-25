import { ScreenShell } from '@/components/ScreenShell'
import { useFormDrawer } from '@/components/FormDrawer'
import { colors, fonts } from '@/lib/theme'
import { formatDay } from '@/lib/format'
import { useHistory } from '@/lib/hooks'
import type { HistoryProof } from '@/lib/types'
import { Pressable } from 'react-native'
import { Text, YStack } from 'tamagui'
import { ListPager } from '@/components/ListPager'
import { usePage } from '@/lib/paging'

export default function HistoriqueScreen() {
  const { items, loading, error } = useHistory()
  const page = usePage(items)

  return (
    <ScreenShell title="Historique" loading={loading} error={error}>
      {items.length === 0 ? (
        <Text style={{ ...fonts.regular, color: colors.muted }}>
          Ajoute une preuve à garder : reçu, contrat, capture, avec sa date.
        </Text>
      ) : (
        page.slice.map((item) => <ProofRow key={item.id} item={item} />)
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

function ProofRow({ item }: { item: HistoryProof }) {
  const { openForm } = useFormDrawer()

  return (
    <Pressable onPress={() => openForm('history', item, 'view')}>
      <YStack
        backgroundColor={colors.card}
        borderRadius={16}
        padding={16}
        marginBottom={10}
        gap={4}
      >
        <Text style={{ ...fonts.bold, color: colors.black }}>{item.title}</Text>
        <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12 }}>
          {formatDay(item.proof_at)}
        </Text>
      </YStack>
    </Pressable>
  )
}
