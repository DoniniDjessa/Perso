import { PeriodTabs } from '@/components/PeriodTabs'
import { SummaryAmount } from '@/components/SummaryAmount'
import { EXPENSE_CATEGORIES } from '@/lib/categories'
import {
  canShiftPeriodForward,
  formatAmount,
  formatPeriodCaption,
  shiftPeriodDate,
  type SpendPeriod,
} from '@/lib/format'
import { colors, fonts } from '@/lib/theme'
import type { Expense } from '@/lib/types'
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native'
import { useEffect, useMemo, useRef } from 'react'
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

export function CategorySpendPanel({
  open,
  items,
  period,
  cursor,
  onPeriod,
  onCursor,
  onClose,
}: {
  open: boolean
  items: Expense[]
  period: SpendPeriod
  cursor: Date
  onPeriod: (period: SpendPeriod) => void
  onCursor: (date: Date) => void
  onClose: () => void
}) {
  const width = Math.min(380, Dimensions.get('window').width * 0.94)
  const translateX = useRef(new Animated.Value(width)).current
  const overlay = useRef(new Animated.Value(0)).current
  const total = items.reduce((sum, item) => sum + Number(item.amount), 0)
  const canNext = canShiftPeriodForward(cursor, period)
  const groups = useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>()
    for (const item of items) {
      const key = EXPENSE_CATEGORIES.includes(item.category as (typeof EXPENSE_CATEGORIES)[number])
        ? String(item.category)
        : 'Autres'
      const prev = map.get(key) ?? { amount: 0, count: 0 }
      map.set(key, { amount: prev.amount + Number(item.amount || 0), count: prev.count + 1 })
    }
    return EXPENSE_CATEGORIES.map((category) => ({
      category,
      amount: map.get(category)?.amount ?? 0,
      count: map.get(category)?.count ?? 0,
    }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [items])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : width,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(overlay, {
        toValue: open ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start()
  }, [open, overlay, translateX, width])

  return (
    <>
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.overlay, { opacity: overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.panel, { width, backgroundColor: colors.bg, transform: [{ translateX }] }]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={20} paddingTop={12} paddingBottom={16}>
            <Text style={{ ...fonts.extra, fontSize: 22, color: colors.black, flex: 1, paddingRight: 12 }}>
              Par catégories
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <YStack
                width={40}
                height={40}
                borderRadius={16}
                backgroundColor={colors.card}
                alignItems="center"
                justifyContent="center"
              >
                <X size={18} color={colors.black} />
              </YStack>
            </Pressable>
          </XStack>
          <YStack paddingHorizontal={20} paddingBottom={12} gap={14}>
            <PeriodTabs value={period} onChange={onPeriod} tone="light" />
            <XStack alignItems="center">
              <PeriodArrow
                side="left"
                onPress={() => onCursor(shiftPeriodDate(cursor, period, -1))}
              />
              <YStack flex={1} paddingHorizontal={8}>
                <SummaryAmount
                  caption={formatPeriodCaption(period, cursor)}
                  amount={total}
                  captionColor={colors.muted}
                  amountColor={colors.black}
                  iconColor={colors.indigo}
                  size={28}
                />
              </YStack>
              <PeriodArrow
                side="right"
                disabled={!canNext}
                onPress={() => onCursor(shiftPeriodDate(cursor, period, 1))}
              />
            </XStack>
          </YStack>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
            {groups.length === 0 ? (
              <Text style={{ ...fonts.regular, color: colors.muted }}>
                Aucune dépense {formatPeriodCaption(period, cursor).toLowerCase()}.
              </Text>
            ) : (
              groups.map((row) => {
                const ratio = total > 0 ? row.amount / total : 0
                return (
                  <YStack
                    key={row.category}
                    backgroundColor={colors.card}
                    borderRadius={16}
                    padding={14}
                    marginBottom={10}
                    gap={8}
                  >
                    <XStack justifyContent="space-between" alignItems="center" gap={10}>
                      <YStack flex={1} paddingRight={8}>
                        <Text style={{ ...fonts.bold, color: colors.black }}>{row.category}</Text>
                        <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 }}>
                          {row.count} dépense{row.count > 1 ? 's' : ''} · {Math.round(ratio * 100)} %
                        </Text>
                      </YStack>
                      <Text style={{ ...fonts.extra, color: colors.indigo }}>{formatAmount(row.amount)}</Text>
                    </XStack>
                    <YStack height={6} borderRadius={99} backgroundColor={colors.gray} overflow="hidden">
                      <View
                        style={{
                          height: 6,
                          borderRadius: 99,
                          width: `${Math.max(6, Math.round(ratio * 100))}%`,
                          backgroundColor: colors.indigo,
                        }}
                      />
                    </YStack>
                  </YStack>
                )
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </>
  )
}

export function PeriodArrow({
  side,
  onPress,
  disabled,
  light,
}: {
  side: 'left' | 'right'
  onPress: () => void
  disabled?: boolean
  light?: boolean
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  const tint = light ? colors.white : colors.black
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} style={{ opacity: disabled ? 0.28 : 1 }}>
      <YStack
        width={36}
        height={36}
        borderRadius={14}
        alignItems="center"
        justifyContent="center"
        backgroundColor={light ? 'rgba(255,255,255,0.16)' : colors.card}
      >
        <Icon size={20} color={tint} />
      </YStack>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 30,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 31,
    elevation: 14,
  },
})
