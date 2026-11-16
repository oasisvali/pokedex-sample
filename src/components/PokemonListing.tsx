import { useRef, useState } from 'react'
import { Box, Pagination, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import type { PokemonEntry } from '../data/pokedex'
import { config } from '../config'
import { PokemonCard } from './PokemonCard'

export function PokemonListing({ entries }: { entries: PokemonEntry[] }) {
  const [page, setPage] = useState(1)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const totalPages = Math.ceil(entries.length / config.listSize)
  const currentPage = Math.min(page, Math.max(1, totalPages))
  const start = (currentPage - 1) * config.listSize
  const end = Math.min(start + config.listSize, entries.length)

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
        <Text role="status" c="dimmed">
          Showing {start + 1}–{end} of {entries.length} Pokémon.
        </Text>
      </div>
      <SimpleGrid
        component="ul"
        aria-label="Pokémon"
        cols={{ base: 1, sm: 2, lg: 3 }}
        style={{ listStyle: 'none', alignItems: 'start' }}
        spacing="md"
        m={0}
        p={0}
      >
        {entries.slice(start, end).map((pokemon) => (
          <PokemonCard key={pokemon.url} {...pokemon} />
        ))}
      </SimpleGrid>
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
