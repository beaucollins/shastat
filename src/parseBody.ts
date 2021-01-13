import { Request } from '@fracture/serve';
import {
  Parser,
  ParserType,
  Result,
  isFailure,
  success,
  failure,
  mapParser,
  objectOf,
  isString,
} from '@fracture/parse';

import { parseContentType, ContentType } from './contentType';
import { Gateway } from './data/gateway';

function head<T>(value: T | T[]): T {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

const header = <T>(headerName: string, defaultValue: T): Parser<T | string, Request> => (request: Request) =>
  success(head(request.headers[headerName] ?? defaultValue));

const contentTypeHeader = mapParser(header('content-type', undefined), parseContentType);
const contentEncodingHeader = header('content-encoding', 'identity');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseKeys<T extends { [K: string]: Parser<unknown, any> }>(
  parsers: T,
): Parser<{ [K in keyof T]: ParserType<T[K]> }, unknown> {
  return (value) => {
    const keyed = {} as { [K in keyof T]: ParserType<T[K]> };

    for (const key in parsers) {
      const parser = parsers[key];
      const result = parser(value);
      if (isFailure(result)) {
        return failure(value, result.reason);
      }
      keyed[key] = result.value as ParserType<typeof parser>;
    }
    return success(keyed);
  };
}

type BodyParser<T> = Parser<T, [ContentType, Buffer]>;

const parseContentHeaders = parseKeys({ contentType: contentTypeHeader, contentEncoding: contentEncodingHeader });

export function getBodyStream(request: Request): Result<[NodeJS.ReadableStream, ContentType], Request> {
  const content = parseContentHeaders(request);

  if (isFailure(content)) {
    return failure(request, content.reason);
  }

  switch (content.value.contentEncoding) {
    case 'identity': {
      return success([request.request, content.value.contentEncoding]);
    }
    default: {
      return failure(request, `Unsupported encoding ${content.value.contentEncoding}`);
    }
  }
}

export async function parseBody<T>(request: Request, parser: BodyParser<T>): Promise<Result<T, [ContentType, Buffer]>> {
  const stream = getBodyStream(request);
  if (isFailure(stream)) {
    throw new Error(stream.reason);
  }
  const [body, contentType] = stream.value;
  const buffer: Buffer[] = [];
  for await (const chunk of body) {
    buffer.push(Buffer.from(chunk));
  }
  return parser([contentType, Buffer.concat(buffer)]);
}

export const JSONParser: BodyParser<ReturnType<typeof JSON.parse>> = ([contentType, buffer]) => {
  try {
    return success(JSON.parse(buffer.toString('utf-8')));
  } catch (error) {
    return failure([contentType, buffer], error.message);
  }
};

export function parseJson<T>(parser: Parser<T>): BodyParser<T> {
  return mapParser(JSONParser, parser);
}

export const CreateFooBody: Parser<Parameters<Gateway['createFoo']>[0]> = objectOf({
  sha: isString,
});
