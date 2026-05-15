import { fetchWithAuth } from '@/lib/utils';
import { Monitor, Notifier } from '@/types';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type User = {
  id: string;
  githubId: string;
  username: string;
  email: string;
  avatarUrl: string;
  plan: 'FREE' | 'PRO' | 'PRO_PLUS';
}

interface AppStore {
  // auth state
  user: User | null;

  isLoading: boolean;
  loginWithGithub: () => void;
  loginWithGoogle: () => void;
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
  fetchMonitorById: (monitorId: string) => Promise<Monitor | undefined>
  deleteMonitor: (monitorId: string) => Promise<void>

  // notifiers state
  notifiers: Notifier[];
  fetchNotifiers: () => Promise<void>;
  createNotifier: (data: { name: string; type: string; details: string }) => Promise<void>;
  updateNotifier: (id: string, data: { name?: string; type?: string; details?: string }) => Promise<void>;
  deleteNotifier: (id: string) => Promise<void>;
  testNotifier: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isLoading: true,
        loginWithGithub: () => {
          set({ isLoading: true });
          window.location.href = '/api/auth/github';
        },
        loginWithGoogle: () => {
          set({ isLoading: true });
          window.location.href = '/api/auth/google';
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
            const data = response.status === 204 ? [] : await response.json()
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
          const data = { status: 'RUNNING' }
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
                monitor.id === monitorId ? { ...monitor, status: 'RUNNING' } : monitor
              )
            }))
          } catch (error) {
            console.error('Error starting monitor:', error)
          }
        },
        fetchMonitorById: async (monitorId: string) => {
          try {
            const response = await fetchWithAuth(`/api/monitors/${monitorId}`)
            if (!response.ok) {
              throw new Error('Failed to fetch monitor')
            }
            if (response.status === 204) return undefined
            const data = await response.json()
            return data
          } catch (error) {
            console.error('Error fetching monitor:', error)
          }
        },
        deleteMonitor: async (monitorId: string) => {
          try {
            const response = await fetchWithAuth(`/api/monitors/${monitorId}`, {
              method: 'DELETE'
            })
            if (!response.ok) {
              throw new Error('Failed to delete monitor')
            }
            set((state) => ({
              monitors: state.monitors.filter((monitor) => monitor.id !== monitorId)
            }))
          } catch (error) {
            console.error('Error deleting monitor:', error)
          }
        },
        // Notifiers state
        notifiers: [],
        fetchNotifiers: async () => {
          try {
            const response = await fetchWithAuth('/api/notifiers')
            if (!response.ok) {
              throw new Error('Failed to fetch notifiers')
            }
            const data = response.status === 204 ? [] : await response.json()
            set({ notifiers: data })
          } catch (error) {
            console.error('Error fetching notifiers:', error)
          }
        },
        createNotifier: async (data) => {
          try {
            const response = await fetchWithAuth('/api/notifiers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            })
            if (!response.ok) {
              throw new Error('Failed to create notifier')
            }
            const newNotifier = await response.json()
            set((state) => ({ notifiers: [newNotifier, ...state.notifiers] }))
          } catch (error) {
            console.error('Error creating notifier:', error)
            throw error
          }
        },
        updateNotifier: async (id, data) => {
          try {
            const response = await fetchWithAuth(`/api/notifiers/${id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(data)
            })
            if (!response.ok) {
              throw new Error('Failed to update notifier')
            }
            const updated = await response.json()
            set((state) => ({
              notifiers: state.notifiers.map((n) => (n.id === id ? updated : n))
            }))
          } catch (error) {
            console.error('Error updating notifier:', error)
            throw error
          }
        },
        deleteNotifier: async (id) => {
          try {
            const response = await fetchWithAuth(`/api/notifiers/${id}`, {
              method: 'DELETE'
            })
            if (!response.ok) {
              throw new Error('Failed to delete notifier')
            }
            set((state) => ({
              notifiers: state.notifiers.filter((n) => n.id !== id)
            }))
          } catch (error) {
            console.error('Error deleting notifier:', error)
            throw error
          }
        },
        testNotifier: async (id) => {
          try {
            const response = await fetchWithAuth(`/api/notifiers/${id}/test`, {
              method: 'POST'
            })
            const data = await response.json()
            if (!response.ok) {
              return { success: false, error: data.error }
            }
            return { success: true }
          } catch (error: any) {
            console.error('Error testing notifier:', error)
            return { success: false, error: error.message }
          }
        }
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ user: state.user, isSidebarOpen: state.isSidebarOpen }),
      }
    )
  )
);