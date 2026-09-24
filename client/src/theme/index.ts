import { createTheme } from '@mantine/core';
import { defaultTheme } from './colors';

export const theme = createTheme({
  primaryColor: 'default',
  colors: { default: defaultTheme },
  defaultRadius: 'md',
});
