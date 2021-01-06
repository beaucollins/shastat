import { Request } from '@fracture/serve';
import { Result, isSuccess, Success, Failure, ParserType } from '@fracture/parse';
import { Socket } from 'net';
import { IncomingMessage } from 'http';
import { alphaNumeric, complete, isChar, numeric, oneOrMore, param, path, PathParser, urlSlug } from '../path';

function requireSuccess<T, F>(result: Result<T, F>): Success<T> {
  if (!isSuccess(result)) {
    throw new Error(result.reason);
  }
  return result;
}

function requireFailure<T, F>(result: Result<T, F>): Failure<F> {
  if (isSuccess(result)) {
    throw new Error('Expected failure');
  }
  return result;
}

const requestFor = (url: string): Request => {
  return {
    request: new IncomingMessage(new Socket()),
    method: 'GET',
    url,
    headers: {},
  };
};

describe('path', () => {
  describe('succeeds', () => {
    type Case<P extends PathParser<unknown>> = [url: string, parser: P, expected: ParserType<P>];

    const testCase = <P extends PathParser<unknown>>(url: string, parser: P, expected: ParserType<P>): Case<P> => {
      return [url, parser, expected];
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cases: Readonly<Case<any>>[] = [
      testCase('/something', path('/something'), [['token', '/something']]),
      testCase('/something/else', path('/something', '/else'), [
        ['token', '/something'],
        ['token', '/else'],
      ]),
      testCase('/lol', path('/', param('hello', alphaNumeric)), [
        ['token', '/'],
        ['param', 'hello', 'lol'],
      ]),
      testCase(
        '/welcome/sam/hi',
        path('/welcome/', param('name', alphaNumeric), '/', param('greeting', alphaNumeric)),
        [
          ['token', '/welcome/'],
          ['param', 'name', 'sam'],
          ['token', '/'],
          ['param', 'greeting', 'hi'],
        ],
      ),
      testCase('/foos/256', path('/foos/', param('id', numeric)), [
        ['token', '/foos/'],
        ['param', 'id', 256],
      ]),
    ];

    cases.forEach(([url, route, expected]) => {
      it(`parses ${url}`, () => {
        const result = route(requestFor(url));
        expect(requireSuccess(result).value).toEqual(expected);
      });
    });
  });

  describe('fails', () => {
    const cases: [string, PathParser<unknown>, string | RegExp][] = [
      ['/hi', path('/goodbye'), '/hi does not match /goodbye'],
      ['/something/é', path('/something/', param('foo', alphaNumeric)), /^Does not match insensitive(.*)$/],
      ['/hello/param/more', path('/hello/', param('foo', urlSlug)), /'\/more' did not match/],
      ['/hello/rest/foo', path('/hello', '/rest'), "incomplete: '/foo'"],
      ['/hello/9a', path('/hello/', param('n', numeric)), "incomplete: 'a'"],
    ];

    cases.forEach(([url, route, reason]) => {
      it(`fails to parse ${url}`, () => {
        const result = route(requestFor(url));
        expect(requireFailure(result).reason).toMatch(reason);
      });
    });
  });
});

describe('oneOrMore', () => {
  const cases = [
    ['135', ['1', '3', '5']],
    ['1', ['1']],
  ] as const;

  cases.forEach(([str, expected]) => {
    it(`parses ${str}`, () => {
      expect(requireSuccess(complete(oneOrMore(isChar('1', '3', '5', '7', '9')))(str)).value).toEqual(expected);
    });
  });

  it('parses at least one', () => {
    expect(requireSuccess(oneOrMore(isChar('X'))('XY')).value).toEqual([['X'], 'Y']);
  });
});

describe('numeric', () => {
  it('parses', () => expect(requireSuccess(complete(numeric)('901')).value).toEqual(901));
  it('fails', () => expect(requireFailure(complete(numeric)('0901')).reason).toMatch(/incomplete/));
});

describe('urlSlug', () => {
  const cases = [
    ['abcd-/efg', ['abcd-', '/efg']],
    ['a-b-c-d_fg', ['a-b-c-d', '_fg']],
  ] as const;

  cases.forEach(([input, result]) => {
    it(`parses ${input}`, () => expect(requireSuccess(urlSlug(input)).value).toEqual(result));
  });
});
