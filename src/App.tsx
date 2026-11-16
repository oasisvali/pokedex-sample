import { useSyncExternalStore } from 'react'
import { Container, MantineProvider, Stack, Text, Title } from '@mantine/core'
import { PokemonListing } from './components/PokemonListing'
import { PokedexStartup } from './components/PokedexStartup'
import { pokedexLoader } from './data/pokedex'
import { theme } from './theme'

export default function App() {
  const state = useSyncExternalStore(
    pokedexLoader.subscribe,
    pokedexLoader.getSnapshot,
  )
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      <Container component="main" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Pokédex</Title>
            <Text c="dimmed">
              {state.status === 'ready'
                ? `${state.entries.length} Pokémon ready to explore.`
                : 'Your complete Pokémon collection.'}
            </Text>
          </div>
          {state.status === 'ready' ? (
            <PokemonListing entries={state.entries} />
          ) : (
            <PokedexStartup state={state} onRetry={pokedexLoader.retry} />
          )}
        </Stack>
      </Container>
    </MantineProvider>
  )
}
