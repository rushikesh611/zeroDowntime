import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    githubId: string;
    username: string;
    email: string;
}

interface AuthStore {
    user: User | null
    isLoading: boolean
    login: () => void
    logout: () => Promise<void>
    checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            login: () => {
                window.location.href = 'http://localhost:3001/api/auth/github'
            },
            logout: async () => {
                // Call backend to clear the token (cookie)
                await fetch('http://localhost:3001/api/auth/logout', {
                    method: 'GET',
                    credentials: 'include', // Ensures the cookie is sent with the request
                });

                // Clear the user data in Zustand state
                set({ user: null });

                // Redirect to home page after logout
                window.location.href = '/';
            },
            checkAuth: async () => {
                try {
                    const res = await fetch('http://localhost:3001/api/test-auth', {
                        method: 'GET',
                        credentials: 'include', // Send cookies with the request
                    });
                    if (res.ok) {
                        // If authenticated, get the user data from the response
                        const user = await res.json();
                        set({ user, isLoading: false });
                    } else {
                        // If not authenticated, clear the user state
                        set({ user: null, isLoading: false });
                    }
                } catch (error) {
                    set({ user: null, isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage', // Optional: You can persist user data in localStorage if needed
            partialize: (state) => ({ user: state.user }), // Persist only the user state (if required)
        }
    )
)