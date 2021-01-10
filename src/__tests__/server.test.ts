import { AddressInfo } from 'net';
import { IncomingHttpHeaders, request } from 'http';
import { listen } from '../server';
import { defaultTestGateway } from './testGateway';

describe('server', () => {
  it('listens', async () => {
    const server = await new Promise<ReturnType<typeof listen>>((resolve) => {
      const http = listen(defaultTestGateway, 0).on('listening', () => {
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

    await new Promise<void>((resolve, reject) =>
      server.close((error) => {
        error == null ? resolve() : reject(error);
      }),
    );
  });
});
