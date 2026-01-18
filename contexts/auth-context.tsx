"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session } from "@/lib/types"
import { supabase } from "@/lib/supabase/client"
import { getProfile } from "@/lib/supabase/api"
import type { Profile } from "@/lib/supabase/types"

interface AuthContextType {
  session: Session | null
  profile: Profile | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (firstName: string, lastName: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setSession(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await getProfile(userId)
      if (userProfile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setSession({
            userId: user.id,
            name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || user.email || 'User',
            email: user.email || '',
          })
          setProfile(userProfile)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Provide a more user-friendly error message for email confirmation
        if (error.message.includes('email_not_confirmed') || error.code === 'email_not_confirmed') {
          return { 
            success: false, 
            error: 'Please check your email and confirm your account before logging in. If you didn\'t receive an email, check your spam folder or contact support.' 
          }
        }
        return { success: false, error: error.message }
      }

      if (data.user) {
        await loadUserProfile(data.user.id)
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
    }
  }

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    password: string,
  ): Promise<{ success: boolean; error?: string; requiresConfirmation?: boolean }> => {
    try {
      // Trim and clean the names and phone
      const trimmedFirstName = firstName.trim() || ''
      const trimmedLastName = lastName.trim() || null
      const trimmedPhone = phone.trim() || null

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            phone: trimmedPhone,
          },
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Check if email confirmation is required
        const requiresConfirmation = !data.session && data.user && !data.user.email_confirmed_at

        // Profile is auto-created by trigger, but we can update it with name and phone
        if (trimmedFirstName || trimmedLastName || trimmedPhone) {
          await supabase
            .from('profiles')
            .update({
              first_name: trimmedFirstName || null,
              last_name: trimmedLastName,
              phone: trimmedPhone,
            })
            .eq('id', data.user.id)
        }

        // If email confirmation is not required, load the profile
        if (!requiresConfirmation && data.session) {
          await loadUserProfile(data.user.id)
          return { success: true }
        }

        // If email confirmation is required, return success but indicate confirmation needed
        return { success: true, requiresConfirmation: true }
      }

      return { success: false, error: 'Registration failed' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
    }
  }

  const logout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear state
    setSession(null)
    setProfile(null)
    
    // Clear all storage
    if (typeof window !== 'undefined') {
      // Clear session storage (checkout data, etc.)
      sessionStorage.clear()
      // Clear any Supabase auth tokens from localStorage
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
        if (projectRef) {
          localStorage.removeItem(`sb-${projectRef}-auth-token`)
        }
        // Clear all Supabase related keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }
    }
  }

  const contextValue = {
    session,
    profile,
    login,
    register,
    logout,
    isAuthenticated: !!session,
    loading,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
