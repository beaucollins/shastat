import { failure, isFailure, Parser, ParserType, success } from '@fracture/parse';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseKeys<T extends { [K: string]: Parser<unknown, any> }>(
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
