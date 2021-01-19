import { failure, mapFailure, Parser, Success, success } from '@fracture/parse';
import { Request } from '@fracture/serve';
import { parse } from 'querystring';

export const parseQueryString: (url: string) => Success<Record<string, string | string[]>> = (url) => {
  const index = url.indexOf('?');
  if (index === -1) {
    return success({});
  }
  return success(parse(url.slice(index + 1)));
};

export function parseQuery<T>(parser: Parser<T, Record<string, unknown>>): Parser<T, Request> {
  return (request: Request) => {
    return mapFailure(parser(parseQueryString(request.url).value), ({ reason }) => failure(request, reason));
  };
}
