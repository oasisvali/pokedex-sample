import { z } from 'zod'
import { config } from '../config'

const pokemonListSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        url: z.url(),
      }),
    )
    .max(config.listSize),
})

export type PokemonListItem = z.infer<
  typeof pokemonListSchema
>['results'][number]
let cachedList: PokemonListItem[] | undefined

const namedField = z.object({ name: z.string().trim().min(1) })
const mediaUrl = z.httpUrl().nullable()
const pokemonDetailsSchema = z.object({
  base_experience: z.number().int().nonnegative().nullable(),
  height: z.number().int().nonnegative(),
  weight: z.number().int().nonnegative(),
  is_default: z.boolean(),
  order: z.number().int(),
  sprites: z.object({ front_default: mediaUrl }),
  cries: z.object({ latest: mediaUrl, legacy: mediaUrl }),
  types: z.array(z.object({ slot: z.number().int(), type: namedField })),
  abilities: z.array(
    z.object({
      slot: z.number().int(),
      is_hidden: z.boolean(),
      ability: namedField,
    }),
  ),
  stats: z.array(
    z.object({ stat: namedField, base_stat: z.number().int().nonnegative() }),
  ),
  moves: z.array(z.object({ move: namedField })),
})

export type PokemonDetails = z.infer<typeof pokemonDetailsSchema>
const cachedDetails = new Map<string, PokemonDetails>()

export async function getPokemonDetails(name: string, signal: AbortSignal) {
  const cached = cachedDetails.get(name)
  if (cached) return cached
  const url = new URL(`pokemon/${encodeURIComponent(name)}`, config.apiBaseUrl)
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Unable to load Pokémon details.')
  const data: unknown = await response.json()
  const details = pokemonDetailsSchema.parse(data)
  signal.throwIfAborted()
  cachedDetails.set(name, details)
  return details
}

export async function getPokemonList(signal: AbortSignal) {
  if (cachedList) return cachedList
  const url = new URL('pokemon', config.apiBaseUrl)
  url.search = new URLSearchParams({
    limit: String(config.listSize),
    offset: '0',
  }).toString()
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Unable to load Pokémon.')
  const data: unknown = await response.json()
  const { results } = pokemonListSchema.parse(data)
  signal.throwIfAborted()
  cachedList = results
  return results
}
