export const EXPENSE_CATEGORIES = [
  'Transport',
  'Nourriture',
  'Développement',
  'Dons',
  'Wife',
  'Baby',
  'Travail',
  'Paris Sportif',
  'Autres',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export function asExpenseCategory(value: string | null | undefined): ExpenseCategory | null {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory) ? (value as ExpenseCategory) : null
}

export const INCOME_CATEGORIES = [
  'Salaire',
  'Business',
  'Famille',
  'Cadeau',
  'Remboursement',
  'Investissement',
  'Autres',
] as const

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]

export function asIncomeCategory(value: string | null | undefined): IncomeCategory | null {
  return INCOME_CATEGORIES.includes(value as IncomeCategory) ? (value as IncomeCategory) : null
}

export const CREDIT_DIRECTIONS = [
  { value: 'lent', label: 'J’ai prêté', hint: 'On me doit' },
  { value: 'borrowed', label: 'J’ai emprunté', hint: 'Je dois' },
] as const

export type CreditDirection = (typeof CREDIT_DIRECTIONS)[number]['value']

export function asCreditDirection(value: string | null | undefined): CreditDirection {
  return value === 'borrowed' ? 'borrowed' : 'lent'
}

export function creditDirectionLabel(value?: string | null) {
  return CREDIT_DIRECTIONS.find((item) => item.value === value)?.label ?? CREDIT_DIRECTIONS[0].label
}
