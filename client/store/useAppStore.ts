import { Monitor } from '@/app/(dashboard)/monitors/page';
import { fetchWithAuth } from '@/lib/utils';
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

  // monitors state
  monitors: Monitor[];
  fetchMonitors: () => Promise<void>
  pauseMonitor: (monitorId: string) => Promise<void>
  startMonitor: (monitorId: string) => Promise<void>
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
      // Monitors state
      monitors: [],
      fetchMonitors: async () => {
        try {
          const response = await fetchWithAuth('/api/monitors')
          if (!response.ok) {
            throw new Error('Failed to fetch monitors')
          }
          const data = await response.json()
          set({ monitors: data })
        } catch (error) {
          console.error('Error fetching monitors:', error)
        }
      },
      pauseMonitor: async (monitorId: string) => {
        const data = { status: 'PAUSED' }
        try {
          const response = await fetchWithAuth(`/api/monitors/${monitorId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          if (!response.ok) {
            throw new Error('Failed to pause monitor')
          }
          set((state) => ({
            monitors: state.monitors.map((monitor) =>
              monitor.id === monitorId ? { ...monitor, status: 'PAUSED' } : monitor
            )
          }))
        } catch (error) {
          console.error('Error pausing monitor:', error)
        }
      },
      startMonitor: async (monitorId: string) => {
        const data = { status: 'ACTIVE' }
        try {
          const response = await fetchWithAuth(`/api/monitors/${monitorId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          if (!response.ok) {
            throw new Error('Failed to start monitor')
          }
          set((state) => ({
            monitors: state.monitors.map((monitor) =>
              monitor.id === monitorId ? { ...monitor, status: 'ACTIVE' } : monitor
            )
          }))
        } catch (error) {
          console.error('Error starting monitor:', error)
        }
      }
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ user: state.user, isSidebarOpen: state.isSidebarOpen }),
    }
  )
);