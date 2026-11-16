import { beforeEach, expect, it, vi } from 'vitest'
import { catalogueResponse } from '../test/pokemon'

let getPokemonList: typeof import('./pokemon').getPokemonList
beforeEach(async () => {
  vi.resetModules()
  getPokemonList = (await import('./pokemon')).getPokemonList
})

it.each([
  ['missing entries', { count: 2, next: null, previous: null, results: [] }],
  [
    'changed count',
    {
      count: 3,
      next: null,
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      ],
    },
  ],
  [
    'duplicate entries',
    {
      count: 2,
      next: null,
      previous: null,
      results: Array.from({ length: 2 }, () => ({
        name: 'bulbasaur',
        url: 'https://pokeapi.co/api/v2/pokemon/1/',
      })),
    },
  ],
])('rejects a catalogue with %s', async (_label, page) => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(catalogueResponse(['bulbasaur', 'ivysaur'], true))
      .mockResolvedValueOnce(Response.json(page)),
  )
  await expect(getPokemonList(new AbortController().signal)).rejects.toThrow()
})

it.each([
  'https://pokeapi.co/api/v2/pokemon?limit=2&offset=0',
  'https://example.com/pokemon?offset=1',
])(
  'rejects repeated or external pagination without another request: %s',
  async (next) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(catalogueResponse(['bulbasaur', 'ivysaur'], true))
      .mockResolvedValueOnce(
        Response.json({
          count: 2,
          previous: null,
          next,
          results: [
            { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          ],
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    await expect(getPokemonList(new AbortController().signal)).rejects.toThrow(
      'Invalid catalogue pagination',
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  },
)
