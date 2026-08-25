import { signedImageUrl, type PickedMedia } from '@/lib/compress'
import { useEffect, useState } from 'react'

export function useItemMedia(path: string | null | undefined) {
  const [file, setFile] = useState<PickedMedia | string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    let active = true
    setDirty(false)
    if (!path) {
      setFile(null)
      return
    }
    signedImageUrl(path).then((url) => {
      if (active) setFile(url)
    })
    return () => {
      active = false
    }
  }, [path])

  return {
    file,
    uri: typeof file === 'string' ? file : file?.uri ?? null,
    label: typeof file === 'string' ? 'Fichier ajouté' : file?.name ?? null,
    dirty,
    onChange: (next: PickedMedia | null) => {
      setDirty(true)
      setFile(next)
    },
  }
}
