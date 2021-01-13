import { Response } from '@fracture/serve';

import { IncomingMessage, request, Server } from 'http';
import { AddressInfo } from 'net';
import { Gateway } from '../data/gateway';
import { listen } from '../server';
import { overrideGateway } from './testGateway';

function createRequest(server: Server, method: 'GET' | ['POST', string, string, Buffer] | 'HEAD', url: string) {
  const { port } = server.address() as AddressInfo;
  switch (method) {
    case 'GET':
    case 'HEAD': {
      const req = request({ method, path: url, port });
      req.end();
      return req;
    }
    default: {
      const [verb, contentType, contentEncoding, body] = method;
      const req = request({
        method: verb,
        path: url,
        port,
        headers: {
          'content-type': contentType,
          'content-encoding': contentEncoding,
          'content-length': body.length,
        },
      });
      req.write(body);
      req.end();
      return req;
    }
  }
}

function send(server: Server, method: 'GET' | ['POST', string, string, Buffer] | 'HEAD', url: string) {
  return new Promise<IncomingMessage>((resolve, reject) =>
    createRequest(server, method, url).on('response', resolve).on('error', reject),
  );
}

export async function testRequest(
  method: 'GET' | 'HEAD' | ['POST', string, string, Buffer],
  url: string,
  gateway?: Partial<Gateway>,
): Promise<Response> {
  const server = await new Promise<Server>((resolve) => {
    const http = listen(overrideGateway(gateway ?? {}), 0);
    http.on('listening', () => resolve(http));
  });

  const request = await send(server, method, url);

  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

  return [request.statusCode ?? 400, request.headers, request];
}
