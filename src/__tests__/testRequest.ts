import { Response } from '@fracture/serve';
import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http';
import { Readable, Writable } from 'stream';

import { Gateway } from '../data/gateway';
import { GitHubGateway } from '../data/github';
import { createService } from '../service';
import { AuthGateway } from '../userIdentity';
import { overrideAuth, overrideGateway, overrideGithubGateway } from './testGateway';

function createIncomingMessage(
  method: ['GET', IncomingHttpHeaders] | ['POST', IncomingHttpHeaders, NodeJS.ReadableStream | undefined],
  url: string,
) {
  switch (method[0]) {
    case 'POST': {
      if (method[2] == null) {
        throw new Error('no body');
      }
      const stream = (method[2] ?? Readable.from('')) as IncomingMessage;
      stream.method = 'POST';
      stream.url = url;
      stream.headers = method[1];
      return stream;
    }
    default: {
      const [verb, headers] = method;
      const stream = Readable.from('') as IncomingMessage;
      stream.method = verb;
      stream.url = url;
      stream.headers = headers;
      return stream;
    }
  }
}

export interface TestGateways {
  db?: Partial<Gateway>;
  gitHub?: Partial<GitHubGateway>;
  auth?: Partial<AuthGateway>;
}

export async function testRequest(
  method: ['GET', IncomingHttpHeaders] | ['POST', IncomingHttpHeaders, NodeJS.ReadableStream | undefined],
  url: string,
  gateways: TestGateways = {},
): Promise<Response> {
  const incomingMessage = createIncomingMessage(method, url);

  const service = createService({
    db: overrideGateway(gateways.db ?? {}),
    gitHub: overrideGithubGateway(gateways.gitHub ?? {}),
    auth: overrideAuth(gateways.auth ?? {}),
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
