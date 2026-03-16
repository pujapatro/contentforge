import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  activeBrandId: string | null
  selectedMonth: string
  sidebarOpen: boolean
  setActiveBrand: (brandId: string | null) => void
  setSelectedMonth: (month: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeBrandId: null,
      selectedMonth: new Date().toISOString().slice(0, 7),
      sidebarOpen: true,
      setActiveBrand: (brandId) => set({ activeBrandId: brandId }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'contentforge-app-store',
      partialize: (state) => ({
        activeBrandId: state.activeBrandId,
        selectedMonth: state.selectedMonth,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
