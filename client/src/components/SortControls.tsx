import { Group, SegmentedControl, Select } from "@mantine/core";

import { useFiltersStore } from "../state/filtersStore";
import type { SortDirection, SortField } from "../types/api";
import styles from "./SortControls.module.scss";

const sortOptions = [
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "age", label: "Age" },
  { value: "nationality", label: "Nationality" },
];

function SortControls() {
  const sort = useFiltersStore((state) => state.sort);
  const direction = useFiltersStore((state) => state.direction);
  const setSort = useFiltersStore((state) => state.setSort);

  return (
    <Group className={styles.controls} justify="flex-end" align="end">
      <Select
        aria-label="Sort results by"
        label="Sort by"
        data={sortOptions}
        value={sort}
        onChange={(value) => {
          if (value) setSort(value as SortField, direction);
        }}
      />
      <SegmentedControl
        aria-label="Sort direction"
        value={direction}
        data={[
          { label: "Ascending", value: "asc" },
          { label: "Descending", value: "desc" },
        ]}
        onChange={(value) => setSort(sort, value as SortDirection)}
      />
    </Group>
  );
}

export default SortControls;
