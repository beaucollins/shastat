import { failure, isFailure, isSuccess, mapParser, Parser, Success, success } from '@fracture/parse';

export type Tokenizer<T> = Parser<[T, string], string>;

export const isChar = <T extends string[]>(...char: T): Parser<[T[number], string], string> => {
  return (incoming) => {
    for (const option of char) {
      if (incoming.indexOf(option) === 0) {
        return success([incoming.slice(0, option.length), incoming.slice(option.length)]);
      }
    }
    return failure(incoming, `${incoming} does not match any ${JSON.stringify(char)}`);
  };
};

export function many<O, I>(parser: Parser<[O, I], I>): (incoming: I) => Success<[O[], I]> {
  return (incoming) => {
    let input = incoming;
    const results: O[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = parser(input);
      if (isSuccess(result)) {
        results.push(result.value[0]);
        input = result.value[1];
      } else {
        return success([results, input]);
      }
    }
  };
}

export const oneOrMore = <O, I>(parser: Parser<[O, I], I>): Parser<[O[], I], I> => {
  return (incoming) => {
    const firstResult = parser(incoming);
    if (!isSuccess(firstResult)) {
      return firstResult;
    }
    const rest = many(parser)(firstResult.value[1]);
    return success([[firstResult.value[0], ...rest.value[0]], rest.value[1]]);
  };
};

export const complete = <T>(parser: Parser<[T, string], string>): Parser<T, string> => {
  return mapParser(parser, ([value, remaining]) => {
    if (remaining != '') {
      return failure(remaining, `incomplete: '${remaining}'`);
    }
    return success(value);
  });
};

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
export const sequence = <T extends Readonly<Parser<[any, string], string>[]>>(
  ...parsers: T
): SequenceParser<SequenceOf<string, T>, string> => {
  return (incoming) => {
    const values: SequenceOf<string, T>[number][] = [];
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
    return success([values as SequenceOf<string, T>, input]);
  };
};

export function isCaseInsensitiveChar<T extends string[]>(...chars: T): Parser<[string, string], string> {
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

export function isCaseInsensitiveToken<T extends string[]>(...chars: T): Parser<[T[number], string], string> {
  return (incoming) => {
    const lower = incoming.toLowerCase();
    for (const option of chars) {
      if (lower.indexOf(option.toLowerCase()) === 0) {
        return success([option, incoming.slice(option.length)]);
      }
    }
    return failure(incoming, `Does not match insensitive ${JSON.stringify(chars)}`);
  };
}
