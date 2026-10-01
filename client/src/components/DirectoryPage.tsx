import {
  ColorSwatch,
  Group,
  Notification,
  SegmentedControl,
  Select,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { ApiRequestError } from "../lib/api";
import { useNetworkWarning } from "../hooks/useNetworkWarning";
import { useFiltersStore } from "../state/filtersStore";
import { usePaletteStore } from "../state/paletteStore";
import { useInfiniteUsers } from "../state/useInfiniteUsers";
import { useFiltersUrlSync } from "../state/useFiltersUrlSync";
import { palettes, type PaletteName } from "../theme";
import DirectoryStates from "./DirectoryStates";
import FilterSidebar from "./FilterSidebar";
import SearchBar from "./SearchBar";
import SortControls from "./SortControls";
import styles from "./DirectoryPage.module.scss";

const paletteOptions = Object.keys(palettes).map((name) => ({
  value: name,
  label: name[0].toUpperCase() + name.slice(1),
}));

function DirectoryPage() {
  useFiltersUrlSync();
  const q = useFiltersStore((state) => state.q);
  const hobbies = useFiltersStore((state) => state.hobbies);
  const nationalities = useFiltersStore((state) => state.nationalities);
  const sort = useFiltersStore((state) => state.sort);
  const direction = useFiltersStore((state) => state.direction);
  const usersQuery = useInfiniteUsers({
    q,
    hobbies,
    nationalities,
    sort,
    direction,
  });
  const listKey = JSON.stringify(usersQuery.queryKey);
  const isRefreshingResults =
    Boolean(usersQuery.data) &&
    usersQuery.isFetching &&
    !usersQuery.isFetchingNextPage;
  const hasNetworkError =
    usersQuery.isError &&
    !usersQuery.isFetchNextPageError &&
    !(usersQuery.error instanceof ApiRequestError);
  const { setColorScheme } = useMantineColorScheme();
  const colorScheme = useComputedColorScheme("light");
  const palette = usePaletteStore((state) => state.palette);
  const setPalette = usePaletteStore((state) => state.setPalette);
  const { isNetworkNotificationVisible, hideNetworkNotification } = useNetworkWarning(
    { q, hobbies, nationalities, sort, direction },
    hasNetworkError,
  );

  return (
    <main className={styles.page}>
      {isNetworkNotificationVisible && (
        <Notification
          className={styles.networkNotification}
          color="red"
          title="Connection unavailable"
          onClose={hideNetworkNotification}
        >
          Check your connection and try the search again.
        </Notification>
      )}
      <header className={styles.header}>
        <Group className={styles.heading} justify="space-between" align="end">
          <div>
            <Title order={1} className={styles.title}>
              Actors, easier to find.
            </Title>
            <Text c="dimmed" mt="xs">
              Explore the actor directory
            </Text>
          </div>
          <Group gap="md" align="center">
            <Select
              className={styles.paletteSelect}
              aria-label="Color palette"
              value={palette}
              onChange={(value) => value && setPalette(value as PaletteName)}
              allowDeselect={false}
              data={paletteOptions}
              leftSection={
                <ColorSwatch color={palettes[palette][6]} size={16} />
              }
              renderOption={({ option }) => (
                <Group gap="xs" wrap="nowrap">
                  <ColorSwatch
                    color={palettes[option.value as PaletteName][6]}
                    size={16}
                  />
                  {option.label}
                </Group>
              )}
            />
            <SegmentedControl
              aria-label="Color scheme"
              value={colorScheme}
              onChange={(value) => setColorScheme(value as "light" | "dark")}
              data={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
              ]}
            />
          </Group>
        </Group>
        <div
          className={styles.queryProgress}
          data-active={isRefreshingResults}
          aria-hidden={!isRefreshingResults}
          role={isRefreshingResults ? "progressbar" : undefined}
          aria-label={
            isRefreshingResults ? "Updating directory results" : undefined
          }
        />
      </header>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <SearchBar />
        </div>
        <SortControls />
      </div>
      <div className={styles.divider} aria-hidden="true" />
      <div className={styles.sidebar}>
        <FilterSidebar
          facets={usersQuery.data?.pages[0]?.facets}
          total={usersQuery.data?.pages[0]?.pagination.total}
        />
      </div>
      <section className={styles.content} aria-label="Directory results">
        <DirectoryStates query={usersQuery} listKey={listKey} />
      </section>
    </main>
  );
}

export default DirectoryPage;
