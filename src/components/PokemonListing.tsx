import { useEffect, useState } from 'react'
import { Alert, Button, SimpleGrid, Stack, Text } from '@mantine/core'
import { getPokemonList, type PokemonListItem } from '../api/pokemon'
import { PokemonCard } from './PokemonCard'

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
      cols={{ base: 1, sm: 2, lg: 3 }}
      style={{ listStyle: 'none', alignItems: 'start' }}
      spacing="md"
      m={0}
      p={0}
    >
      {state.pokemon.map((pokemon) => (
        <PokemonCard key={pokemon.url} name={pokemon.name} />
      ))}
    </SimpleGrid>
  )
}
