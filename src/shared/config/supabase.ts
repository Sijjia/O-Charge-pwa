import { createClient } from '@supabase/supabase-js'
import { logger } from '@/shared/utils/logger'

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY']

let url: string
let key: string

// In production with cookie auth, Supabase is optional (auth handled by backend cookies)
if (!supabaseUrl || !supabaseAnonKey) {
  // Use dummy values — cookie auth mode doesn't need Supabase
  url = 'https://placeholder.supabase.co'
  key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

  if (import.meta.env.PROD) {
    logger.warn('Supabase not configured — using cookie-based auth')
  } else {
    logger.warn('Using dummy Supabase config for development')
  }
} else {
  url = supabaseUrl
  key = supabaseAnonKey
}

export const isPlaceholder = url.includes('placeholder')

export const supabase = createClient(url, key, {
  auth: {
    persistSession: !isPlaceholder,
    autoRefreshToken: !isPlaceholder,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'rp-auth-token',
    detectSessionInUrl: !isPlaceholder,
  },
  realtime: isPlaceholder ? { params: { apikey: key } } : undefined,
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
})

// Отключаем realtime когда Supabase не настроен — убиваем все каналы
// и подменяем channel() чтобы не давать новым подпискам создаваться
if (isPlaceholder) {
  supabase.removeAllChannels()
  supabase.channel = () => {
    const noop = { on: () => noop, subscribe: () => noop, unsubscribe: () => noop } as never
    return noop
  }
}