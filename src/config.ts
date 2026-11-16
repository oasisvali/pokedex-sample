import { z } from 'zod'

const detailConcurrency = z.coerce.number().int().min(1).max(100).catch(20)

export const config = {
  apiBaseUrl: 'https://pokeapi.co/api/v2/',
  listSize: 10,
  spriteSize: 96,
  detailConcurrency: detailConcurrency.parse(
    import.meta.env.VITE_POKEMON_CONCURRENCY,
  ),
  requestTimeoutMs: 20_000,
  cacheKey: 'mavi-pokedex:catalogue',
  cacheVersion: 1,
}
