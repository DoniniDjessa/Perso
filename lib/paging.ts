import { useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE = 20

export function usePage<T>(items: T[], resetKey?: unknown) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))

  useEffect(() => {
    setPage(0)
  }, [resetKey])

  const safePage = Math.min(page, pageCount - 1)
  const slice = useMemo(
    () => items.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [items, safePage]
  )

  return {
    slice,
    total: items.length,
    from: items.length === 0 ? 0 : safePage * PAGE_SIZE + 1,
    to: Math.min((safePage + 1) * PAGE_SIZE, items.length),
    canPrev: safePage > 0,
    canNext: safePage < pageCount - 1,
    prev: () => setPage((current) => Math.max(current - 1, 0)),
    next: () => setPage((current) => Math.min(current + 1, pageCount - 1)),
    hasPager: items.length > PAGE_SIZE,
  }
}
