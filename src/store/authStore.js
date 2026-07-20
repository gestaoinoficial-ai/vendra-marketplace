import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  role: 'admin', // default role (simulates logged-in as admin)
  user: { id: 'demo-user', email: 'demo@vendra.com' },
  setRole: (role) => set({ role }),
  switchRole: (role) => set({ role }),
}))
