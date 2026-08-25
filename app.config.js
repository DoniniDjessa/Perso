const fs = require('fs')
const path = require('path')

function loadEnvLocal() {
  const file = path.join(__dirname, '.env.local')
  const out = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = loadEnvLocal()
if (env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.EXPO_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
}
if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
})
