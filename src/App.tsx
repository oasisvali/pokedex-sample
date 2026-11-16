import { Container, MantineProvider, Stack, Text, Title } from '@mantine/core'
import { PokemonListing } from './components/PokemonListing'
import { config } from './config'
import { theme } from './theme'

export default function App() {
  return (
    <MantineProvider theme={theme} forceColorScheme="light">
      <Container component="main" py="xl">
        <Stack gap="xl">
          <div>
            <Title order={1}>Pokédex</Title>
            <Text c="dimmed">Meet the first {config.listSize} Pokémon.</Text>
          </div>
          <PokemonListing />
        </Stack>
      </Container>
    </MantineProvider>
  )
}
