import { Field } from '@/components/Field'
import { PrimaryButton } from '@/components/PrimaryButton'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { hashHideCode, normalizeHideCode, validateHideCode } from '@/lib/hideCode'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Modal, Pressable } from 'react-native'
import { Text, YStack } from 'tamagui'

type HideLockValue = {
  hasCode: boolean
  unlocked: boolean
  lock: () => void
  unlockWithCode: (code: string) => string | null
  requestUnlock: (onSuccess?: () => void) => boolean
}

const HideLockContext = createContext<HideLockValue | null>(null)

export function useHideLock() {
  const ctx = useContext(HideLockContext)
  if (!ctx) throw new Error('useHideLock must be used within HideLockProvider')
  return ctx
}

export function HideLockProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<(() => void) | null>(null)

  const hasCode = Boolean(profile?.hide_code_hash)

  useEffect(() => {
    setUnlocked(false)
    setOpen(false)
    setCode('')
    setPending(null)
  }, [user?.id, profile?.hide_code_hash])

  const lock = useCallback(() => setUnlocked(false), [])

  const unlockWithCode = useCallback(
    (value: string) => {
      if (!user?.id) return 'Non connecté.'
      if (!profile?.hide_code_hash) return 'Aucun code défini. Va dans Paramètres.'
      const invalid = validateHideCode(value)
      if (invalid) return invalid
      if (hashHideCode(value, user.id) !== profile.hide_code_hash) return 'Code incorrect.'
      setUnlocked(true)
      return null
    },
    [profile?.hide_code_hash, user?.id]
  )

  const requestUnlock = useCallback(
    (onSuccess?: () => void) => {
      if (unlocked) {
        onSuccess?.()
        return true
      }
      if (!hasCode) return false
      setError(null)
      setCode('')
      setPending(() => onSuccess ?? null)
      setOpen(true)
      return true
    },
    [hasCode, unlocked]
  )

  const close = () => {
    setOpen(false)
    setCode('')
    setError(null)
    setPending(null)
  }

  const submit = () => {
    const err = unlockWithCode(code)
    if (err) {
      setError(err)
      return
    }
    const next = pending
    close()
    next?.()
  }

  const value = useMemo(
    () => ({ hasCode, unlocked, lock, unlockWithCode, requestUnlock }),
    [hasCode, lock, requestUnlock, unlockWithCode, unlocked]
  )

  return (
    <HideLockContext.Provider value={value}>
      {children}
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable
          onPress={close}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.35)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Pressable onPress={(event) => event.stopPropagation()}>
            <YStack backgroundColor={colors.bg} borderRadius={24} padding={20} gap={12}>
              <Text style={{ ...fonts.extra, fontSize: 20, color: colors.black }}>
                Dépense masquée
              </Text>
              <Text style={{ ...fonts.medium, fontSize: 13, color: colors.muted }}>
                Entre ton code de confidentialité pour la lire. Elle reste dans les totaux.
              </Text>
              <Field
                label="CODE"
                placeholder="4 à 8 chiffres"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
                value={code}
                onChangeText={(value) => setCode(normalizeHideCode(value))}
              />
              {error ? (
                <Text style={{ ...fonts.medium, color: colors.danger, fontSize: 13 }}>{error}</Text>
              ) : null}
              <PrimaryButton label="Déverrouiller" onPress={submit} disabled={code.length < 4} />
              <Pressable onPress={close}>
                <Text
                  style={{
                    ...fonts.semibold,
                    color: colors.muted,
                    textAlign: 'center',
                    paddingVertical: 8,
                  }}
                >
                  Annuler
                </Text>
              </Pressable>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </HideLockContext.Provider>
  )
}
