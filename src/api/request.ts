import { config } from '../config'

export async function requestJson(
  url: URL,
  signal: AbortSignal,
): Promise<unknown> {
  signal.throwIfAborted()
  const controller = new AbortController()
  let interrupt: (reason: unknown) => void = () => {}
  const interrupted = new Promise<never>((_resolve, reject) => {
    interrupt = reject
  })
  const abort = () => {
    controller.abort(signal.reason)
    interrupt(signal.reason)
  }
  signal.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => {
    const error = new Error('The request timed out. Please retry.')
    controller.abort(error)
    interrupt(error)
  }, config.requestTimeoutMs)

  try {
    return await Promise.race([
      fetch(url, { signal: controller.signal }).then(async (response) => {
        if (!response.ok) throw new Error('Unable to load Pokémon data.')
        const data: unknown = await response.json()
        return data
      }),
      interrupted,
    ])
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', abort)
  }
}
