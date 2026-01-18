import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            // In Next.js 16, cookies() returns ReadonlyRequestCookies
            // Use the get method directly
            const cookie = cookieStore.get(name)
            return cookie?.value
          } catch (error) {
            // Silently fail - cookies might not be available in all contexts
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // In Next.js 16, use set method directly
            cookieStore.set(name, value, options)
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // In Next.js 16, use delete or set with empty value
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

