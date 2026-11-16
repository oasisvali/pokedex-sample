import { z } from 'zod'
import { config } from '../config'
import { pokemonDetailsSchema, pokemonListItemSchema } from '../api/pokemon'
import type { PokemonEntry } from './pokedex'
import { compressJson, decompressJson } from './cacheCodec'

const entriesSchema = z.array(
  pokemonListItemSchema.extend({ details: pokemonDetailsSchema }),
)
const envelopeSchema = z.object({
  version: z.literal(config.cacheVersion),
  payload: z.string().min(1),
})
const cacheSchema = z
  .object({
    source: z.literal(config.apiBaseUrl),
    count: z.number().int().nonnegative(),
    entries: entriesSchema,
  })
  .refine(
    ({ count, entries }) =>
      count === entries.length &&
      new Set(entries.map(({ name }) => name)).size === count &&
      new Set(entries.map(({ url }) => url)).size === count,
  )

type CacheRead =
  | { status: 'hit'; entries: PokemonEntry[] }
  | { status: 'miss' | 'unavailable' }

export async function readPokedexCache(): Promise<CacheRead> {
  let raw: string | null
  try {
    raw = localStorage.getItem(config.cacheKey)
  } catch {
    return { status: 'unavailable' }
  }
  if (!raw) return { status: 'miss' }
  if (typeof DecompressionStream === 'undefined')
    return { status: 'unavailable' }
  try {
    const envelope = envelopeSchema.parse(JSON.parse(raw))
    const cache = cacheSchema.parse(await decompressJson(envelope.payload))
    return { status: 'hit', entries: cache.entries }
  } catch {
    return { status: 'miss' }
  }
}

export async function savePokedexCache(
  entries: PokemonEntry[],
  signal: AbortSignal,
) {
  try {
    signal.throwIfAborted()
    if (
      typeof CompressionStream === 'undefined' ||
      typeof DecompressionStream === 'undefined'
    )
      return false
    // Validation also strips fields the UI does not consume before serialization.
    const data = entriesSchema.parse(entries)
    const payload = await compressJson({
      source: config.apiBaseUrl,
      count: data.length,
      entries: data,
    })
    signal.throwIfAborted()
    localStorage.setItem(
      config.cacheKey,
      JSON.stringify({ version: config.cacheVersion, payload }),
    )
    return true
  } catch {
    return false
  }
}
