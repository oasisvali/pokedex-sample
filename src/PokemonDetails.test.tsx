import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { deferredResponse, detailsFixture } from './test/pokemon'

let App: ComponentType
beforeEach(async () => {
  vi.resetModules()
  App = (await import('./App')).default
})

function listResponse(names = ['bulbasaur', 'ivysaur']) {
  return Response.json({
    results: names.map((name, i) => ({
      name,
      url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
    })),
  })
}

it('starts details concurrently, retains list order and shows readable data and audio controls', async () => {
  const first = deferredResponse()
  const second = deferredResponse()
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(listResponse())
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
    'https://pokeapi.co/api/v2/pokemon/bulbasaur',
  )
  expect(String(fetchMock.mock.calls[2]?.[0])).toBe(
    'https://pokeapi.co/api/v2/pokemon/ivysaur',
  )
  await act(async () => second.resolve(Response.json(detailsFixture())))
  expect(await screen.findByAltText('Ivysaur')).toBeInTheDocument()
  expect(screen.getByText('Loading Bulbasaur details…')).toBeInTheDocument()
  await act(async () => first.resolve(Response.json(detailsFixture())))
  const cards = screen.getAllByRole('listitem')
  expect(
    cards.map((card) => within(card).getByRole('heading').textContent),
  ).toEqual(['Bulbasaur', 'Ivysaur'])
  const firstCard = cards[0]
  if (!firstCard) throw new Error('Expected a Pokémon card')
  const card = within(firstCard)
  expect(card.getByText('0.6 m')).toBeInTheDocument()
  expect(card.getByText('8.5 kg')).toBeInTheDocument()
  expect(card.getByText('62')).toBeInTheDocument()
  expect(card.getByText('Yes')).toBeInTheDocument()
  expect(card.getByText('5')).toBeInTheDocument()
  expect(card.getByLabelText('Bulbasaur types').textContent).toBe('grasspoison')
  const audio = card.getByLabelText('Bulbasaur cry')
  expect(audio).toHaveAttribute('controls')
  expect(audio).toHaveAttribute('preload', 'none')
  expect(audio).toHaveAttribute('src', 'https://example.com/cry.ogg')
  expect(audio).not.toHaveAttribute('autoplay')
  const user = userEvent.setup()
  card.getByRole('button', { name: 'Abilities (1)' }).focus()
  await user.keyboard('{Enter}')
  expect(card.getByText('solar power (hidden)')).toBeVisible()
  await user.click(card.getByRole('button', { name: 'Base stats (1)' }))
  expect(card.getByText('special attack')).toBeVisible()
  expect(card.getByText('65')).toBeVisible()
  await user.click(card.getByRole('button', { name: 'Moves (2)' }))
  expect(card.getByText('vine whip')).toBeVisible()
  expect(card.getByText('tackle')).toBeVisible()
})

it.each(['http', 'network', 'invalid'])(
  'isolates %s failures and retries only the failed Pokémon',
  async (failure) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(listResponse())
      .mockResolvedValueOnce(Response.json(detailsFixture()))
    if (failure === 'network')
      fetchMock.mockRejectedValueOnce(new TypeError('Offline'))
    else
      fetchMock.mockResolvedValueOnce(
        failure === 'http'
          ? new Response(null, { status: 503 })
          : Response.json({ sprites: {} }),
      )
    fetchMock.mockResolvedValueOnce(Response.json(detailsFixture()))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load Ivysaur details.',
    )
    expect(screen.getByAltText('Bulbasaur')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ivysaur' })).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Retry Ivysaur details' }),
    )
    expect(await screen.findByAltText('Ivysaur')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(String(fetchMock.mock.calls[3]?.[0])).toBe(
      'https://pokeapi.co/api/v2/pokemon/ivysaur',
    )
  },
)

it('handles absent and broken media, false values and empty detail collections', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(listResponse())
      .mockResolvedValueOnce(
        Response.json(
          detailsFixture({
            sprites: { front_default: null },
            cries: { latest: null, legacy: null },
            is_default: false,
            base_experience: null,
            abilities: [],
            stats: [],
            moves: [],
            types: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          detailsFixture({
            cries: { latest: null, legacy: 'https://example.com/legacy.ogg' },
          }),
        ),
      ),
  )
  render(<App />)
  expect(await screen.findByText('Image unavailable')).toBeInTheDocument()
  expect(screen.getByText('Audio unavailable')).toBeInTheDocument()
  expect(screen.getByText('No')).toBeInTheDocument()
  expect(screen.getByText('Unknown')).toBeInTheDocument()
  expect(screen.getByText('No types available.')).toBeInTheDocument()
  const image = await screen.findByAltText('Ivysaur')
  fireEvent.error(image)
  expect(screen.getAllByText('Image unavailable')).toHaveLength(2)
  const audio = screen.getByLabelText('Ivysaur cry')
  expect(audio).toHaveAttribute('src', 'https://example.com/legacy.ogg')
  fireEvent.error(audio)
  expect(screen.getAllByText('Audio unavailable')).toHaveLength(2)
  const user = userEvent.setup()
  for (const label of ['Abilities (0)', 'Base stats (0)', 'Moves (0)']) {
    await user.click(screen.getByRole('button', { name: label }))
  }
  expect(screen.getByText('No abilities available.')).toBeVisible()
  expect(screen.getByText('No stats available.')).toBeVisible()
  expect(screen.getByText('No moves available.')).toBeVisible()
})

it('ignores cancelled detail responses and reuses successful details on remount', async () => {
  const obsolete = deferredResponse()
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(listResponse(['bulbasaur']))
    .mockReturnValueOnce(obsolete.promise)
    .mockResolvedValueOnce(Response.json(detailsFixture()))
  vi.stubGlobal('fetch', fetchMock)
  const first = render(<App />)
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  first.unmount()
  expect(fetchMock.mock.calls[1]?.[1]?.signal?.aborted).toBe(true)
  const second = render(<App />)
  expect(await screen.findByAltText('Bulbasaur')).toBeInTheDocument()
  await act(async () =>
    obsolete.resolve(Response.json(detailsFixture({ height: 999 }))),
  )
  second.unmount()
  render(<App />)
  expect(await screen.findByText('0.6 m')).toBeInTheDocument()
  expect(screen.queryByText('99.9 m')).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(3)
})
