import { createTheme } from '@mantine/core';
import { palettes, type PaletteName } from './palettes';

export const createAppTheme = (palette: PaletteName) =>
  createTheme({
    colors: palettes,
    primaryColor: palette,
    defaultRadius: 'md',
  });
