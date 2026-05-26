import { create } from "zustand";

type UiState = {
  mobileNavOpen: boolean;
  activeChampionshipId: string | null;
  setMobileNavOpen: (open: boolean) => void;
  setActiveChampionshipId: (id: string | null) => void;
};

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  activeChampionshipId: null,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setActiveChampionshipId: (id) => set({ activeChampionshipId: id }),
}));
