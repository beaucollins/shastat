import { Handler, Request, Responder, Route } from '@fracture/serve';
import {
  Parser,
  Success,
  isFailure,
  failure,
  success,
  mapSuccess,
  mapFailure,
  mapParser,
  oneOf,
  isExactly,
} from '@fracture/parse';
import { complete, isChar, many, oneOrMore } from './tokenizer';

type Token<T extends string> = [type: 'token', token: T];
type Param<Name extends string, T> = [type: 'param', name: Name, value: T];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Part = Token<any> | Param<any, any>;

export type PathParser<T> = Parser<T, Request>;

type Routes<T> = {
  GET?: Responder<T>;
  POST?: Responder<T>;
  PUT?: Responder<T>;
  PATCH?: Responder<T>;
};

export function routePath<T>(path: Route<T>, routes: Routes<T>): Handler {
  const methodIs = oneOf(isExactly('GET'), isExactly('POST'));
  const method = (request: Request) => methodIs(request.method);
  const matcher = matches(method, path);
  return async (request) => {
    const result = await matcher(request);
    if (isFailure(result)) {
      return result;
    }

    const [verb, value] = result.value;
    const responder = routes[verb];
    if (responder == null) {
      return failure(request, `no handler for ${verb}`);
    }
    return success(await responder(value, request));
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type SequenceOf<I, T extends readonly Parser<[any, I], I>[]> = T extends []
  ? []
  : T extends [Parser<[infer U, I], I>]
  ? [U]
  : T extends [Parser<[infer U, I], I>, ...infer P]
  ? P extends Parser<[any, I], I>[]
    ? [U, ...SequenceOf<I, P>]
    : never
  : never;
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SequenceParser<T extends any[], I> = Parser<[T, I], I>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sequence = <T extends Readonly<Parser<[any, I], I>[]>, I>(
  ...parsers: T
): SequenceParser<SequenceOf<I, T>, I> => {
  return (incoming) => {
    const values: SequenceOf<I, T>[number][] = [];
    let input = incoming;
    for (const parser of parsers) {
      const result = parser(input);
      if (isFailure(result)) {
        return result;
      }
      const {
        value: [value, rest],
      } = result;
      input = rest;
      values.push(value);
    }
    return success([values as SequenceOf<I, T>, input]);
  };
};

export function token<T extends string>(value: T): Parser<[Token<T>, string], string> {
  return (incoming) => {
    if (incoming.indexOf(value) === 0) {
      return success([['token', value], incoming.slice(value.length)]);
    }
    return failure(incoming, `${incoming} does not match ${value}`);
  };
}

export type ParsedTuple<T> = T extends []
  ? []
  : T extends [Parser<[infer P, string], string>]
  ? [P]
  : T extends [Parser<[infer P, string], string>, ...infer Rest]
  ? [P, ...ParsedTuple<Rest>]
  : T extends [infer S, ...infer Rest]
  ? S extends string
    ? [Token<S>, ...ParsedTuple<Rest>]
    : never
  : never;

export function param<Name extends string, T>(
  name: Name,
  parser: Parser<[T, string], string>,
): Parser<[Param<Name, T>, string], string> {
  return (incoming) => {
    return mapSuccess(
      parser(incoming),
      ([value, rest]): Success<[Param<Name, T>, string]> => {
        return success([['param', name, value], rest]);
      },
    );
  };
}

export function path<T extends (string | Parser<[Part, string], string>)[]>(
  ...parts: T
): Parser<ParsedTuple<T>, Request> {
  const parsers = parts.map((part) => {
    return typeof part === 'string' ? token(part) : part;
  });
  const parser: Parser<ParsedTuple<T>, string> = complete((url) => {
    const results: Array<ParsedTuple<T>[number]> = [];
    let path = url;
    for (const part of parsers) {
      const result = part(path);
      if (isFailure(result)) {
        return failure(url, result.reason);
      }
      const [parsed, remaining] = result.value;
      results.push(parsed);
      path = remaining;
    }
    return success([results as ParsedTuple<T>, path]);
  });
  return (request) => mapFailure(parser(request.url), (fail) => failure(request, fail.reason));
}

export function methodIs<T extends string>(methodName: T): Route<T> {
  return (request) =>
    request.method === methodName ? success(methodName) : failure(request, `${request.method} is not ${methodName}`);
}

type RouteAll<T> = T extends []
  ? []
  : T extends Route<unknown>[]
  ? T extends [Route<infer U>, ...infer Rest]
    ? [U, ...RouteAll<Rest>]
    : T extends [Route<infer U>]
    ? [U]
    : never
  : never;

export function matches<T extends Route<unknown>[]>(...matchers: T): Route<RouteAll<T>> {
  return async (request) => {
    const matched: Array<RouteAll<T>[number]> = [];
    for (const matcher of matchers) {
      const result = await matcher(request);
      if (isFailure(result)) {
        return result;
      }
      matched.push(result.value);
    }
    return success(matched as RouteAll<T>);
  };
}

export function method<M extends string, T>(method: M, route: Route<T>): Route<[M, T]> {
  return matches(methodIs(method), route);
}

export function get<T>(route: Route<T>): Route<['GET', T]> {
  return method('GET', route);
}

export function post<T>(route: Route<T>): Route<['POST', T]> {
  return method('POST', route);
}

function isCaseInsensitiveChar<T extends string[]>(...chars: T): Parser<[string, string], string> {
  return (incoming) => {
    const lower = incoming.toLowerCase();
    for (const option of chars) {
      if (lower.indexOf(option.toLowerCase()) === 0) {
        return success([incoming.slice(0, option.length), incoming.slice(option.length)]);
      }
    }
    return failure(incoming, `Does not match insensitive ${JSON.stringify(chars)}`);
  };
}

const Ints = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
} as const;

const NON_ZERO = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;
const NUMERALS = ['0', ...NON_ZERO] as const;

type IntTypes = typeof Ints;
type NonZero = typeof NON_ZERO[number];
type Numerals = typeof NUMERALS[number];

const nonZero: Parser<[IntTypes[NonZero], string], string> = mapParser(isChar(...NON_ZERO), ([num, remaining]) =>
  success([Ints[num], remaining]),
);
const numerical: Parser<[IntTypes[Numerals], string], string> = mapParser(isChar(...NUMERALS), ([num, remaining]) =>
  success([Ints[num], remaining]),
);

export const numeric: Parser<[number, string], string> = oneOf(
  mapParser(sequence(nonZero, many(numerical)), ([[leading, rest], remaining]) =>
    success([
      leading * Math.pow(10, rest.length) +
        rest.reduce((total, num, i) => total + num * Math.pow(10, rest.length - i - 1), 0 as number),
      remaining,
    ]),
  ),
  mapParser(isChar('0'), ([_, remaining]: ['0', string]): Success<[number, string]> => success([0, remaining])),
);

export const alphaNumeric: Parser<[string, string], string> = mapParser(
  oneOrMore(
    isCaseInsensitiveChar(
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
    ),
  ),
  ([chars, remaining]) => success([chars.join(''), remaining]),
);

export const urlSlug: Parser<[string, string], string> = mapParser(
  sequence(alphaNumeric, oneOrMore(oneOf(isChar('-'), alphaNumeric))),
  ([[leading, rest], remaining]) => success([leading.concat(rest.join('')), remaining]),
);

export const mapRoute = <A, B>(route: Route<A>, map: (route: A) => ReturnType<Route<B>>): Route<B> => {
  return async (request) => mapSuccess(await route(request), map);
};
