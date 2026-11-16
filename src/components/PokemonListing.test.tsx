import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { expect, it, vi } from 'vitest'
import { PokemonListing } from './PokemonListing'
import { detailsFixture } from '../test/pokemon'
import { theme } from '../theme'

function renderListing(count: number) {
  const details = detailsFixture()
  const entries = Array.from({ length: count }, (_, index) => ({
    name: `pokemon-${index + 1}`,
    url: `https://pokeapi.co/api/v2/pokemon/${index + 1}/`,
    details,
  }))
  return render(
    <MantineProvider theme={theme}>
      <PokemonListing entries={entries} />
    </MantineProvider>,
  )
}

function visibleNames() {
  return within(screen.getByRole('list', { name: 'Pokémon' }))
    .getAllByRole('heading')
    .map((heading) => heading.textContent)
}

it('navigates with keyboard and edge controls, preserves order and announces ranges', async () => {
  const scroll = vi.spyOn(HTMLElement.prototype, 'scrollIntoView')
  const user = userEvent.setup()
  renderListing(21)
  expect(visibleNames()).toEqual(
    Array.from({ length: 10 }, (_, i) => `Pokemon-${i + 1}`),
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 21 Pokémon.',
  )
  expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  screen.getByRole('button', { name: 'Page 2' }).focus()
  await user.keyboard('{Enter}')
  expect(visibleNames()).toEqual(
    Array.from({ length: 10 }, (_, i) => `Pokemon-${i + 11}`),
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 11–20 of 21 Pokémon.',
  )
  expect(screen.getByRole('heading', { name: 'Pokémon' })).toHaveFocus()
  expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' })
  expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await user.click(screen.getByRole('button', { name: 'Last page' }))
  expect(visibleNames()).toEqual(['Pokemon-21'])
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 21–21 of 21 Pokémon.',
  )
  expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Previous page' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 11–20 of 21 Pokémon.',
  )
  await user.click(screen.getByRole('button', { name: 'First page' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 21 Pokémon.',
  )
})

it('derives all 136 pages from 1,351 entries and renders only the final entry on the last page', async () => {
  renderListing(1351)
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Last page' }))
  expect(visibleNames()).toEqual(['Pokemon-1351'])
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1351–1351 of 1351 Pokémon.',
  )
  expect(screen.getByRole('button', { name: 'Page 136' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

it('pauses the previous page’s audio when navigating away', async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause')
  renderListing(11)
  const audio = screen.getByLabelText('Pokemon-1 cry')
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Play Pokemon-1 cry' }))
  expect(play).toHaveBeenCalledTimes(1)
  await user.click(screen.getByRole('button', { name: 'Next page' }))
  expect(audio).not.toBeInTheDocument()
  expect(pause.mock.contexts).toContain(audio)
  expect(
    screen.queryByRole('button', { name: 'Play Pokemon-1 cry' }),
  ).not.toBeInTheDocument()
})

it.each([0, 1, 10])(
  'hides pagination when %i entries fit on one page',
  (count) => {
    renderListing(count)
    expect(
      screen.queryByRole('navigation', { name: 'Pokémon pages' }),
    ).not.toBeInTheDocument()
    if (count === 0) {
      expect(screen.getByRole('status')).toHaveTextContent('No Pokémon found.')
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    } else {
      expect(visibleNames()).toHaveLength(count)
      expect(screen.getByRole('status')).toHaveTextContent(
        `Showing 1–${count} of ${count} Pokémon.`,
      )
    }
  },
)
