import {
  Alert,
  Button,
  Paper,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import type { PokedexState } from '../data/pokedex'

export function PokedexStartup({
  state,
  onRetry,
}: {
  state: Exclude<PokedexState, { status: 'ready' }>
  onRetry: () => void
}) {
  const progress =
    state.status === 'loading' || state.status === 'details-error'
      ? state
      : null
  const percent =
    progress && progress.total
      ? Math.floor((progress.loaded / progress.total) * 100)
      : 0
  return (
    <Paper withBorder p="xl" radius="md">
      <Stack gap="md">
        <Title order={2}>Preparing your Pokédex</Title>
        <Text c="dimmed">
          We’re fetching every Pokémon and its details so the complete
          collection is ready to explore. This may take a few minutes.
        </Text>
        <Progress
          value={percent}
          aria-label="Pokédex loading progress"
          aria-valuetext={
            progress
              ? `${progress.loaded} of ${progress.total} Pokémon loaded`
              : 'Discovering the Pokémon catalogue'
          }
        />
        <Text role="status">
          {progress
            ? `Loaded ${progress.loaded} of ${progress.total} Pokémon (${percent}%).`
            : 'Discovering the Pokémon catalogue (0%).'}
        </Text>
        {progress && progress.failed > 0 && (
          <Text>{progress.failed} detail requests failed.</Text>
        )}
        {state.status === 'catalogue-error' && (
          <Alert
            color="red"
            role="alert"
            title="Could not load the Pokémon catalogue"
          >
            <Stack align="flex-start" gap="sm">
              <Text>Check your connection and try again.</Text>
              <Button onClick={onRetry}>Retry catalogue</Button>
            </Stack>
          </Alert>
        )}
        {state.status === 'details-error' && (
          <Alert
            color="red"
            role="alert"
            title="Some Pokémon details could not be loaded"
          >
            <Stack align="flex-start" gap="sm">
              <Text>
                Your successful downloads are kept. Retry the remaining requests
                to open the full Pokédex.
              </Text>
              <Button onClick={onRetry}>Retry failed requests</Button>
            </Stack>
          </Alert>
        )}
      </Stack>
    </Paper>
  )
}
