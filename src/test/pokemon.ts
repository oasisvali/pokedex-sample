import { vi } from 'vitest'
import type { PokemonDetails } from '../api/pokemon'

export function detailsFixture(
  overrides: Partial<PokemonDetails> = {},
): PokemonDetails {
  return {
    base_experience: 62,
    height: 6,
    weight: 85,
    is_default: true,
    order: 5,
    sprites: { front_default: 'https://example.com/sprite.png' },
    cries: { latest: 'https://example.com/cry.ogg', legacy: null },
    types: [
      { slot: 2, type: { name: 'poison' } },
      { slot: 1, type: { name: 'grass' } },
    ],
    abilities: [{ slot: 1, is_hidden: true, ability: { name: 'solar-power' } }],
    stats: [{ stat: { name: 'special-attack' }, base_stat: 65 }],
    moves: [{ move: { name: 'vine-whip' } }, { move: { name: 'tackle' } }],
    ...overrides,
  }
}

// Keep list-focused tests independent of the subsequent detail requests.
export function mockListFetch(listFetch: typeof fetch) {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((input, init) =>
      String(input).includes('?')
        ? listFetch(input, init)
        : Promise.resolve(Response.json(detailsFixture())),
    ),
  )
}

export function deferredResponse() {
  let resolve: (response: Response) => void = () => {}
  const promise = new Promise<Response>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}
