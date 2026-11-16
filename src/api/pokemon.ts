import { z } from 'zod'
import { config } from '../config'
import { requestJson } from './request'

const pokemonListSchema = z.object({
  count: z.number().int().nonnegative(),
  next: z.httpUrl().nullable(),
  previous: z.httpUrl().nullable(),
  results: z.array(
    z.object({
      name: z.string().trim().min(1),
      url: z.httpUrl(),
    }),
  ),
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
  const data = await requestJson(url, signal)
  const details = pokemonDetailsSchema.parse(data)
  signal.throwIfAborted()
  cachedDetails.set(name, details)
  return details
}

export async function getPokemonList(signal: AbortSignal) {
  if (cachedList) return cachedList
  const url = new URL('pokemon', config.apiBaseUrl)
  url.search = new URLSearchParams({ limit: '1', offset: '0' }).toString()
  const discovery = pokemonListSchema.parse(await requestJson(url, signal))
  const results: PokemonListItem[] = []
  const visited = new Set<string>()
  if (discovery.count > 0) {
    const catalogueUrl = new URL(url)
    catalogueUrl.searchParams.set('limit', String(discovery.count))
    let next: URL | null = catalogueUrl
    while (next) {
      if (
        visited.has(next.href) ||
        next.origin !== url.origin ||
        next.pathname.replace(/\/$/, '') !== url.pathname
      ) {
        throw new Error('Invalid catalogue pagination.')
      }
      visited.add(next.href)
      const page = pokemonListSchema.parse(await requestJson(next, signal))
      if (!page.results.length)
        throw new Error('The catalogue is incomplete. Please retry.')
      if (page.count !== discovery.count)
        throw new Error('The catalogue changed. Please retry.')
      results.push(...page.results)
      if (results.length > discovery.count)
        throw new Error('Invalid catalogue size.')
      next = page.next ? new URL(page.next) : null
    }
  }
  if (
    results.length !== discovery.count ||
    new Set(results.map((item) => item.name)).size !== results.length ||
    new Set(results.map((item) => item.url)).size !== results.length
  ) {
    throw new Error('The catalogue is incomplete. Please retry.')
  }
  signal.throwIfAborted()
  cachedList = results
  return results
}
