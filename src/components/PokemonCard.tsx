import { Card, Stack, Title } from '@mantine/core'
import type { PokemonEntry } from '../data/pokedex'
import { PokemonDetails } from './PokemonDetails'

export function PokemonCard({ name, details }: PokemonEntry) {
  const displayName = name.charAt(0).toUpperCase() + name.slice(1)
  return (
    <Card component="li" withBorder padding="lg">
      <Stack gap="md">
        <Title order={3} size="h3" style={{ overflowWrap: 'anywhere' }}>
          {displayName}
        </Title>
        <PokemonDetails details={details} name={displayName} />
      </Stack>
    </Card>
  )
}
