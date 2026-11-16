import { StrictMode, type ComponentType } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  catalogueResponse,
  deferredResponse,
  detailsFixture,
  mockCatalogue,
} from './test/pokemon'

let App: ComponentType
beforeEach(async () => {
  vi.stubEnv('VITE_POKEMON_CONCURRENCY', '6')
  vi.resetModules()
  App = (await import('./App')).default
})
afterEach(() => vi.unstubAllEnvs())

it('limits concurrent requests, shows deterministic progress, and blocks browsing until every detail succeeds', async () => {
  const names = [
    'bulbasaur',
    'ivysaur',
    'venusaur',
    'charmander',
    'charmeleon',
    'charizard',
    'squirtle',
    'wartortle',
  ]
  const pending = new Map(names.map((name) => [name, deferredResponse()]))
  const fetchMock = mockCatalogue(names, (name) => {
    const response = pending.get(name)
    if (!response) throw new Error('Unexpected detail request')
    return response.promise
  })
  render(<App />)
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(8))
  expect(screen.getByText('Loaded 0 of 8 Pokémon (0%).')).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
  await act(async () =>
    pending.get('charizard')?.resolve(Response.json(detailsFixture())),
  )
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '12')
  expect(fetchMock).toHaveBeenCalledTimes(9)
  await act(async () =>
    pending.get('squirtle')?.resolve(Response.json(detailsFixture())),
  )
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  expect(fetchMock).toHaveBeenCalledTimes(10)
  await act(async () => {
    for (const name of names.slice(0, 5))
      pending.get(name)?.resolve(Response.json(detailsFixture()))
  })
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '87')
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
  await act(async () =>
    pending.get('wartortle')?.resolve(Response.json(detailsFixture())),
  )
  const list = await screen.findByRole('list', { name: 'Pokémon' })
  expect(
    within(list)
      .getAllByRole('heading')
      .map((heading) => heading.textContent?.toLowerCase()),
  ).toEqual(names)
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
    'https://pokeapi.co/api/v2/pokemon?limit=1&offset=0',
  )
  expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
    'https://pokeapi.co/api/v2/pokemon?limit=8&offset=0',
  )
})

it('loads the full catalogue including entries beyond the ten shown on screen', async () => {
  const names = Array.from({ length: 12 }, (_, i) => `pokemon-${i}`)
  const fetchMock = mockCatalogue(names)
  render(<App />)
  const list = await screen.findByRole('list', { name: 'Pokémon' })
  expect(within(list).getAllByRole('heading')).toHaveLength(10)
  expect(
    screen.getByText('12 Pokémon ready to explore. Showing the first 10.'),
  ).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(14)
  expect(
    fetchMock.mock.calls.some(([input]) =>
      String(input).endsWith('/pokemon-11'),
    ),
  ).toBe(true)
})

it.each(['http', 'network', 'invalid'])(
  'keeps browsing blocked after a %s detail failure and retries only failures',
  async (failure) => {
    let failed = false
    const fetchMock = mockCatalogue(undefined, async (name) => {
      if (name === 'ivysaur' && !failed) {
        failed = true
        if (failure === 'network') throw new TypeError('Offline')
        return failure === 'http'
          ? new Response(null, { status: 503 })
          : Response.json({ sprites: {} })
      }
      return Response.json(detailsFixture())
    })
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Some Pokémon details could not be loaded',
    )
    expect(screen.getByText('Loaded 1 of 2 Pokémon (50%).')).toBeInTheDocument()
    expect(screen.getByText('1 detail requests failed.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    const user = userEvent.setup()
    await user.tab()
    expect(
      screen.getByRole('button', { name: 'Retry failed requests' }),
    ).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByAltText('Ivysaur')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(String(fetchMock.mock.calls[4]?.[0])).toBe(
      'https://pokeapi.co/api/v2/pokemon/ivysaur',
    )
  },
)

it.each([
  ['HTTP failure', () => Promise.resolve(new Response(null, { status: 503 }))],
  ['network failure', () => Promise.reject(new TypeError('Offline'))],
  ['invalid catalogue', () => Promise.resolve(Response.json({ results: [] }))],
])('offers catalogue retry after %s', async (_label, failure) => {
  const success = mockCatalogue()
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockImplementationOnce(failure)
      .mockImplementation(success),
  )
  render(<App />)
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load the Pokémon catalogue',
  )
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Retry catalogue' }))
  expect(await screen.findByRole('list')).toBeInTheDocument()
})

it('handles an empty catalogue without detail requests', async () => {
  const fetchMock = mockCatalogue([])
  render(<App />)
  expect(await screen.findByText('No Pokémon found.')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

it('shares startup work through StrictMode resubscriptions', async () => {
  const fetchMock = mockCatalogue()
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  expect(await screen.findByRole('list')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(4)
})

it('cancels unmounted work and ignores late results before reusing the completed dataset', async () => {
  const obsolete = deferredResponse()
  let calls = 0
  const fetchMock = mockCatalogue(['bulbasaur'], () =>
    ++calls === 1
      ? obsolete.promise
      : Promise.resolve(Response.json(detailsFixture())),
  )
  const first = render(<App />)
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  first.unmount()
  await act(async () => {})
  expect(fetchMock.mock.calls[2]?.[1]?.signal?.aborted).toBe(true)
  const second = render(<App />)
  expect(await screen.findByAltText('Bulbasaur')).toBeInTheDocument()
  await act(async () =>
    obsolete.resolve(Response.json(detailsFixture({ height: 999 }))),
  )
  second.unmount()
  await act(async () => {})
  render(<App />)
  expect(await screen.findByText('0.6 m')).toBeInTheDocument()
  expect(screen.queryByText('99.9 m')).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(4)
})

it('follows additional catalogue pages while preserving non-sequential resource URLs', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(catalogueResponse(['bulbasaur', 'ivysaur'], true))
    .mockResolvedValueOnce(
      Response.json({
        count: 2,
        previous: null,
        next: 'https://pokeapi.co/api/v2/pokemon?limit=1&offset=1',
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        ],
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        count: 2,
        previous: null,
        next: null,
        results: [
          { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/10002/' },
        ],
      }),
    )
    .mockImplementation(() => Promise.resolve(Response.json(detailsFixture())))
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  expect(await screen.findByAltText('Ivysaur')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(5)
})
