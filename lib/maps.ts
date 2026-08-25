import { Platform } from 'react-native'
import * as Linking from 'expo-linking'

export type MapPoint = {
  lat: number
  lng: number
  label: string
}

export function mapPointFrom(item: {
  map_lat?: number | null
  map_lng?: number | null
  map_label?: string | null
}): MapPoint | null {
  if (item.map_lat == null || item.map_lng == null) return null
  const lat = Number(item.map_lat)
  const lng = Number(item.map_lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng, label: item.map_label?.trim() || 'Position' }
}

export function mapColumns(point: MapPoint | null) {
  return {
    map_lat: point?.lat ?? null,
    map_lng: point?.lng ?? null,
    map_label: point?.label ?? null,
  }
}

export async function captureCurrentPosition(): Promise<MapPoint> {
  const Location = await import('expo-location')
  const current = await Location.getForegroundPermissionsAsync()
  const status = current.granted ? current : await Location.requestForegroundPermissionsAsync()
  if (!status.granted) {
    throw new Error('Autorise la localisation pour enregistrer la position.')
  }
  const fix = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })
  const lat = fix.coords.latitude
  const lng = fix.coords.longitude
  let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  try {
    const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
    const place = places[0]
    if (place) {
      label = [place.name, place.street, place.city, place.country].filter(Boolean).join(', ')
    }
  } catch {
    // Keep coordinates as label.
  }
  return { lat, lng, label }
}

export function openGoogleMaps(point: MapPoint) {
  const dest = `${point.lat},${point.lng}`
  const url =
    Platform.OS === 'ios'
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`
      : Platform.OS === 'android'
        ? `google.navigation:q=${dest}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`
  void Linking.openURL(url).catch(() => {
    void Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`
    )
  })
}
