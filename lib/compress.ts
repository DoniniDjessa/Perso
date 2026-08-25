import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { supabase } from '@/lib/supabase'
import { BUCKET } from '@/lib/db'

const MAX_WIDTH = 960
const QUALITY = 0.25

export async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  )
  return result.uri
}

export async function pickCompressedImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.2,
    allowsEditing: false,
  })
  if (picked.canceled || !picked.assets[0]) return null
  return compressImage(picked.assets[0].uri)
}

export async function saveCompressedImage(userId: string, parentId: string, uri: string) {
  const compressed = await compressImage(uri)
  const path = `${userId}/${parentId}/${Date.now()}.jpg`
  const response = await fetch(compressed)
  const body = await response.arrayBuffer()
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function signedImageUrl(path: string | null | undefined) {
  if (!path) return null
  if (path.startsWith('file:') || path.startsWith('content:') || path.startsWith('http')) return path
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

export async function removeStoragePath(path: string | null | undefined) {
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined)
}

/** undefined = leave image_path unchanged */
export async function persistItemImage(
  userId: string,
  parentId: string,
  currentPath: string | null | undefined,
  imageUri: string | null,
  dirty: boolean
) {
  if (!dirty) return undefined
  if (!imageUri) {
    await removeStoragePath(currentPath)
    return null
  }
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    return currentPath ?? null
  }
  const next = await saveCompressedImage(userId, parentId, imageUri)
  if (currentPath && currentPath !== next) await removeStoragePath(currentPath)
  return next
}

const MAX_MEDIA_BYTES = 40 * 1024 * 1024

export type PickedMedia = {
  uri: string
  name: string
  mime: string
  size?: number
}

function extFromName(name: string, fallback: string) {
  const match = name.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : fallback
}

function mimeFromExt(ext: string, fallback: string) {
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    wav: 'audio/wav',
    caf: 'audio/x-caf',
    ogg: 'audio/ogg',
  }
  return map[ext] ?? fallback
}

export async function pickVideoFile(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    quality: 0.4,
    videoMaxDuration: 180,
    allowsEditing: false,
  })
  if (picked.canceled || !picked.assets[0]) return null
  const asset = picked.assets[0]
  const name = asset.fileName || `video.${extFromName(asset.uri, 'mp4')}`
  const ext = extFromName(name, 'mp4')
  return {
    uri: asset.uri,
    name,
    mime: asset.mimeType || mimeFromExt(ext, 'video/mp4'),
    size: asset.fileSize,
  }
}

export async function pickAudioFile(): Promise<PickedMedia | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['audio/*'],
    copyToCacheDirectory: true,
    multiple: false,
  })
  if (picked.canceled || !picked.assets?.[0]) return null
  const asset = picked.assets[0]
  const name = asset.name || `audio.${extFromName(asset.uri, 'm4a')}`
  const ext = extFromName(name, 'm4a')
  return {
    uri: asset.uri,
    name,
    mime: asset.mimeType || mimeFromExt(ext, 'audio/mpeg'),
    size: asset.size,
  }
}

export async function persistItemFile(
  userId: string,
  parentId: string,
  currentPath: string | null | undefined,
  file: PickedMedia | string | null,
  dirty: boolean,
  fallbackExt: string,
  fallbackMime: string
) {
  if (!dirty) return undefined
  if (!file) {
    await removeStoragePath(currentPath)
    return null
  }
  const uri = typeof file === 'string' ? file : file.uri
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return currentPath ?? null
  }
  const name = typeof file === 'string' ? `file.${fallbackExt}` : file.name
  const mime = typeof file === 'string' ? fallbackMime : file.mime
  const size = typeof file === 'string' ? undefined : file.size
  if (size && size > MAX_MEDIA_BYTES) {
    throw new Error('Fichier trop lourd (max 40 Mo). Ajoute un lien à la place.')
  }
  const ext = extFromName(name, fallbackExt)
  const path = `${userId}/${parentId}/${Date.now()}.${ext}`
  const response = await fetch(uri)
  const body = await response.arrayBuffer()
  if (body.byteLength > MAX_MEDIA_BYTES) {
    throw new Error('Fichier trop lourd (max 40 Mo). Ajoute un lien à la place.')
  }
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: mime || fallbackMime,
    upsert: false,
  })
  if (error) throw error
  if (currentPath && currentPath !== path) await removeStoragePath(currentPath)
  return path
}
