import { signedImageUrl } from '@/lib/compress'
import { useEffect, useState } from 'react'

export function useItemImage(path: string | null | undefined) {
  const [uri, setUri] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let active = true
    setDirty(false)
    if (!path) {
      setUri(null)
      return
    }
    signedImageUrl(path).then((url) => {
      if (active) setUri(url)
    })
    return () => {
      active = false
    }
  }, [path])

  return {
    uri,
    dirty,
    onChange: (next: string | null) => {
      setDirty(true)
      setUri(next)
    },
  }
}
