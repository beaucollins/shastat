import { AddressInfo, Socket } from 'net';
import { IncomingHttpHeaders, IncomingMessage, request, ServerResponse } from 'http';
import { listen, service } from '../server';

async function readBody(stream: NodeJS.ReadableStream) {
  const buffers: Buffer[] = [];
  for await (const chunk of stream) {
    buffers.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') : chunk);
  }
  return Buffer.concat(buffers).toString('utf-8');
}

async function readJSON(stream: NodeJS.ReadableStream) {
  return JSON.parse(await readBody(stream));
}

async function testRequest(method: 'GET' | 'POST' | 'HEAD', url: string) {
  const message = new IncomingMessage(new Socket());
  message.url = url;
  message.method = method;
  const response = new ServerResponse(message);

  return await service(message, response);
}

describe('server', () => {
  it('404s', async () => {
    const [status, headers, body] = await testRequest('GET', '/not-a-valid-url');

    expect(status).toBe(404);
    expect(headers).toMatchObject({
      'content-length': expect.any(Number),
      'content-type': 'application/json',
    });
    expect(await readJSON(body)).toEqual({
      status: 'Not Found folks',
    });
  });

  it('GET /hello', async () => {
    const [status, headers, body] = await testRequest('GET', '/hello');

    expect(status).toBe(200);

    expect(headers).toMatchObject({
      'content-length': expect.any(Number),
      'content-type': 'application/json',
    });

    expect(await readJSON(body)).toMatchObject({
      hello: 'world',
    });
  });

  it('GET /add/2/to/2', async () => {
    const [status, , body] = await testRequest('GET', '/add/2/to/2');

    expect(status).toBe(200);
    expect(await readJSON(body)).toEqual({ sum: 4 });
  });

  it('GET /greet/alice/from/bob', async () => {
    const [status, , body] = await testRequest('GET', '/greet/alice/from/bob');

    expect(status).toBe(200);
    expect(await readJSON(body)).toEqual({
      message: 'some pattern',
      name: 'alice',
      from: 'bob',
    });
  });
});

describe('listen', () => {
  it('listens', async () => {
    const server = await new Promise<ReturnType<typeof listen>>((resolve) => {
      const http = listen(0).on('listening', () => {
        resolve(http);
      });
    });

    const { port } = server.address() as AddressInfo;

    const req = request({ port, host: 'localhost', path: '/hello' });

    const res = new Promise<[number | undefined, IncomingHttpHeaders, Buffer[]]>((resolve, reject) => {
      req.on('response', async (response) => {
        const buffers: Buffer[] = [];
        response
          .on('data', (data) => {
            buffers.push(data);
          })
          .on('end', () => resolve([response.statusCode, response.headers, buffers]));
      });
    });

    req.end();

    const [status, headers, body] = await res;

    expect(status).toBe(200);
    expect(headers).toMatchObject({
      'content-type': 'application/json',
    });

    expect(JSON.parse(Buffer.concat(body).toString('utf-8'))).toMatchObject({
      hello: 'world',
    });

    await new Promise<void>((resolve, reject) =>
      server.close((error) => {
        error == null ? resolve() : reject(error);
      }),
    );
  });
});
