import { Accordion, Box, Group, Stack, Text } from '@mantine/core'
import type { PokemonDetails as Details } from '../api/pokemon'

function readable(value: string) {
  return value.replaceAll('-', ' ')
}

export function PokemonExtraDetails({
  details,
  name,
}: {
  details: Details
  name: string
}) {
  return (
    <Accordion multiple variant="separated">
      <Accordion.Item value="abilities">
        <Accordion.Control>
          Abilities ({details.abilities.length})
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="xs">
            {[...details.abilities]
              .sort((a, b) => a.slot - b.slot)
              .map(({ ability, is_hidden }) => (
                <Text key={ability.name} size="sm" tt="capitalize">
                  {readable(ability.name)}
                  {is_hidden ? ' (hidden)' : ''}
                </Text>
              ))}
            {!details.abilities.length && (
              <Text size="sm">No abilities available.</Text>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="stats">
        <Accordion.Control>
          Base stats ({details.stats.length})
        </Accordion.Control>
        <Accordion.Panel>
          <Stack component="dl" gap="xs" m={0}>
            {details.stats.map(({ stat, base_stat }) => (
              <Group key={stat.name} justify="space-between">
                <Text component="dt" size="sm" tt="capitalize">
                  {readable(stat.name)}
                </Text>
                <Text component="dd" m={0} fw={500}>
                  {base_stat}
                </Text>
              </Group>
            ))}
            {!details.stats.length && (
              <Text size="sm">No stats available.</Text>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="moves">
        <Accordion.Control>Moves ({details.moves.length})</Accordion.Control>
        <Accordion.Panel>
          <Box
            mah={200}
            style={{ overflowY: 'auto', overflowWrap: 'anywhere' }}
            tabIndex={0}
            role="region"
            aria-label={`${name} moves`}
          >
            {details.moves.length ? (
              <Stack component="ul" gap="xs" m={0} pl="md">
                {details.moves.map(({ move }) => (
                  <Text
                    component="li"
                    size="sm"
                    tt="capitalize"
                    key={move.name}
                  >
                    {readable(move.name)}
                  </Text>
                ))}
              </Stack>
            ) : (
              <Text size="sm">No moves available.</Text>
            )}
          </Box>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}
