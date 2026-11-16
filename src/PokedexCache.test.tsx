import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { detailsFixture, mockCatalogue } from './test/pokemon'
import { config } from './config'

let App: ComponentType
beforeEach(async () => {
  vi.resetModules()
  App = (await import('./App')).default
})

function entriesFixture() {
  return [
    {
      name: 'bulbasaur',
      url: 'https://pokeapi.co/api/v2/pokemon/1/',
      details: detailsFixture(),
    },
  ]
}

async function cachePayload(value: unknown) {
  const { compressJson } = await import('./data/cacheCodec')
  return JSON.stringify({
    version: config.cacheVersion,
    payload: await compressJson(value),
  })
}

it('saves a complete compressed catalogue and restores it on a fresh app load with zero API calls', async () => {
  const names = Array.from({ length: 12 }, (_, index) => `pokemon-${index}`)
  const initialFetch = mockCatalogue(names)
  const first = render(<App />)
  await screen.findByRole('list', { name: 'Pokémon' })
  expect(initialFetch).toHaveBeenCalledTimes(14)
  expect(localStorage.getItem(config.cacheKey)).not.toBeNull()
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Last page' }))
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Type' }),
    'poison',
  )
  await user.type(screen.getByRole('textbox', { name: 'Pokémon name' }), '1')
  first.unmount()
  // Reset modules to simulate a new document, rather than reusing the memory store.
  vi.resetModules()
  const RestoredApp = (await import('./App')).default
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockRejectedValue(new Error('Network must not be used'))
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(Date, 'now').mockReturnValue(Date.UTC(2100, 0, 1))
  render(<RestoredApp />)
  const list = await screen.findByRole('list', { name: 'Pokémon' })
  expect(
    within(list)
      .getAllByRole('heading')
      .map((heading) => heading.textContent),
  ).toEqual(
    names
      .slice(0, 10)
      .map((name) => name.charAt(0).toUpperCase() + name.slice(1)),
  )
  expect(screen.getByRole('textbox', { name: 'Pokémon name' })).toHaveValue('')
  expect(screen.getByRole('combobox', { name: 'Type' })).toHaveValue('')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 12 Pokémon.',
  )
  await user.click(screen.getByRole('button', { name: 'Last page' }))
  expect(within(list).getAllByRole('heading')).toHaveLength(2)
  expect(fetchMock).not.toHaveBeenCalled()
})

it.each([
  'invalid JSON',
  'wrong version',
  'invalid gzip',
  'incomplete',
  'invalid fields',
  'duplicate entries',
  'wrong source',
])('fetches and replaces an unusable cache: %s', async (kind) => {
  const entries = entriesFixture()
  const valid = { source: config.apiBaseUrl, count: 1, entries }
  let raw: string
  if (kind === 'invalid JSON') raw = '{'
  else if (kind === 'wrong version')
    raw = JSON.stringify({
      version: config.cacheVersion + 1,
      payload: 'ignored',
    })
  else if (kind === 'invalid gzip')
    raw = JSON.stringify({
      version: config.cacheVersion,
      payload: btoa('not gzip'),
    })
  else
    raw = await cachePayload(
      kind === 'incomplete'
        ? { ...valid, count: 2 }
        : kind === 'invalid fields'
          ? {
              ...valid,
              entries: [{ ...entries[0], details: { height: 'invalid' } }],
            }
          : kind === 'duplicate entries'
            ? { ...valid, count: 2, entries: [...entries, ...entries] }
            : { ...valid, source: 'https://example.com/api/' },
    )
  localStorage.setItem(config.cacheKey, raw)
  const fetchMock = mockCatalogue()
  render(<App />)
  expect(await screen.findByRole('list')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(4)
  const { readPokedexCache } = await import('./data/pokedexCache')
  const result = await readPokedexCache()
  expect(result.status).toBe('hit')
  if (result.status === 'hit')
    expect(result.entries.map(({ name }) => name)).toEqual([
      'bulbasaur',
      'ivysaur',
    ])
})

it('does not persist partial downloads and writes the complete dataset only after retry succeeds', async () => {
  let failed = false
  mockCatalogue(undefined, async (name) => {
    if (name === 'ivysaur' && !failed) {
      failed = true
      throw new Error('Offline')
    }
    return Response.json(detailsFixture())
  })
  render(<App />)
  await screen.findByRole('alert')
  expect(localStorage.getItem(config.cacheKey)).toBeNull()
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Retry failed requests' }))
  await screen.findByRole('list')
  const { readPokedexCache } = await import('./data/pokedexCache')
  expect((await readPokedexCache()).status).toBe('hit')
})

it.each(['unavailable storage', 'quota exceeded', 'unsupported compression'])(
  'keeps browsing usable and explains persistence failure: %s',
  async (failure) => {
    if (failure === 'unsupported compression')
      vi.stubGlobal('CompressionStream', undefined)
    else if (failure === 'quota exceeded') {
      const original = Storage.prototype.setItem
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key,
        value,
      ) {
        if (key === config.cacheKey)
          throw new DOMException('Full', 'QuotaExceededError')
        original.call(this, key, value)
      })
    } else {
      const original = Storage.prototype.getItem
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (
        this: Storage,
        key,
      ) {
        if (key === config.cacheKey)
          throw new DOMException('Blocked', 'SecurityError')
        return original.call(this, key)
      })
    }
    mockCatalogue()
    render(<App />)
    expect(await screen.findByRole('list')).toBeInTheDocument()
    expect(
      screen.getByText('Could not save your Pokédex on this device'),
    ).toBeInTheDocument()
    await userEvent
      .setup()
      .type(screen.getByRole('textbox', { name: 'Pokémon name' }), 'ivy')
    expect(screen.getByRole('heading', { name: 'Ivysaur' })).toBeInTheDocument()
  },
)

it('round-trips a full-size dataset and omits data outside the consumed schema', async () => {
  const { savePokedexCache, readPokedexCache } =
    await import('./data/pokedexCache')
  const entries = Array.from({ length: 1351 }, (_, index) => ({
    name: `pokemon-${index}`,
    url: `https://pokeapi.co/api/v2/pokemon/${index + 1}/`,
    details: {
      ...detailsFixture(),
      unused: 'discard me',
      moves: Array.from({ length: 100 }, (_, move) => ({
        move: { name: `move-${move}` },
      })),
    },
  }))
  await expect(
    savePokedexCache(entries, new AbortController().signal),
  ).resolves.toBe(true)
  const raw = localStorage.getItem(config.cacheKey)
  expect(raw?.length).toBeLessThan(JSON.stringify(entries).length)
  const cache = await readPokedexCache()
  expect(cache.status).toBe('hit')
  if (cache.status === 'hit') {
    expect(cache.entries).toHaveLength(1351)
    expect(cache.entries[1350]?.name).toBe('pokemon-1350')
    expect(cache.entries[0]?.details).not.toHaveProperty('unused')
    expect(cache.entries[0]?.details.moves).toHaveLength(100)
  }
})

it('does not write a cache after cancellation', async () => {
  const { savePokedexCache } = await import('./data/pokedexCache')
  const controller = new AbortController()
  const pending = savePokedexCache(entriesFixture(), controller.signal)
  controller.abort()
  await expect(pending).resolves.toBe(false)
  expect(localStorage.getItem(config.cacheKey)).toBeNull()
})
