import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { getPokemonList, type PokemonListItem } from '../api/pokemon'

type ListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'success'; pokemon: PokemonListItem[] }

export function PokemonListing() {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getPokemonList(controller.signal).then(
      (pokemon) => {
        if (controller.signal.aborted) return
        setState(
          pokemon.length ? { status: 'success', pokemon } : { status: 'empty' },
        )
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [attempt])

  if (state.status === 'loading')
    return <Text role="status">Loading Pokémon…</Text>
  if (state.status === 'error') {
    return (
      <Alert color="red" title="Could not load Pokémon" role="alert">
        <Stack align="flex-start" gap="sm">
          <Text>Please try again.</Text>
          <Button
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((value) => value + 1)
            }}
          >
            Retry
          </Button>
        </Stack>
      </Alert>
    )
  }
  if (state.status === 'empty')
    return <Text role="status">No Pokémon found.</Text>

  return (
    <SimpleGrid
      component="ul"
      aria-label="Pokémon"
      cols={{ base: 1, xs: 2, md: 5 }}
      spacing="md"
      m={0}
      p={0}
      style={{ listStyle: 'none' }}
    >
      {state.pokemon.map((pokemon) => (
        <Card component="li" key={pokemon.url} withBorder padding="lg">
          <Title order={2} size="h4" style={{ overflowWrap: 'anywhere' }}>
            {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
          </Title>
        </Card>
      ))}
    </SimpleGrid>
  )
}
