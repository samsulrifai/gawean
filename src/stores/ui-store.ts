import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean
  isSearchOpen: boolean
  isTrashOpen: boolean
  isDarkMode: boolean
  sidebarWidth: number

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSearch: () => void
  toggleTrash: () => void
  toggleDarkMode: () => void
  setSidebarWidth: (width: number) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  isSearchOpen: false,
  isTrashOpen: false,
  isDarkMode: true,
  sidebarWidth: 280,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  toggleTrash: () => set((state) => ({ isTrashOpen: !state.isTrashOpen })),
  toggleDarkMode: () =>
    set((state) => {
      const newDark = !state.isDarkMode
      if (newDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { isDarkMode: newDark }
    }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
}))
