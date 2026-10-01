import { ActionIcon, TextInput } from "@mantine/core";

import { useFiltersStore } from "../state/filtersStore";

function SearchBar() {
  const query = useFiltersStore((state) => state.q);
  const setQuery = useFiltersStore((state) => state.setQuery);

  return (
    <TextInput
      aria-label="Search actors"
      label="Search"
      placeholder="Start typing a first or last name"
      value={query}
      onChange={(event) => setQuery(event.currentTarget.value)}
      rightSectionWidth={36}
      styles={{
        section: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "all",
        },
      }}
      rightSection={
        query ? (
          <ActionIcon
            aria-label="Clear search"
            title="Clear search"
            variant="subtle"
            color="gray"
            size="sm"
            radius="xl"
            onClick={() => setQuery("")}
          >
            ×
          </ActionIcon>
        ) : null
      }
    />
  );
}

export default SearchBar;
