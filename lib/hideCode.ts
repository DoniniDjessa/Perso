export function normalizeHideCode(value: string) {
  return value.replace(/\s/g, '')
}

export function validateHideCode(value: string) {
  if (!/^\d{4,8}$/.test(normalizeHideCode(value))) {
    return 'Le code doit contenir 4 à 8 chiffres.'
  }
  return null
}

export function hashHideCode(code: string, userId: string) {
  const input = `perso-hide|${userId}|${normalizeHideCode(code)}`
  let a = 2166136261
  let b = 16777619
  let c = 0x9e3779b9
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i)
    a ^= ch
    a = Math.imul(a, 16777619)
    b = Math.imul(b ^ ch, 2246822519)
    c = (Math.imul(c, 2654435761) + ch * (i + 1)) >>> 0
  }
  return [a, b, c].map((n) => (n >>> 0).toString(16).padStart(8, '0')).join('')
}
