import { useEffect, useRef, useState } from 'react'
import { Button, Text } from '@mantine/core'

export function PokemonCry({
  src,
  name,
}: {
  src: string | null
  name: string
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [src, failed])

  async function play() {
    const audio = audioRef.current
    if (!audio) return
    try {
      audio.currentTime = 0
      await audio.play()
    } catch {
      setFailed(true)
    }
  }

  if (!src || failed)
    return (
      <Text size="sm" c="dimmed">
        Audio unavailable
      </Text>
    )

  return (
    <>
      <audio
        ref={audioRef}
        hidden
        preload="none"
        src={src}
        aria-label={`${name} cry`}
        onError={() => setFailed(true)}
      />
      <Button
        variant="light"
        size="xs"
        w="fit-content"
        aria-label={`Play ${name} cry`}
        onClick={play}
      >
        ▶ Play
      </Button>
    </>
  )
}
