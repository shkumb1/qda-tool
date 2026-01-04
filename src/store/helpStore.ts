import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HelpState {
  // Help modal state
  helpModalOpen: boolean;
  keyboardShortcutsOpen: boolean;

  // Onboarding state
  hasCompletedOnboarding: boolean;
  showOnboarding: boolean;

  // Actions
  setHelpModalOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useHelpStore = create<HelpState>()(
  persist(
    (set) => ({
      helpModalOpen: false,
      keyboardShortcutsOpen: false,
      hasCompletedOnboarding: false,
      showOnboarding: false,

      setHelpModalOpen: (open) => set({ helpModalOpen: open }),
      setKeyboardShortcutsOpen: (open) => set({ keyboardShortcutsOpen: open }),
      setShowOnboarding: (show) => set({ showOnboarding: show }),
      completeOnboarding: () =>
        set({ hasCompletedOnboarding: true, showOnboarding: false }),
      resetOnboarding: () =>
        set({ hasCompletedOnboarding: false, showOnboarding: true }),
    }),
    {
      name: "help-storage",
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
