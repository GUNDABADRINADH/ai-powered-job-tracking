import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      darkMode: true,          // default to dark mode
      chatOpen: false,

      toggleDark: () =>
        set((state) => ({ darkMode: !state.darkMode })),

      setChatOpen: (val) => set({ chatOpen: val }),
    }),
    {
      name: 'jt-ui',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
);
