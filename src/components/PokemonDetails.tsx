import { Badge, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import type { PokemonDetails as Details } from '../api/pokemon'
import { PokemonSprite } from './PokemonSprite'
import { PokemonExtraDetails } from './PokemonExtraDetails'
import { PokemonCry } from './PokemonCry'

function readable(value: string) {
  return value.replaceAll('-', ' ')
}

export function PokemonDetails({
  details,
  name,
}: {
  details: Details
  name: string
}) {
  const cry = details.cries.latest ?? details.cries.legacy
  const facts = [
    ['Base experience', details.base_experience ?? 'Unknown'],
    ['Height', `${details.height / 10} m`],
    ['Weight', `${details.weight / 10} kg`],
  ]

  return (
    <Stack gap="md">
      <PokemonSprite
        key={details.sprites.front_default}
        src={details.sprites.front_default}
        name={name}
      />
      <Group gap="xs" aria-label={`${name} types`}>
        {[...details.types]
          .sort((a, b) => a.slot - b.slot)
          .map(({ type }) => (
            <Badge key={type.name} variant="light">
              {readable(type.name)}
            </Badge>
          ))}
        {!details.types.length && <Text size="sm">No types available.</Text>}
      </Group>
      <SimpleGrid component="dl" cols={2} spacing="sm" m={0}>
        {facts.map(([label, value]) => (
          <div key={label}>
            <Text component="dt" size="xs" c="dimmed">
              {label}
            </Text>
            <Text component="dd" m={0} fw={500}>
              {value}
            </Text>
          </div>
        ))}
      </SimpleGrid>
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Cry
        </Text>
        <PokemonCry key={cry} src={cry} name={name} />
      </Stack>
      <PokemonExtraDetails details={details} name={name} />
    </Stack>
  )
}
