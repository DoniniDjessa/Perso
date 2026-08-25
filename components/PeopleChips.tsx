import { colors, fonts } from '@/lib/theme'
import type { AssignedPerson } from '@/lib/types'
import { Text } from 'tamagui'

export function PeopleChips({ people }: { people?: AssignedPerson[] | null }) {
  if (!people?.length) return null
  return (
    <Text style={{ ...fonts.medium, color: colors.muted, fontSize: 12, marginTop: 2 }}>
      {people.map((person) => person.name).join(' · ')}
    </Text>
  )
}
