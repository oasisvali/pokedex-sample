async function transform(
  bytes: Uint8Array<ArrayBuffer>,
  codec: CompressionStream | DecompressionStream,
) {
  const input = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
  return new Uint8Array(
    await new Response(input.pipeThrough(codec)).arrayBuffer(),
  )
}

export async function compressJson(value: unknown) {
  const bytes = await transform(
    new TextEncoder().encode(JSON.stringify(value)),
    new CompressionStream('gzip'),
  )
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function decompressJson(payload: string): Promise<unknown> {
  const bytes = Uint8Array.from(atob(payload), (character) =>
    character.charCodeAt(0),
  )
  const decoded = await transform(bytes, new DecompressionStream('gzip'))
  return JSON.parse(new TextDecoder().decode(decoded))
}
