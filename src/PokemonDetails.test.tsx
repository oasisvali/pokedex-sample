import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { expect, it } from 'vitest'
import { PokemonListing } from './components/PokemonListing'
import { theme } from './theme'
import { detailsFixture } from './test/pokemon'
import type { PokemonDetails } from './api/pokemon'

function renderList(
  details: PokemonDetails[] = [detailsFixture(), detailsFixture()],
) {
  return render(
    <MantineProvider theme={theme}>
      <PokemonListing
        entries={details.map((item, index) => ({
          name: index === 0 ? 'bulbasaur' : 'ivysaur',
          url: `https://pokeapi.co/api/v2/pokemon/${index + 1}/`,
          details: item,
        }))}
      />
    </MantineProvider>,
  )
}

it('shows readable data, ordered types, expandable collections and audio controls', async () => {
  renderList()
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
  await waitFor(() =>
    expect(card.getByText('solar power (hidden)')).toBeVisible(),
  )
  await user.click(card.getByRole('button', { name: 'Base stats (1)' }))
  await waitFor(() => {
    expect(card.getByText('special attack')).toBeVisible()
    expect(card.getByText('65')).toBeVisible()
  })
  await user.click(card.getByRole('button', { name: 'Moves (2)' }))
  await waitFor(() => {
    expect(card.getByText('vine whip')).toBeVisible()
    expect(card.getByText('tackle')).toBeVisible()
  })
})

it('handles absent and broken media, false values and empty detail collections', async () => {
  renderList([
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
    detailsFixture({
      cries: { latest: null, legacy: 'https://example.com/legacy.ogg' },
    }),
  ])
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
  await waitFor(() => {
    expect(screen.getByText('No abilities available.')).toBeVisible()
    expect(screen.getByText('No stats available.')).toBeVisible()
    expect(screen.getByText('No moves available.')).toBeVisible()
  })
})
