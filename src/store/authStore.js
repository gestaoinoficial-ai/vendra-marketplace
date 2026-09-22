import { create } from 'zustand'
import { supabase } from '../services/supabase'

export const useAuthStore = create((set, get) => ({
  session: null,
  parceiro: null,
  loading: true,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    set({ initialized: true })

    const { data: { session } } = await supabase.auth.getSession()
    await get().applySession(session)

    supabase.auth.onAuthStateChange((_event, session) => {
      get().applySession(session)
    })
  },

  applySession: async (session) => {
    if (!session) {
      set({ session: null, parceiro: null, loading: false })
      return
    }

    const { data: parceiro } = await supabase
      .from('parceiros')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    set({ session, parceiro: parceiro ?? null, loading: false })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await get().applySession(data.session)
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, parceiro: null })
  },
}))
