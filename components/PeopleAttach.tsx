import { colors, fonts } from '@/lib/theme'
import { loadContacts } from '@/lib/contacts'
import type { AssignedPerson } from '@/lib/types'
import { FlatIcon } from '@/components/FlatIcon'
import { PrimaryButton } from '@/components/PrimaryButton'
import { Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'

const AVATARS = ['#4F46E5', '#7C3AED', '#6366F1', '#312E81', '#A78BFA']

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function avatarColor(id: string) {
  let sum = 0
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i)
  return AVATARS[sum % AVATARS.length]
}

export function PeopleAttach({
  people,
  onChange,
}: {
  people: AssignedPerson[]
  onChange: (people: AssignedPerson[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<AssignedPerson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [multi, setMulti] = useState(true)
  const [picked, setPicked] = useState<AssignedPerson[]>([])

  const openPicker = async () => {
    setOpen(true)
    setQuery('')
    setMulti(people.length !== 1)
    setPicked(people)
    setLoading(true)
    setError(null)
    if (Platform.OS === 'web') {
      setLoading(false)
      setError('Le répertoire est disponible sur iOS et Android.')
      return
    }
    const { granted, people: list } = await loadContacts()
    setLoading(false)
    if (!granted) {
      setError('Autorise l’accès au répertoire pour assigner des personnes.')
      return
    }
    if (list.length === 0) {
      setError('Aucun contact trouvé dans le répertoire.')
      return
    }
    setContacts(list)
  }

  const toggle = (person: AssignedPerson) => {
    if (!multi) {
      setPicked([person])
      return
    }
    const exists = picked.some((item) => item.id === person.id)
    setPicked(exists ? picked.filter((item) => item.id !== person.id) : [...picked, person])
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? contacts.filter((person) => person.name.toLowerCase().includes(q)) : contacts
  }, [contacts, query])

  const grouped = useMemo(() => {
    const map = new Map<string, AssignedPerson[]>()
    for (const person of filtered) {
      const raw = person.name.trim().charAt(0).toUpperCase()
      const letter = /[A-ZÀ-Ÿ]/.test(raw) ? raw.normalize('NFD')[0] : '#'
      const list = map.get(letter) ?? []
      list.push(person)
      map.set(letter, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr'))
  }, [filtered])

  const confirm = () => {
    onChange(picked)
    setOpen(false)
  }

  return (
    <YStack gap={10}>
      <Pressable onPress={() => void openPicker()}>
        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          paddingHorizontal={16}
          paddingVertical={14}
          alignItems="center"
          gap={14}
        >
          <FlatIcon name="users" size={22} />
          <YStack flex={1}>
            <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black }}>
              {people.length ? `${people.length} personne(s)` : 'Assigner des personnes'}
            </Text>
            <Text style={{ ...fonts.medium, fontSize: 12, color: colors.muted, marginTop: 2 }}>
              Une ou plusieurs, depuis le répertoire
            </Text>
          </YStack>
        </XStack>
      </Pressable>
      {people.length ? (
        <XStack flexWrap="wrap" gap={8}>
          {people.map((person) => (
            <Pressable
              key={person.id}
              onPress={() => onChange(people.filter((item) => item.id !== person.id))}
            >
              <XStack
                backgroundColor={colors.violetSoft}
                borderRadius={16}
                paddingHorizontal={12}
                paddingVertical={8}
                alignItems="center"
                gap={6}
              >
                <Text style={{ ...fonts.semibold, fontSize: 13, color: colors.indigo }}>{person.name}</Text>
                <X size={12} color={colors.indigo} />
              </XStack>
            </Pressable>
          ))}
        </XStack>
      ) : null}
      <DirectoryModal
        open={open}
        loading={loading}
        error={error}
        query={query}
        onQuery={setQuery}
        multi={multi}
        onMulti={(next) => {
          setMulti(next)
          if (!next && picked.length > 1) setPicked(picked.slice(0, 1))
        }}
        grouped={grouped}
        picked={picked}
        onToggle={toggle}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </YStack>
  )
}

function DirectoryModal({
  open,
  loading,
  error,
  query,
  onQuery,
  multi,
  onMulti,
  grouped,
  picked,
  onToggle,
  onClose,
  onConfirm,
}: {
  open: boolean
  loading: boolean
  error: string | null
  query: string
  onQuery: (value: string) => void
  multi: boolean
  onMulti: (value: boolean) => void
  grouped: [string, AssignedPerson[]][]
  picked: AssignedPerson[]
  onToggle: (person: AssignedPerson) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor={colors.bg} paddingTop={insets.top}>
        <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={20} paddingVertical={12}>
          <YStack>
            <Text style={{ ...fonts.extra, fontSize: 24, color: colors.black }}>Répertoire</Text>
            <Text style={{ ...fonts.medium, fontSize: 13, color: colors.muted }}>
              {multi ? 'Sélection multiple' : 'Une seule personne'}
            </Text>
          </YStack>
          <Pressable onPress={onClose} hitSlop={10}>
            <XStack
              width={40}
              height={40}
              borderRadius={14}
              backgroundColor={colors.card}
              alignItems="center"
              justifyContent="center"
            >
              <X size={18} color={colors.black} />
            </XStack>
          </Pressable>
        </XStack>

        <XStack backgroundColor={colors.card} borderRadius={16} marginHorizontal={20} padding={4} marginBottom={12}>
          <ModeTab label="Une" active={!multi} onPress={() => onMulti(false)} />
          <ModeTab label="Plusieurs" active={multi} onPress={() => onMulti(true)} />
        </XStack>

        <XStack
          backgroundColor={colors.card}
          borderRadius={16}
          marginHorizontal={20}
          marginBottom={12}
          paddingHorizontal={14}
          height={48}
          alignItems="center"
          gap={10}
        >
          <Search size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={onQuery}
            placeholder="Rechercher un nom"
            placeholderTextColor="rgba(17,17,17,0.28)"
            style={{ flex: 1, ...fonts.medium, fontSize: 15, color: colors.black }}
          />
        </XStack>

        {loading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator color={colors.indigo} />
          </YStack>
        ) : error ? (
          <YStack flex={1} padding={20}>
            <Text style={{ ...fonts.medium, color: colors.danger }}>{error}</Text>
          </YStack>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {grouped.length === 0 ? (
              <Text style={{ ...fonts.regular, color: colors.muted }}>Aucun contact ne correspond.</Text>
            ) : (
              grouped.map(([letter, list]) => (
                <YStack key={letter} marginBottom={16}>
                  <Text
                    style={{
                      ...fonts.bold,
                      fontSize: 12,
                      color: colors.indigo,
                      letterSpacing: 1.4,
                      marginBottom: 8,
                    }}
                  >
                    {letter}
                  </Text>
                  {list.map((person) => {
                    const selected = picked.some((item) => item.id === person.id)
                    return (
                      <Pressable key={person.id} onPress={() => onToggle(person)}>
                        <XStack
                          backgroundColor={selected ? colors.violetSoft : colors.card}
                          borderRadius={16}
                          padding={12}
                          marginBottom={8}
                          alignItems="center"
                          gap={12}
                        >
                          <YStack
                            width={44}
                            height={44}
                            borderRadius={22}
                            backgroundColor={avatarColor(person.id)}
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text style={{ ...fonts.bold, color: colors.white, fontSize: 14 }}>
                              {initials(person.name)}
                            </Text>
                          </YStack>
                          <Text style={{ ...fonts.semibold, fontSize: 16, color: colors.black, flex: 1 }}>
                            {person.name}
                          </Text>
                          <YStack
                            width={22}
                            height={22}
                            borderRadius={11}
                            borderWidth={2}
                            borderColor={selected ? colors.indigo : colors.border}
                            backgroundColor={selected ? colors.indigo : 'transparent'}
                            alignItems="center"
                            justifyContent="center"
                          >
                            {selected ? (
                              <Text style={{ ...fonts.bold, color: colors.white, fontSize: 11 }}>✓</Text>
                            ) : null}
                          </YStack>
                        </XStack>
                      </Pressable>
                    )
                  })}
                </YStack>
              ))
            )}
          </ScrollView>
        )}

        <YStack padding={20} paddingBottom={Math.max(insets.bottom, 16)} backgroundColor={colors.bg}>
          <PrimaryButton
            label={picked.length ? `Valider · ${picked.length}` : 'Valider sans personne'}
            onPress={onConfirm}
          />
        </YStack>
      </YStack>
    </Modal>
  )
}

function ModeTab({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <YStack
        height={36}
        borderRadius={12}
        alignItems="center"
        justifyContent="center"
        backgroundColor={active ? colors.indigo : 'transparent'}
      >
        <Text style={{ ...fonts.semibold, fontSize: 13, color: active ? colors.white : colors.muted }}>
          {label}
        </Text>
      </YStack>
    </Pressable>
  )
}
