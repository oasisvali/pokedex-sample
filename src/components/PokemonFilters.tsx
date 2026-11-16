import {
  Button,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core'

type PokemonFiltersProps = {
  types: string[]
  selectedType: string
  nameQuery: string
  onTypeChange: (value: string) => void
  onNameChange: (value: string) => void
  onClear: () => void
}

export function PokemonFilters({
  types,
  selectedType,
  nameQuery,
  onTypeChange,
  onNameChange,
  onClear,
}: PokemonFiltersProps) {
  return (
    <Paper component="section" aria-label="Filter Pokémon" withBorder p="md">
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <NativeSelect
            label="Type"
            value={selectedType}
            data={[
              { value: '', label: 'All types' },
              ...types.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              })),
            ]}
            onChange={(event) => onTypeChange(event.currentTarget.value)}
          />
          <TextInput
            label="Pokémon name"
            value={nameQuery}
            placeholder="e.g. pikachu or mr-mime"
            description="Search all or part of a name. Letter case doesn’t matter."
            onChange={(event) => onNameChange(event.currentTarget.value)}
          />
        </SimpleGrid>
        <Button
          variant="light"
          w="fit-content"
          disabled={!selectedType && !nameQuery}
          onClick={onClear}
        >
          Clear filters
        </Button>
      </Stack>
    </Paper>
  )
}
