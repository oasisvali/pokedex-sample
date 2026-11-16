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
