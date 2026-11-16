import { useRef, useState } from 'react'
import { Box, Pagination, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import type { PokemonEntry } from '../data/pokedex'
import { config } from '../config'
import { PokemonCard } from './PokemonCard'
import { PokemonFilters } from './PokemonFilters'

export function PokemonListing({ entries }: { entries: PokemonEntry[] }) {
  const [page, setPage] = useState(1)
  const [selectedType, setSelectedType] = useState('')
  const [nameQuery, setNameQuery] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const normalizedName = nameQuery.trim().toLowerCase()
  const types = [
    ...new Set(
      entries.flatMap(({ details }) =>
        details.types.map(({ type }) => type.name),
      ),
    ),
  ].sort()
  const filtered = entries.filter(
    ({ name, details }) =>
      (!normalizedName || name.toLowerCase().includes(normalizedName)) &&
      (!selectedType ||
        details.types.some(({ type }) => type.name === selectedType)),
  )
  const hasFilters = Boolean(selectedType || normalizedName)
  const totalPages = Math.ceil(filtered.length / config.listSize)
  const currentPage = Math.min(page, Math.max(1, totalPages))
  const start = (currentPage - 1) * config.listSize
  const end = Math.min(start + config.listSize, filtered.length)

  function changePage(nextPage: number) {
    if (nextPage === currentPage) return
    setPage(nextPage)
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  if (!entries.length) return <Text role="status">No Pokémon found.</Text>
  return (
    <Stack gap="lg">
      <div>
        <Title order={2} ref={headingRef} tabIndex={-1}>
          Pokémon
        </Title>
      </div>
      <PokemonFilters
        types={types}
        selectedType={selectedType}
        nameQuery={nameQuery}
        onTypeChange={(value) => {
          setSelectedType(value)
          setPage(1)
        }}
        onNameChange={(value) => {
          setNameQuery(value)
          setPage(1)
        }}
        onClear={() => {
          setSelectedType('')
          setNameQuery('')
          setPage(1)
        }}
      />
      <Text role="status" c="dimmed">
        {filtered.length
          ? `Showing ${start + 1}–${end} of ${filtered.length} Pokémon.${hasFilters ? ` (${filtered.length} of ${entries.length} match your filters.)` : ''}`
          : 'No Pokémon match your filters.'}
      </Text>
      {filtered.length ? (
        <SimpleGrid
          component="ul"
          aria-label="Pokémon"
          cols={{ base: 1, sm: 2, lg: 3 }}
          style={{ listStyle: 'none', alignItems: 'start' }}
          spacing="md"
          m={0}
          p={0}
        >
          {filtered.slice(start, end).map((pokemon) => (
            <PokemonCard key={pokemon.url} {...pokemon} />
          ))}
        </SimpleGrid>
      ) : (
        <Text>Try another type or search term, or clear the filters.</Text>
      )}
      {totalPages > 1 && (
        <Box component="nav" aria-label="Pokémon pages">
          <Pagination
            style={{ display: 'flex', justifyContent: 'center' }}
            total={totalPages}
            value={currentPage}
            onChange={changePage}
            withEdges
            layout="responsive"
            size="sm"
            getItemProps={(number) => ({ 'aria-label': `Page ${number}` })}
            getControlProps={(control) => ({
              'aria-label': {
                first: 'First page',
                previous: 'Previous page',
                next: 'Next page',
                last: 'Last page',
              }[control],
            })}
          />
        </Box>
      )}
    </Stack>
  )
}
