import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Button,
  Group,
  OverflowList,
  Text,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { useFiltersStore } from "../state/filtersStore";
import type { FacetCount, UsersResponse } from "../types/api";
import FacetPicker from "./FacetPicker";
import styles from "./FilterSidebar.module.scss";

export function withSelectedFacets(
  facets: FacetCount[],
  selected: string[],
): FacetCount[] {
  const values = new Set(facets.map((facet) => facet.value));
  return [
    ...facets,
    ...selected
      .filter((value) => !values.has(value))
      .sort()
      .map((value) => ({ value, count: 0 })),
  ];
}

export function shouldShowFacetSections(total?: number): boolean {
  return total !== 0;
}

interface FilterSidebarProps {
  facets?: UsersResponse["facets"];
  total?: number;
}

function FilterSidebar({ facets, total }: FilterSidebarProps) {
  const hobbies = useFiltersStore((state) => state.hobbies);
  const nationalities = useFiltersStore((state) => state.nationalities);
  const setHobbies = useFiltersStore((state) => state.setHobbies);
  const setNationalities = useFiltersStore((state) => state.setNationalities);
  const hobbyFacets = withSelectedFacets(facets?.hobbies ?? [], hobbies);
  const nationalityFacets = withSelectedFacets(
    facets?.nationalities ?? [],
    nationalities,
  );
  const toggleFacet = (kind: "hobby" | "nationality", value: string) => {
    if (kind === "hobby") {
      setHobbies(
        hobbies.includes(value)
          ? hobbies.filter((item) => item !== value)
          : [...hobbies, value],
      );
    } else {
      setNationalities(
        nationalities.includes(value)
          ? nationalities.filter((item) => item !== value)
          : [...nationalities, value],
      );
    }
  };

  return (
    <aside
      className={styles.sidebar}
      aria-label="Filters and current result facets"
    >
      <div className={styles.pickers}>
        <FacetPicker kind="hobbies" />
        <FacetPicker kind="nationalities" />
      </div>

      {shouldShowFacetSections(total) && (
        <div className={styles.facetColumns}>
          <FacetList
            title="Top hobbies"
            facets={hobbyFacets}
            selected={hobbies}
            onToggle={(value) => toggleFacet("hobby", value)}
          />
          <FacetList
            title="Top nationalities"
            facets={nationalityFacets}
            selected={nationalities}
            onToggle={(value) => toggleFacet("nationality", value)}
          />
        </div>
      )}
    </aside>
  );
}

interface FacetListProps {
  title: string;
  facets: FacetCount[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FacetList({ title, facets, selected, onToggle }: FacetListProps) {
  const [expanded, setExpanded] = useState(false);
  const theme = useMantineTheme();
  const collapsible = useMediaQuery(`(width < ${theme.breakpoints.md})`);
  const renderChip = ({ value, count }: FacetCount) => {
    const isSelected = selected.includes(value);
    return (
      <UnstyledButton
        key={value}
        className={`${styles.facetRow} ${isSelected ? styles.facetSelected : ""}`}
        aria-pressed={isSelected}
        onClick={() => onToggle(value)}
      >
        <span className={styles.facetValue}>{value}</span>
        <span className={styles.facetCount}>{count}</span>
      </UnstyledButton>
    );
  };

  let body;
  if (facets.length === 0) {
    body = (
      <Text className={styles.emptyFacets} size="sm" c="dimmed">
        No matching values
      </Text>
    );
  } else if (collapsible && !expanded) {
    body = (
      <OverflowList
        data={facets}
        gap={6}
        maxRows={2}
        getItemKey={(facet) => facet.value}
        renderItem={renderChip}
        renderOverflow={(hidden) => (
          <UnstyledButton
            className={styles.moreChip}
            onClick={() => setExpanded(true)}
          >
            +{hidden.length} more
          </UnstyledButton>
        )}
      />
    );
  } else {
    body = (
      <ul className={styles.facetList}>
        <AnimatePresence initial={false}>
          {facets.map((facet) => (
            <motion.li
              key={facet.value}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {renderChip(facet)}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    );
  }

  return (
    <section className={styles.facetSection} aria-label={title}>
      <Group className={styles.facetHeader} gap="xs" justify="space-between" wrap="nowrap">
        <Text size="sm" fw={600}>
          {title}
        </Text>
      </Group>
      {body}
      {collapsible && expanded && (
        <Button
          className={styles.showAll}
          variant="subtle"
          size="compact-sm"
          onClick={() => setExpanded(false)}
        >
          Show less
        </Button>
      )}
    </section>
  );
}

export default FilterSidebar;
