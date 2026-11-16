import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MantineProvider } from '@mantine/core'
import { expect, it } from 'vitest'
import { PokemonListing } from './PokemonListing'
import { detailsFixture } from '../test/pokemon'
import { theme } from '../theme'

function renderCatalogue() {
  const definitions = [
    ...Array.from({ length: 24 }, (_, i) => ({
      name: `pokemon-${i + 1}`,
      types: [i % 2 === 0 ? 'water' : 'fire'],
    })),
    { name: 'mr-mime', types: ['psychic', 'fairy'] },
    { name: 'bulbasaur', types: ['grass', 'poison'] },
  ]
  const entries = definitions.map(({ name, types }, i) => ({
    name,
    url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
    details: detailsFixture({
      types: types.map((type, slot) => ({
        slot: slot + 1,
        type: { name: type },
      })),
    }),
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

it('derives unique alphabetical types from the whole catalogue and filters before pagination', async () => {
  const user = userEvent.setup()
  renderCatalogue()
  const type = screen.getByRole('combobox', { name: 'Type' })
  expect(
    within(type)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual([
    'All types',
    'Fairy',
    'Fire',
    'Grass',
    'Poison',
    'Psychic',
    'Water',
  ])
  expect(type).toHaveValue('')
  expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Last page' }))
  await user.selectOptions(type, 'water')
  expect(visibleNames()).toEqual(
    Array.from({ length: 10 }, (_, i) => `Pokemon-${i * 2 + 1}`),
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 12 Pokémon. (12 of 26 match your filters.)',
  )
  await user.click(screen.getByRole('button', { name: 'Next page' }))
  expect(visibleNames()).toEqual(['Pokemon-21', 'Pokemon-23'])
  await user.selectOptions(type, 'fire')
  expect(visibleNames()).toEqual(
    Array.from({ length: 10 }, (_, i) => `Pokemon-${i * 2 + 2}`),
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 12 Pokémon.',
  )
  // Options remain available even when the current page has only fire Pokémon.
  expect(within(type).getAllByRole('option')).toHaveLength(7)
})

it('matches full and partial names case-insensitively after trimming and keeps input focus', async () => {
  const user = userEvent.setup()
  renderCatalogue()
  await user.click(screen.getByRole('button', { name: 'Last page' }))
  const search = screen.getByRole('textbox', { name: 'Pokémon name' })
  await user.type(search, '  MR-MIME  ')
  expect(visibleNames()).toEqual(['Mr-mime'])
  expect(search).toHaveFocus()
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–1 of 1 Pokémon.',
  )
  expect(
    screen.queryByRole('navigation', { name: 'Pokémon pages' }),
  ).not.toBeInTheDocument()
  await user.clear(search)
  await user.type(search, 'mime')
  expect(visibleNames()).toEqual(['Mr-mime'])
  await user.clear(search)
  await user.type(search, 'mr mime')
  expect(screen.getByRole('status')).toHaveTextContent(
    'No Pokémon match your filters.',
  )
  await user.clear(search)
  await user.type(search, '   ')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 26 Pokémon.',
  )
  await user.clear(search)
  await user.type(search, ' POKEMON-2 ')
  expect(visibleNames()).toEqual([
    'Pokemon-2',
    'Pokemon-20',
    'Pokemon-21',
    'Pokemon-22',
    'Pokemon-23',
    'Pokemon-24',
  ])
})

it('combines type and name, matches secondary types and recovers from empty results by clearing both controls', async () => {
  const user = userEvent.setup()
  renderCatalogue()
  const type = screen.getByRole('combobox', { name: 'Type' })
  const search = screen.getByRole('textbox', { name: 'Pokémon name' })
  await user.selectOptions(type, 'poison')
  await user.type(search, 'BULBA')
  expect(visibleNames()).toEqual(['Bulbasaur'])
  await user.selectOptions(type, 'fire')
  expect(search).toHaveValue('BULBA')
  expect(screen.getByRole('status')).toHaveTextContent(
    'No Pokémon match your filters.',
  )
  expect(
    screen.getByText('Try another type or search term, or clear the filters.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('list')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('navigation', { name: 'Pokémon pages' }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(type).toHaveValue('')
  expect(search).toHaveValue('')
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 26 Pokémon.',
  )
  expect(visibleNames()).toEqual(
    Array.from({ length: 10 }, (_, i) => `Pokemon-${i + 1}`),
  )
})

it('clears a type-only filter from a later page and returns to the first page', async () => {
  const user = userEvent.setup()
  renderCatalogue()
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Type' }),
    'water',
  )
  await user.click(screen.getByRole('button', { name: 'Next page' }))
  await user.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 1–10 of 26 Pokémon.',
  )
  expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})
