import { Request } from '@fracture/serve';
import { ParserType, success } from '@fracture/parse';
import { Socket } from 'net';
import { IncomingMessage } from 'http';
import { alphaNumeric, numeric, param, path, PathParser, routePath, urlSlug } from '../path';
import { requireFailure, requireSuccess } from './assertResult';
import { complete } from '../tokenizer';

const requestFor = (url: string, method = 'GET'): Request => {
  return {
    request: new IncomingMessage(new Socket()),
    method,
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

describe('routePath', () => {
  it('fails on missing verb', async () => {
    const result = await routePath(() => success('hello'), {})(requestFor('/anything', 'POST'));
    expect(requireFailure(result).reason).toBe('no handler for POST');
  });
});
