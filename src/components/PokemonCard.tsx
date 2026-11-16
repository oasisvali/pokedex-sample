import { useEffect, useState } from 'react'
import { Button, Card, Stack, Text, Title } from '@mantine/core'
import {
  getPokemonDetails,
  type PokemonDetails as Details,
} from '../api/pokemon'
import { PokemonDetails } from './PokemonDetails'

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; details: Details }

export function PokemonCard({ name }: { name: string }) {
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  useEffect(() => {
    const controller = new AbortController()
    getPokemonDetails(name, controller.signal).then(
      (details) => {
        if (!controller.signal.aborted) setState({ status: 'success', details })
      },
      () => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      },
    )
    return () => controller.abort()
  }, [name, attempt])

  return (
    <Card component="li" withBorder padding="lg">
      <Stack gap="md">
        <Title order={2} size="h3" style={{ overflowWrap: 'anywhere' }}>
          {displayName}
        </Title>
        {state.status === 'loading' && (
          <Text role="status">Loading {displayName} details…</Text>
        )}
        {state.status === 'error' && (
          <Stack gap="xs" align="flex-start">
            <Text role="alert" size="sm">
              Could not load {displayName} details.
            </Text>
            <Button
              variant="light"
              aria-label={`Retry ${displayName} details`}
              onClick={() => {
                setState({ status: 'loading' })
                setAttempt((value) => value + 1)
              }}
            >
              Retry details
            </Button>
          </Stack>
        )}
        {state.status === 'success' && (
          <PokemonDetails details={state.details} name={displayName} />
        )}
      </Stack>
    </Card>
  )
}
