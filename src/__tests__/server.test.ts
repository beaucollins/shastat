import { IncomingHttpHeaders, request, Server } from 'http';
import { AddressInfo } from 'net';

import { listen } from '../server';
import { defaultTestAuthGateway, defaultTestGateway, defaultTestGitHubGateway } from './testGateway';

describe('server', () => {
  const server = new Promise<Server>((resolve) => {
    const http = listen(
      { db: defaultTestGateway, gitHub: defaultTestGitHubGateway, auth: defaultTestAuthGateway },
      0,
    ).on('listening', () => {
      resolve(http);
    });
  });

  const send = async ({ path, method = 'GET' }: { path: string; method?: string; body?: NodeJS.ReadableStream }) => {
    const { port } = (await server).address() as AddressInfo;
    return request({ port, method, path, host: 'localhost' });
  };

  afterAll(() =>
    server.then(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            error == null ? resolve() : reject(error);
          });
        }),
    ),
  );

  it('listens', async () => {
    const req = await send({ path: '/hello' });

    const res = new Promise<[number | undefined, IncomingHttpHeaders, Buffer[]]>((resolve, reject) => {
      req.on('response', async (response) => {
        const buffers: Buffer[] = [];
        response
          .on('data', (data) => {
            buffers.push(data);
          })
          .on('error', reject)
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
  });
});
