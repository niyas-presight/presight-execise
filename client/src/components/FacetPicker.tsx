import { MultiSelect } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";

import { fetchReferenceOptions } from "../lib/api";
import { useFiltersStore } from "../state/filtersStore";

interface FacetPickerProps {
  kind: "hobbies" | "nationalities";
}

function FacetPicker({ kind }: FacetPickerProps) {
  const hobbies = useFiltersStore((state) => state.hobbies);
  const nationalities = useFiltersStore((state) => state.nationalities);
  const setHobbies = useFiltersStore((state) => state.setHobbies);
  const setNationalities = useFiltersStore((state) => state.setNationalities);
  const optionsQuery = useQuery({
    queryKey: ["reference-options", kind],
    queryFn: () => fetchReferenceOptions(kind),
    staleTime: Infinity,
  });
  const options =
    optionsQuery.data?.map(({ value, label }) => ({ value, label })) ?? [];
  const isHobbies = kind === "hobbies";

  return (
    <MultiSelect
      aria-label={`Filter by ${kind}`}
      label={isHobbies ? "Hobbies" : "Nationalities"}
      placeholder={
        optionsQuery.isPending ? "Loading options..." : `Choose ${kind}`
      }
      data={options}
      value={isHobbies ? hobbies : nationalities}
      onChange={isHobbies ? setHobbies : setNationalities}
      searchable
      clearable
      hidePickedOptions={false}
      nothingFoundMessage="No matching options"
      disabled={optionsQuery.isPending || optionsQuery.isError}
      error={optionsQuery.isError ? optionsQuery.error.message : undefined}
    />
  );
}

export default FacetPicker;
