import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import 'flag-icons/css/flag-icons.min.css';
import App from './App';
import { useFiltersStore } from './state/filtersStore';
import { usePaletteStore } from './state/paletteStore';
import { parseFiltersFromSearch } from './state/searchParams';
import { createAppTheme } from './theme';
import './global.scss';

const queryClient = new QueryClient();

useFiltersStore.getState().hydrate(parseFiltersFromSearch(window.location.search));

function Root() {
  const palette = usePaletteStore((state) => state.palette);
  const theme = useMemo(() => createAppTheme(palette), [palette]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MantineProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
