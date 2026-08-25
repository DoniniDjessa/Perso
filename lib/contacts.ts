import type { AssignedPerson } from '@/lib/types'
import { Platform } from 'react-native'

export async function requestContactsPermission() {
  if (Platform.OS === 'web') return false
  const Contacts = await import('expo-contacts')
  const current = await Contacts.getPermissionsAsync()
  const next = current.granted ? current : await Contacts.requestPermissionsAsync()
  return next.granted
}

export async function loadContacts(): Promise<{ granted: boolean; people: AssignedPerson[] }> {
  if (Platform.OS === 'web') return { granted: false, people: [] }
  const granted = await requestContactsPermission()
  if (!granted) return { granted: false, people: [] }
  const Contacts = await import('expo-contacts')
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name],
    sort: Contacts.SortTypes.FirstName,
  })
  return {
    granted: true,
    people: data
      .map((contact) => ({
        id: contact.id ?? '',
        name: contact.name?.trim() || 'Sans nom',
      }))
      .filter((person) => person.id),
  }
}
