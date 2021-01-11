export async function readBody(stream: NodeJS.ReadableStream): Promise<string> {
  const buffers: Buffer[] = [];
  for await (const chunk of stream) {
    buffers.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') : chunk);
  }
  return Buffer.concat(buffers).toString('utf-8');
}

export async function readJSON(stream: NodeJS.ReadableStream): Promise<unknown> {
  return JSON.parse(await readBody(stream));
}
