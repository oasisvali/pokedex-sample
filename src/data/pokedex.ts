import {
  getPokemonDetails,
  getPokemonList,
  type PokemonDetails,
  type PokemonListItem,
} from '../api/pokemon'
import { config } from '../config'
import { readPokedexCache, savePokedexCache } from './pokedexCache'

export type PokemonEntry = PokemonListItem & { details: PokemonDetails }
export type PokedexState =
  | { status: 'discovering' }
  | { status: 'catalogue-error' }
  | {
      status: 'loading' | 'details-error'
      total: number
      loaded: number
      failed: number
    }
  | { status: 'ready'; entries: PokemonEntry[]; cacheUnavailable: boolean }

export function createPokedexLoader() {
  let state: PokedexState = { status: 'discovering' }
  let catalogue: PokemonListItem[] | undefined
  const details = new Map<string, PokemonDetails>()
  const listeners = new Set<() => void>()
  let controller: AbortController | undefined
  let cacheChecked = false
  let cacheUnavailable = false

  function publish(next: PokedexState) {
    state = next
    listeners.forEach((listener) => listener())
  }

  async function load() {
    controller = new AbortController()
    const { signal } = controller
    try {
      if (!cacheChecked) {
        const cached = await readPokedexCache()
        signal.throwIfAborted()
        cacheChecked = true
        if (cached.status === 'hit') {
          publish({
            status: 'ready',
            entries: cached.entries,
            cacheUnavailable: false,
          })
          return
        }
        cacheUnavailable = cached.status === 'unavailable'
      }
      if (!catalogue) {
        publish({ status: 'discovering' })
        const list = await getPokemonList(signal)
        signal.throwIfAborted()
        catalogue = list
      }
      const list = catalogue
      const pending = list.filter((item) => !details.has(item.name))
      let index = 0
      let failed = 0
      const progress = () =>
        publish({
          status: 'loading',
          total: list.length,
          loaded: details.size,
          failed,
        })
      progress()
      async function worker() {
        while (!signal.aborted) {
          const item = pending[index++]
          if (!item) return
          try {
            const result = await getPokemonDetails(item.name, signal)
            if (signal.aborted) return
            details.set(item.name, result)
          } catch {
            if (signal.aborted) return
            failed += 1
          }
          progress()
        }
      }
      await Promise.all(
        Array.from(
          { length: Math.min(config.detailConcurrency, pending.length) },
          worker,
        ),
      )
      if (signal.aborted) return
      if (failed) {
        publish({
          status: 'details-error',
          total: list.length,
          loaded: details.size,
          failed,
        })
      } else {
        const entries = list.map((item) => {
          const result = details.get(item.name)
          if (!result) throw new Error('Missing Pokémon details.')
          return { ...item, details: result }
        })
        const saved = await savePokedexCache(entries, signal)
        if (signal.aborted) return
        publish({
          status: 'ready',
          entries,
          cacheUnavailable: cacheUnavailable || !saved,
        })
      }
    } catch {
      if (!signal.aborted) publish({ status: 'catalogue-error' })
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      if (
        (!controller || controller.signal.aborted) &&
        state.status !== 'ready'
      )
        void load()
      return () => {
        listeners.delete(listener)
        // React StrictMode immediately resubscribes; keep its active pool intact.
        queueMicrotask(() => {
          if (!listeners.size) controller?.abort()
        })
      }
    },
    retry() {
      if (
        state.status === 'catalogue-error' ||
        state.status === 'details-error'
      )
        void load()
    },
  }
}

export const pokedexLoader = createPokedexLoader()
