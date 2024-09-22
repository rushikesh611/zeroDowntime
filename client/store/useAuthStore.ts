import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    githubId: string;
    username: string;
    email: string;
}

interface AuthStore {
    user: User | null
    token: string | null
    isLoading: boolean
    login: () => void
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
    setToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: true,
            login: () => {
                window.location.href = 'http://localhost:3001/api/auth/github'
            },
            logout: async () => {
                await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' })
                set({ user: null, token: null })
                window.location.href = '/'
            },
            checkAuth: async () => {
                try {
                    const res = await fetch('http://localhost:3001/api/test-auth', {
                        headers: {
                            'Authorization': `Bearer ${useAuthStore.getState().token}`
                        }
                    })
                    if (res.ok) {
                        const user = await res.json()
                        set({ user, isLoading: false })
                    } else {
                        set({ user: null, token: null, isLoading: false })
                    }
                } catch (error) {
                    set({ user: null, token: null, isLoading: false })
                }
            },
            setToken: (token: string) => set({ token })
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
)