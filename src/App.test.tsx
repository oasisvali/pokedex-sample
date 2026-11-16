import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import type { ComponentType } from 'react'
import { mockListFetch } from './test/pokemon'

const names = [
  'bulbasaur',
  'ivysaur',
  'venusaur',
  'charmander',
  'charmeleon',
  'charizard',
  'squirtle',
  'wartortle',
  'blastoise',
  'caterpie',
]

function listResponse(pokemon = names) {
  return Response.json({
    results: pokemon.map((name, index) => ({
      name,
      url: `https://pokeapi.co/api/v2/pokemon/${index + 1}/`,
    })),
  })
}

let App: ComponentType

beforeEach(async () => {
  vi.resetModules()
  App = (await import('./App')).default
})

async function renderApp() {
  return render(<App />)
}

it('shows loading, then ten names in API order with the expected request', async () => {
  let finish: (response: Response) => void = () => {}
  const fetchMock = vi.fn<typeof fetch>(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve
      }),
  )
  mockListFetch(fetchMock)
  await renderApp()
  expect(screen.getByRole('status')).toHaveTextContent('Loading Pokémon')
  await act(async () => finish(listResponse()))
  const items = within(
    await screen.findByRole('list', { name: 'Pokémon' }),
  ).getAllByRole('listitem')
  expect(
    items.map((item) => within(item).getByRole('heading').textContent),
  ).toEqual(names.map((name) => name.charAt(0).toUpperCase() + name.slice(1)))
  expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
    'https://pokeapi.co/api/v2/pokemon?limit=10&offset=0',
  )
  expect(screen.queryByText('Loading Pokémon…')).not.toBeInTheDocument()
})

it('shows an empty state', async () => {
  mockListFetch(vi.fn().mockResolvedValue(listResponse([])))
  await renderApp()
  expect(await screen.findByText('No Pokémon found.')).toHaveAttribute(
    'role',
    'status',
  )
})

it.each([
  ['HTTP failure', () => Promise.resolve(new Response(null, { status: 503 }))],
  ['network failure', () => Promise.reject(new TypeError('Offline'))],
  [
    'invalid response',
    () => Promise.resolve(Response.json({ results: [{ name: 12 }] })),
  ],
])('recovers from %s using keyboard retry', async (_label, failure) => {
  const user = userEvent.setup()
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(failure)
    .mockResolvedValue(listResponse())
  mockListFetch(fetchMock)
  await renderApp()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load Pokémon',
  )
  await user.tab()
  expect(screen.getByRole('button', { name: 'Retry' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(await screen.findByRole('list')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('aborts on unmount and ignores obsolete responses and cache writes', async () => {
  let finish: (response: Response) => void = () => {}
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve
        }),
    )
    .mockResolvedValue(listResponse(['ivysaur']))
  mockListFetch(fetchMock)
  const first = await renderApp()
  first.unmount()
  expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
  const second = await renderApp()
  expect(await screen.findByText('Ivysaur')).toBeInTheDocument()
  await act(async () => finish(listResponse(['bulbasaur'])))
  second.unmount()
  await renderApp()
  expect(await screen.findByText('Ivysaur')).toBeInTheDocument()
  expect(screen.queryByText('Bulbasaur')).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
