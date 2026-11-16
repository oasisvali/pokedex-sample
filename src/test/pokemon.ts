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

export function deferredResponse() {
  let resolve: (response: Response) => void = () => {}
  const promise = new Promise<Response>((finish) => {
    resolve = finish
  })
  return { promise, resolve }
}

export function catalogueResponse(names: string[], discovery = false) {
  return Response.json({
    count: names.length,
    next: null,
    previous: null,
    results: (discovery ? names.slice(0, 1) : names).map((name, index) => ({
      name,
      url: `https://pokeapi.co/api/v2/pokemon/${index + 10001}/`,
    })),
  })
}

export function mockCatalogue(
  names = ['bulbasaur', 'ivysaur'],
  detail: (name: string, init?: RequestInit) => Promise<Response> = () =>
    Promise.resolve(Response.json(detailsFixture())),
) {
  const fetchMock = vi.fn<typeof fetch>((input, init) => {
    const url = new URL(String(input))
    if (url.search)
      return Promise.resolve(
        catalogueResponse(names, url.searchParams.get('limit') === '1'),
      )
    const name = url.pathname.split('/').at(-1) ?? ''
    return detail(name, init)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}
