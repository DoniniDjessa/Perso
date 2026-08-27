import type { ReactNode } from 'react'
import { HABIT_INTERVALS, WEEKDAYS, type HabitConfig } from '@/lib/habit'
import { colors, fonts } from '@/lib/theme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useState } from 'react'
import { Platform, Pressable } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { FlatIcon } from '@/components/FlatIcon'

export function HabitPick({
  value,
  onChange,
}: {
  value: HabitConfig
  onChange: (value: HabitConfig) => void
}) {
  const [pickingTime, setPickingTime] = useState(false)
  const clock = new Date()
  clock.setHours(value.hour, value.minute, 0, 0)

  return (
    <YStack gap={10}>
      <ChipGroup label="RÉPÉTITION">
        <Chip
          label="Jours de la semaine"
          hint="Comme un agenda"
          active={value.every === 'weekly'}
          onPress={() => onChange({ ...value, every: 'weekly' })}
        />
        <Chip
          label="Tous les N jours"
          hint="Ex. un jour sur deux"
          active={value.every === 'interval'}
          onPress={() => onChange({ ...value, every: 'interval' })}
        />
      </ChipGroup>

      {value.every === 'weekly' ? (
        <YStack gap={8}>
          <Text
            style={{
              ...fonts.bold,
              fontSize: 10,
              color: colors.indigo,
              letterSpacing: 1.4,
              marginLeft: 4,
            }}
          >
            JOURS
          </Text>
          <XStack gap={6}>
            {WEEKDAYS.map((day) => {
              const active = value.days.includes(day.value)
              return (
                <Pressable
                  key={day.value}
                  onPress={() => {
                    const days = active
                      ? value.days.filter((item) => item !== day.value)
                      : [...value.days, day.value].sort((a, b) => a - b)
                    onChange({ ...value, days: days.length ? days : [day.value] })
                  }}
                  style={{ flex: 1 }}
                >
                  <YStack
                    height={44}
                    borderRadius={14}
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={active ? colors.indigo : colors.card}
                  >
                    <Text
                      style={{
                        ...fonts.bold,
                        fontSize: 11,
                        color: active ? colors.white : colors.muted,
                      }}
                    >
                      {day.short}
                    </Text>
                  </YStack>
                </Pressable>
              )
            })}
          </XStack>
        </YStack>
      ) : (
        <ChipGroup label="TOUS LES">
          {HABIT_INTERVALS.map((interval) => (
            <Chip
              key={interval}
              label={interval === 1 ? 'Jour' : `${interval} jours`}
              active={value.interval_days === interval}
              onPress={() => onChange({ ...value, interval_days: interval })}
            />
          ))}
        </ChipGroup>
      )}

      <Pressable onPress={() => setPickingTime((open) => !open)}>
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={16}
          paddingVertical={14}
          alignItems="center"
          gap={14}
        >
          <FlatIcon name="clock" size={22} />
          <YStack flex={1}>
            <Text style={{ ...fonts.bold, fontSize: 10, color: colors.indigo, letterSpacing: 1.2 }}>
              HEURE
            </Text>
            <Text style={{ ...fonts.semibold, fontSize: 15, color: colors.black, marginTop: 2 }}>
              {clock.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </YStack>
        </XStack>
      </Pressable>
      {pickingTime ? (
        <DateTimePicker
          value={clock}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            if (Platform.OS !== 'ios') setPickingTime(false)
            if (!selected) return
            onChange({ ...value, hour: selected.getHours(), minute: selected.getMinutes() })
          }}
        />
      ) : null}
    </YStack>
  )
}

function ChipGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <YStack gap={8}>
      <Text
        style={{
          ...fonts.bold,
          fontSize: 10,
          color: colors.indigo,
          letterSpacing: 1.4,
          marginLeft: 4,
        }}
      >
        {label}
      </Text>
      <XStack flexWrap="wrap" gap={8}>
        {children}
      </XStack>
    </YStack>
  )
}

function Chip({
  label,
  hint,
  active,
  onPress,
}: {
  label: string
  hint?: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress}>
      <YStack
        backgroundColor={active ? colors.indigo : colors.card}
        borderRadius={16}
        paddingHorizontal={12}
        paddingVertical={8}
      >
        <Text style={{ ...fonts.semibold, fontSize: 12, color: active ? colors.white : colors.black }}>
          {label}
        </Text>
        {hint ? (
          <Text
            style={{
              ...fonts.medium,
              fontSize: 10,
              color: active ? 'rgba(255,255,255,0.8)' : colors.muted,
              marginTop: 2,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </YStack>
    </Pressable>
  )
}
