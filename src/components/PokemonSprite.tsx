import { useState } from 'react'
import { Center, Image, Text } from '@mantine/core'
import { config } from '../config'

export function PokemonSprite({
  src,
  name,
}: {
  src: string | null
  name: string
}) {
  const [failed, setFailed] = useState(false)
  return (
    <Center h={config.spriteSize}>
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          w={config.spriteSize}
          h={config.spriteSize}
          fit="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text size="sm" c="dimmed">
          Image unavailable
        </Text>
      )}
    </Center>
  )
}
