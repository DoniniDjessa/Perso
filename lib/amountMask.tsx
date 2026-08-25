import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type AmountMaskValue = {
  hidden: boolean
  toggle: () => void
}

const AmountMaskContext = createContext<AmountMaskValue | null>(null)

export function AmountMaskProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const value = useMemo(
    () => ({
      hidden,
      toggle: () => setHidden((current) => !current),
    }),
    [hidden]
  )
  return <AmountMaskContext.Provider value={value}>{children}</AmountMaskContext.Provider>
}

export function useAmountMask() {
  const ctx = useContext(AmountMaskContext)
  if (!ctx) throw new Error('useAmountMask must be used within AmountMaskProvider')
  return ctx
}
