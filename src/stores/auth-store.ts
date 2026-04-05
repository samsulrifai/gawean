import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean

  initialize: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
        isInitialized: true,
      })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        })
      })
    } catch {
      set({ isLoading: false, isInitialized: true })
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true })
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })
    set({ isLoading: false })
    return { error: error?.message ?? null }
  },

  signIn: async (email, password) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (data.session) {
      set({ session: data.session, user: data.user, isLoading: false })
    } else {
      set({ isLoading: false })
    }
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
