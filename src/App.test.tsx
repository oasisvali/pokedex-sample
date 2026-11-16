import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import App from './App'

it('renders the starter through the React DOM test environment', () => {
  render(<App />)
  expect(
    screen.getByRole('heading', { name: 'Frontend practice' }),
  ).toBeInTheDocument()
})
