import { Response } from '@fracture/serve';

import { IncomingMessage, ServerResponse } from 'http';
import { Gateway } from '../data/gateway';
import { createService } from '../service';
import { overrideGateway, overrideGithubGateway } from './testGateway';
import { Readable, Writable } from 'stream';
import { GitHubGateway } from '../data/github';

function createIncomingMessage(method: 'GET' | ['POST', string, string, Buffer] | 'HEAD', url: string) {
  switch (method) {
    case 'GET':
    case 'HEAD': {
      const stream = Readable.from(Buffer.from('')) as IncomingMessage;
      stream.method = method;
      stream.url = url;
      return stream;
    }
    default: {
      const [verb, contentType, contentEncoding, body] = method;
      const stream = Readable.from(body) as IncomingMessage;
      stream.method = verb;
      stream.url = url;
      stream.headers = { 'content-type': contentType, 'content-encoding': contentEncoding };
      return stream;
    }
  }
}

export interface TestGateways {
  db?: Partial<Gateway>;
  gitHub?: Partial<GitHubGateway>;
}

export async function testRequest(
  method: 'GET' | 'HEAD' | ['POST', string, string, Buffer],
  url: string,
  gateways: TestGateways = {},
): Promise<Response> {
  const incomingMessage = createIncomingMessage(method, url);

  const service = createService({
    db: overrideGateway(gateways.db ?? {}),
    gitHub: overrideGithubGateway(gateways.gitHub ?? {}),
  });
  let buffer = Buffer.from('');
  const response = (new Writable({
    write(chunk, encoding, callback) {
      buffer = Buffer.concat([buffer, Buffer.from(chunk, encoding)]);
      callback();
    },
  }) as unknown) as ServerResponse;

  response.writeHead = () => {
    return response;
  };

  const result = await service(incomingMessage, response);

  return result;
}
