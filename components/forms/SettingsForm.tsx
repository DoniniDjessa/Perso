import { Field } from '@/components/Field'
import { FormPanel } from '@/components/FormPanel'
import { colors, fonts } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import { hashHideCode, normalizeHideCode, validateHideCode } from '@/lib/hideCode'
import { NOTIFY_OFFSETS, requestNotificationPermission } from '@/lib/notifications'
import { requestContactsPermission } from '@/lib/contacts'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Platform, Pressable, Switch } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'

export function SettingsForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user, profile, updateProfile } = useAuth()
  const [todosOn, setTodosOn] = useState(profile?.notify_todos !== false)
  const [agendaOn, setAgendaOn] = useState(profile?.notify_agenda !== false)
  const [todoMinutes, setTodoMinutes] = useState(profile?.notify_todo_minutes ?? 60)
  const [agendaMinutes, setAgendaMinutes] = useState(profile?.notify_agenda_minutes ?? 30)
  const [password, setPassword] = useState('')
  const [newCode, setNewCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const hasCode = Boolean(profile?.hide_code_hash)

  const save = async () => {
    setBusy(true)
    setMessage(null)
    const allowed = await requestNotificationPermission()
    if (!allowed && Platform.OS !== 'web') {
      setBusy(false)
      setMessage('Autorise les notifications pour recevoir les rappels.')
      return
    }

    let hide_code_hash: string | undefined
    if (newCode || confirmCode) {
      if (hasCode) {
        const email = user?.email || profile?.email
        if (!password.trim()) {
          setBusy(false)
          setMessage('Entre ton mot de passe de connexion pour changer le code.')
          return
        }
        if (!email) {
          setBusy(false)
          setMessage('Email introuvable pour vérifier le mot de passe.')
          return
        }
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) {
          setBusy(false)
          setMessage('Mot de passe de connexion incorrect.')
          return
        }
      }
      const invalid = validateHideCode(newCode)
      if (invalid) {
        setBusy(false)
        setMessage(invalid)
        return
      }
      if (normalizeHideCode(newCode) !== normalizeHideCode(confirmCode)) {
        setBusy(false)
        setMessage('Les deux codes ne correspondent pas.')
        return
      }
      if (!user?.id) {
        setBusy(false)
        setMessage('Non connecté.')
        return
      }
      hide_code_hash = hashHideCode(newCode, user.id)
    }

    const { error } = await updateProfile({
      notify_todos: todosOn,
      notify_agenda: agendaOn,
      notify_todo_minutes: todoMinutes,
      notify_agenda_minutes: agendaMinutes,
      ...(hide_code_hash ? { hide_code_hash } : {}),
    })
    setBusy(false)
    if (error) {
      setMessage(error)
      return
    }
    onSaved()
  }

  return (
    <FormPanel title="Paramètres" onSave={save} onClose={onClose} busy={busy}>
      <Text style={{ ...fonts.semibold, color: colors.black, fontSize: 16 }}>Notifications</Text>
      <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 13, marginTop: -4 }}>
        Choisis quels rappels tu reçois, et combien de temps à l’avance.
      </Text>
      <ToggleRow label="Rappels TODOs" value={todosOn} onChange={setTodosOn} />
      {todosOn ? <OffsetPick value={todoMinutes} onChange={setTodoMinutes} /> : null}
      <ToggleRow label="Rappels agenda" value={agendaOn} onChange={setAgendaOn} />
      {agendaOn ? <OffsetPick value={agendaMinutes} onChange={setAgendaMinutes} /> : null}
      <Text style={{ ...fonts.semibold, color: colors.black, fontSize: 16, marginTop: 8 }}>
        Répertoire
      </Text>
      <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 13, marginTop: -4 }}>
        Pour assigner des personnes à tes TODOs, dépenses et événements.
      </Text>
      <Pressable
        onPress={async () => {
          const ok = await requestContactsPermission()
          setMessage(
            ok
              ? 'Répertoire autorisé.'
              : Platform.OS === 'web'
                ? 'Le répertoire est disponible sur iOS et Android.'
                : 'Accès au répertoire refusé.'
          )
        }}
      >
        <XStack backgroundColor={colors.card} borderRadius={16} padding={16}>
          <Text style={{ ...fonts.semibold, color: colors.black }}>Autoriser le répertoire</Text>
        </XStack>
      </Pressable>
      <Text style={{ ...fonts.semibold, color: colors.black, fontSize: 16, marginTop: 8 }}>
        Code de confidentialité
      </Text>
      <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 13, marginTop: -4 }}>
        {hasCode
          ? 'Un code est déjà défini. Pour le changer, confirme avec ton mot de passe de connexion.'
          : 'Ce code masque une dépense à l’écran. Elle reste dans les totaux.'}
      </Text>
      {hasCode ? (
        <Field
          label="MOT DE PASSE DE CONNEXION"
          placeholder="Ton mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      ) : null}
      <Field
        label={hasCode ? 'NOUVEAU CODE' : 'CODE'}
        placeholder="4 à 8 chiffres"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        value={newCode}
        onChangeText={(value) => setNewCode(normalizeHideCode(value))}
      />
      <Field
        label="CONFIRMER LE CODE"
        placeholder="Répète le code"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        value={confirmCode}
        onChangeText={(value) => setConfirmCode(normalizeHideCode(value))}
      />
      {message ? (
        <Text style={{ ...fonts.medium, color: colors.indigo, fontSize: 13 }}>{message}</Text>
      ) : null}
    </FormPanel>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <XStack
      backgroundColor={colors.card}
      borderRadius={16}
      paddingHorizontal={16}
      paddingVertical={12}
      alignItems="center"
      justifyContent="space-between"
    >
      <Text style={{ ...fonts.semibold, color: colors.black }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.indigo }} />
    </XStack>
  )
}

function OffsetPick({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <XStack flexWrap="wrap" gap={8}>
      {NOTIFY_OFFSETS.map((item) => {
        const active = value === item.value
        return (
          <Pressable key={item.value} onPress={() => onChange(item.value)}>
            <YStack
              backgroundColor={active ? colors.indigo : colors.card}
              borderRadius={16}
              paddingHorizontal={12}
              paddingVertical={8}
            >
              <Text
                style={{ ...fonts.semibold, fontSize: 12, color: active ? colors.white : colors.black }}
              >
                {item.label}
              </Text>
            </YStack>
          </Pressable>
        )
      })}
    </XStack>
  )
}
