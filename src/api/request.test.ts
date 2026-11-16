import { afterEach, expect, it, vi } from 'vitest'
import { requestJson } from './request'
import { config } from '../config'

const url = new URL('https://pokeapi.co/api/v2/pokemon/bulbasaur')
afterEach(() => vi.useRealTimers())

it('times out and aborts requests even when the transport ignores cancellation', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn<typeof fetch>(() => new Promise(() => {}))
  vi.stubGlobal('fetch', fetchMock)
  const request = requestJson(url, new AbortController().signal)
  const failure = expect(request).rejects.toThrow('timed out')
  await vi.advanceTimersByTimeAsync(config.requestTimeoutMs)
  await failure
  expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})

it('cleans up timers and aborts immediately when its parent cancels', async () => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(() => new Promise(() => {})),
  )
  const controller = new AbortController()
  const request = requestJson(url, controller.signal)
  const failure = expect(request).rejects.toThrow('cancelled')
  controller.abort(new Error('cancelled'))
  await failure
  expect(vi.getTimerCount()).toBe(0)
})

it('does not leave a timeout after a successful response', async () => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ name: 'bulbasaur' })),
  )
  await expect(requestJson(url, new AbortController().signal)).resolves.toEqual(
    { name: 'bulbasaur' },
  )
  expect(vi.getTimerCount()).toBe(0)
})
