import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'ko' | 'en' | 'cn';
export type Theme = 'light' | 'dark' | 'system';
export type NoteLanguage = 'KO' | 'EN' | 'CN';

interface SettingsState {
  // UI Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Note language (for viewing)
  noteLanguage: NoteLanguage;
  setNoteLanguage: (lang: NoteLanguage) => void;

  // Sidebar collapsed
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'ko',
      setLanguage: (language) => set({ language }),

      theme: 'light',
      setTheme: (theme) => {
        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // System preference
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        set({ theme });
      },

      noteLanguage: 'KO',
      setNoteLanguage: (noteLanguage) => set({ noteLanguage }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'aipo-settings',
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        noteLanguage: state.noteLanguage,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Apply theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('aipo-settings');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (state?.theme === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch {
      // Ignore
    }
  }
}
