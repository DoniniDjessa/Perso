export const colors = {
  indigo: '#4F46E5',
  indigoDeep: '#4338CA',
  violet: '#7C3AED',
  violetLight: '#A78BFA',
  violetSoft: '#F3F0FF',

  black: '#111111',
  text: '#111111',
  muted: '#8C8C94',
  gray: '#EDEDF2',
  bg: '#F5F5F8',
  card: '#FFFFFF',
  white: '#FFFFFF',
  border: '#EDEDF2',
  shadow: '#111111',

  tabBar: '#111111',
  tabIcon: '#FFFFFF',

  danger: '#DC2626',
  success: '#16A34A',
}

export const fonts = {
  regular: { fontFamily: 'PlusJakartaSans_400Regular' as const },
  medium: { fontFamily: 'PlusJakartaSans_500Medium' as const },
  semibold: { fontFamily: 'PlusJakartaSans_600SemiBold' as const },
  bold: { fontFamily: 'PlusJakartaSans_700Bold' as const },
  extra: { fontFamily: 'PlusJakartaSans_800ExtraBold' as const },
}

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
}
