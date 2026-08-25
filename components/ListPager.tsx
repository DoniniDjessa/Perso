import { PAGE_SIZE } from '@/lib/paging'
import { colors, fonts } from '@/lib/theme'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { Text, XStack } from 'tamagui'

export function ListPager({
  from,
  to,
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  from: number
  to: number
  total: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
}) {
  if (total <= PAGE_SIZE) return null

  return (
    <XStack alignItems="center" justifyContent="space-between" marginTop={8} marginBottom={8} gap={12}>
      <Pressable onPress={onPrev} disabled={!canPrev} hitSlop={8}>
        <XStack
          width={44}
          height={44}
          borderRadius={14}
          backgroundColor={colors.card}
          alignItems="center"
          justifyContent="center"
          opacity={canPrev ? 1 : 0.35}
        >
          <ChevronLeft size={20} color={colors.black} />
        </XStack>
      </Pressable>
      <Text style={{ ...fonts.medium, fontSize: 13, color: colors.muted }}>
        {from}–{to} sur {total}
      </Text>
      <Pressable onPress={onNext} disabled={!canNext} hitSlop={8}>
        <XStack
          width={44}
          height={44}
          borderRadius={14}
          backgroundColor={colors.card}
          alignItems="center"
          justifyContent="center"
          opacity={canNext ? 1 : 0.35}
        >
          <ChevronRight size={20} color={colors.black} />
        </XStack>
      </Pressable>
    </XStack>
  )
}
