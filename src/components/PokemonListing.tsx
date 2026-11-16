import { SimpleGrid, Text } from '@mantine/core'
import type { PokemonEntry } from '../data/pokedex'
import { config } from '../config'
import { PokemonCard } from './PokemonCard'

export function PokemonListing({ entries }: { entries: PokemonEntry[] }) {
  if (!entries.length) return <Text role="status">No Pokémon found.</Text>
  return (
    <SimpleGrid
      component="ul"
      aria-label="Pokémon"
      cols={{ base: 1, sm: 2, lg: 3 }}
      style={{ listStyle: 'none', alignItems: 'start' }}
      spacing="md"
      m={0}
      p={0}
    >
      {entries.slice(0, config.listSize).map((pokemon) => (
        <PokemonCard key={pokemon.url} {...pokemon} />
      ))}
    </SimpleGrid>
  )
}
