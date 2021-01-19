import {
  failure,
  isString,
  mapFailure,
  mapParser,
  mapResult,
  objectOf,
  Parser,
  Result,
  success,
} from '@fracture/parse';
import { Request } from '@fracture/serve';
import { IncomingHttpHeaders } from 'http';

import { ContentType, parseContentType } from './contentType';
import { Gateway } from './data/gateway';
import { parseKeys } from './parseKeys';

export async function readBuffer(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const buffer: Buffer[] = [];
  for await (const chunk of readable) {
    buffer.push(Buffer.from(chunk));
  }
  return Buffer.concat(buffer);
}

const header = <N extends keyof IncomingHttpHeaders, T>(
  headerName: N,
  defaultValue: T,
): Parser<Exclude<IncomingHttpHeaders[N], null | undefined> | T, Request> => (request: Request) =>
  success(request.headers[headerName] ?? defaultValue);

const contentTypeHeader = mapParser(header('content-type', undefined), parseContentType);
const contentEncodingHeader = header('content-encoding', 'identity');

const parseContentHeaders = parseKeys({ contentType: contentTypeHeader, contentEncoding: contentEncodingHeader });

function getBodyStream(request: Request): Result<[NodeJS.ReadableStream, ContentType], Request> {
  return mapResult(
    parseContentHeaders(request),
    ({ contentEncoding }) => {
      switch (contentEncoding) {
        case 'identity': {
          return success([request.request, contentEncoding]);
        }
        default: {
          return failure(request, `Unsupported encoding: ${contentEncoding}`);
        }
      }
    },
    ({ reason }) => failure(request, reason),
  );
}

export async function parseBody<T>(
  request: Request,
  parser: Parser<T, [ContentType, Buffer]>,
): Promise<Result<T, Request>> {
  return mapResult(
    getBodyStream(request),
    ([body, contentType]) =>
      readBuffer(body).then((buffer) =>
        mapFailure(parser([contentType, buffer]), ({ reason }) => failure(request, reason)),
      ),
    ({ reason }) => failure(request, reason),
  );
}

export const JSONParser: Parser<ReturnType<typeof JSON.parse>> = ([contentType, buffer]) => {
  try {
    return success(JSON.parse(buffer.toString('utf-8')));
  } catch (error) {
    return failure([contentType, buffer], error.message);
  }
};

export function parseJson<T>(parser: Parser<T>): Parser<T> {
  return mapParser(JSONParser, parser);
}

export const CreateFooBody: Parser<Parameters<Gateway['createFoo']>[0]> = objectOf({
  sha: isString,
});
