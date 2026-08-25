import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Animated, Dimensions, Pressable, StyleSheet } from 'react-native'
import { useEffect, useRef } from 'react'
import { colors } from '@/lib/theme'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import { IncomeForm } from '@/components/forms/IncomeForm'
import { CreditForm } from '@/components/forms/CreditForm'
import { TodoForm } from '@/components/forms/TodoForm'
import { AgendaForm } from '@/components/forms/AgendaForm'
import { HistoryForm } from '@/components/forms/HistoryForm'
import { SettingsForm } from '@/components/forms/SettingsForm'
import { HistoryDetail } from '@/components/HistoryDetail'
import type { AgendaEvent, Credit, Expense, HistoryProof, Income, Todo } from '@/lib/types'

export type FormKind = 'expense' | 'income' | 'credit' | 'todo' | 'agenda' | 'settings' | 'history'
export type FormMode = 'view' | 'edit'

export type FormItem = Expense | Income | Credit | Todo | AgendaEvent | HistoryProof

type FormDrawerValue = {
  kind: FormKind | null
  item: FormItem | null
  mode: FormMode
  nonce: number
  openForm: (kind: FormKind, item?: FormItem | null, mode?: FormMode) => void
  closeForm: (saved?: boolean) => void
}

const FormDrawerContext = createContext<FormDrawerValue | null>(null)

export function useFormDrawer() {
  const ctx = useContext(FormDrawerContext)
  if (!ctx) throw new Error('useFormDrawer must be used within FormDrawerProvider')
  return ctx
}

export function useFormNonce() {
  return useContext(FormDrawerContext)?.nonce ?? 0
}

export function FormDrawerProvider({ children }: { children: ReactNode }) {
  const [kind, setKind] = useState<FormKind | null>(null)
  const [item, setItem] = useState<FormItem | null>(null)
  const [mode, setMode] = useState<FormMode>('edit')
  const [nonce, setNonce] = useState(0)

  const openForm = useCallback((next: FormKind, nextItem?: FormItem | null, nextMode: FormMode = 'edit') => {
    setItem(nextItem ?? null)
    setMode(nextItem && nextMode === 'view' ? 'view' : 'edit')
    setKind(next)
  }, [])
  const closeForm = useCallback((saved?: boolean) => {
    setKind(null)
    setItem(null)
    setMode('edit')
    if (saved) setNonce((n) => n + 1)
  }, [])

  const value = useMemo(
    () => ({ kind, item, mode, nonce, openForm, closeForm }),
    [kind, item, mode, nonce, openForm, closeForm]
  )

  return (
    <FormDrawerContext.Provider value={value}>
      {children}
      <FormDrawerPanel />
    </FormDrawerContext.Provider>
  )
}

function FormDrawerPanel() {
  const { kind, item, mode, openForm, closeForm } = useFormDrawer()
  const open = kind !== null
  const width = Math.min(360, Dimensions.get('window').width * 0.92)
  const translateX = useRef(new Animated.Value(width)).current
  const overlay = useRef(new Animated.Value(0)).current
  const formKey = `${kind ?? 'none'}-${item?.id ?? 'new'}-${mode}`

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
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlay }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => closeForm()} />
      </Animated.View>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.panel,
          { width, backgroundColor: colors.bg, transform: [{ translateX }] },
        ]}
      >
        {kind === 'expense' ? (
          <ExpenseForm
            key={formKey}
            item={item as Expense | null}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'income' ? (
          <IncomeForm
            key={formKey}
            item={item as Income | null}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'credit' ? (
          <CreditForm
            key={formKey}
            item={item as Credit | null}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'todo' ? (
          <TodoForm
            key={formKey}
            item={item as Todo | null}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'agenda' ? (
          <AgendaForm
            key={formKey}
            item={item as AgendaEvent | null}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
        {kind === 'settings' ? (
          <SettingsForm onClose={() => closeForm()} onSaved={() => closeForm(true)} />
        ) : null}
        {kind === 'history' && mode === 'view' && item ? (
          <HistoryDetail
            key={formKey}
            item={item as HistoryProof}
            onClose={() => closeForm()}
            onEdit={() => openForm('history', item, 'edit')}
            onDeleted={() => closeForm(true)}
          />
        ) : null}
        {kind === 'history' && (mode !== 'view' || !item) ? (
          <HistoryForm
            key={formKey}
            item={item as HistoryProof | null}
            onClose={() => closeForm()}
            onSaved={() => closeForm(true)}
          />
        ) : null}
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    zIndex: 40,
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 41,
    elevation: 16,
  },
})
