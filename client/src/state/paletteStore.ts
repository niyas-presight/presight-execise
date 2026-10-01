import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PALETTE, type PaletteName } from '../theme';

interface PaletteState {
  palette: PaletteName;
  setPalette: (palette: PaletteName) => void;
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set) => ({
      palette: DEFAULT_PALETTE,
      setPalette: (palette) => set({ palette }),
    }),
    { name: 'palette' },
  ),
);
