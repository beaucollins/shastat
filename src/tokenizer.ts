import { Parser, Success, failure, success, isSuccess, mapParser } from '@fracture/parse';

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
