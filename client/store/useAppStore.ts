import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
}

interface AppStore {
  // auth state
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // sidebar state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      login: () => {
        window.location.href = '/api/auth/github';
      },
      logout: async () => {
        // Call backend to clear the token (cookie)
        await fetch('/api/auth/logout', {
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
          const res = await fetch('/api/test-auth', {
            method: 'GET',
            credentials: 'include', // Send cookies with the request
          });
          if (res.ok) {
            // If authenticated, get the user data from the response
            const data = await res.json();
            set({ user: data.user, isLoading: false });
          } else if (res.status === 401) {
            // If not authenticated, clear the user state
            set({ user: null, isLoading: false });
          }
        } catch (error) {
          set({ user: null, isLoading: false });
        }
      },
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ user: state.user, isSidebarOpen: state.isSidebarOpen }),
    }
  )
);