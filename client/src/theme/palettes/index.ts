import { DEFAULT_THEME, type MantineColorsTuple } from '@mantine/core';
import { amber } from './amber';
import { forest } from './forest';
import { ocean } from './ocean';
import { plum } from './plum';
import { rose } from './rose';
import { slate } from './slate';
import { sunset } from './sunset';
import { teal } from './teal';

export const palettes = {
  teal,
  ocean,
  blue: DEFAULT_THEME.colors.blue,
  indigo: DEFAULT_THEME.colors.indigo,
  violet: DEFAULT_THEME.colors.violet,
  plum,
  grape: DEFAULT_THEME.colors.grape,
  pink: DEFAULT_THEME.colors.pink,
  rose,
  sunset,
  orange: DEFAULT_THEME.colors.orange,
  amber,
  green: DEFAULT_THEME.colors.green,
  forest,
  slate,
} satisfies Record<string, MantineColorsTuple>;

export type PaletteName = keyof typeof palettes;

export const DEFAULT_PALETTE: PaletteName = 'teal';
