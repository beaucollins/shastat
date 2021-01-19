import { IncomingHttpHeaders } from 'http';
import { GitHubAccessToken, GitHubApp, GitHubInstallation, GitHubOrganization, GitHubUser } from '../data/github';
import { readJSON, readBody } from './readBody';
import { TestGateways, testRequest } from './testRequest';
import { Readable } from 'stream';
import { createAuthGateway } from '../userIdentity';
import { createReadStream } from 'fs';
import { resolve } from 'path';
import { readBuffer } from '../parseBody';
import { createPrivateKey } from 'crypto';

describe('service', () => {
  type Expect<R> =
    | [expect: [R] | [R, { [key: string]: string | RegExp }]]
    | [expect: [R] | [R, { [key: string]: string | RegExp }], gateways: TestGateways];

  type TestCase<R> = Readonly<
    | [method: 'GET', path: string, responseCode: number, headers: [IncomingHttpHeaders], ...rest: Expect<R>]
    | [
        method: 'POST',
        path: string,
        responseCode: number,
        headersAndBody: [IncomingHttpHeaders, NodeJS.ReadableStream],
        ...rest: Expect<R>
      ]
  >;

  const pem = createReadStream(resolve(__dirname, '../jwt/__tests__/key.pem'));
  const provider = () => readBuffer(pem).then((key) => createPrivateKey({ key, format: 'pem' }));

  const jsonBuffer = (content: unknown) => Buffer.from(JSON.stringify(content));

  const get = <T>(path: string, expectedResponse: number, headers: IncomingHttpHeaders, matchBody: T): TestCase<T> => {
    return ['GET', path, expectedResponse, [headers], [matchBody]];
  };

  const jsonCases: Readonly<TestCase<Record<string, any>>[]> = [
    get('/hello', 200, {}, { hello: 'world' }),
    get('/not-a-valid-url', 404, {}, { status: 'Not Found folks' }),
    get('/add/2/to/2', 200, {}, { sum: 4 }),
    get('/greet/alice/from/bob', 200, {}, { from: 'bob', name: 'alice', message: 'some pattern' }),
    get('/foo/sha/abc', 404, {}, { error: expect.any(String), id: 'abc', status: 'not_found' }),
    ['POST', '/foo', 424, [{}, Readable.from('{}')], [{ error: /^Failed at 'sha'/ }]],
    ['POST', '/greet/bob/from/alice', 201, [{}, Readable.from('{}')], [{ from: 'alice', name: 'bob', hello: 'there' }]],
    ['POST', '/foo', 424, [{}, Readable.from(jsonBuffer({ sha: 'hello' }))], [{ error: expect.any(String) }]],
    [
      'GET',
      '/admin/users',
      200,
      [{ cookie: 'token=lol' }],
      [{ lol: 'son' }],
      { auth: { verifyToken: () => Promise.resolve({}) } },
    ],
    [
      'GET',
      '/admin/other',
      400,
      [{ cookie: 'token=lol' }],
      [{ status: '/admin/', reason: 'No matching result' }],
      { auth: { verifyToken: () => Promise.resolve({}) } },
    ],
    [
      'POST',
      '/foo',
      201,
      [{}, Readable.from(jsonBuffer({ sha: String(Math.random() * 1000) }))],
      [{ foo: expect.objectContaining({ id: 'lol', sha: expect.any(String) }) }],
      { db: { createFoo: ({ sha }) => Promise.resolve({ id: 'lol', sha }) } },
    ],
    ['GET', '/foo/bar', 404, [{}], [{ error: expect.any(String) }]],
    [
      'GET',
      '/foo/bar',
      200,
      [{}],
      [{ foo: expect.objectContaining({ id: 'bar', sha: 'sha' }) }],
      { db: { getFoo: (id) => Promise.resolve({ id, sha: 'sha' }) } },
    ],
  ];

  it.each(jsonCases)('JSON %s %s %d', async (...args) => {
    const [statusCode, headers, body] = await testRequest(
      args[0] === 'GET'
        ? ['GET', args[3][0]]
        : [
            'POST',
            { ...args[3][0], 'content-type': 'application/json', 'content-encoding': 'identity' },
            args[3][1] ?? Readable.from(''),
          ],
      args[1],
      args[5],
    );

    expect(statusCode).toEqual(args[2]);
    if (args[4].length === 2) {
      expect(headers).toMatchObject(args[4][1]);
    }
    expect(await readJSON(body)).toMatchObject(args[4][0]);
  });

  const htmlCases: TestCase<string | RegExp>[] = [
    ['GET', '/', 200, [{}], [/Hello\./]],
    ['GET', '/login', 200, [{}], [/Sign In/]],
    ['GET', '/auth/validate', 400, [{}], [/Invalid code:/]],
    ['GET', '/auth/validate?code=hello', 400, [{}], [/Invalid code:/]],
    [
      'GET',
      '/auth/validate?code=succeed',
      301,
      [{}],
      ['', { location: '/', 'set-cookie': /token=/ }],
      {
        auth: createAuthGateway(provider),
        gitHub: {
          getAuthenticatedUser: () => Promise.resolve({ login: 'succeed' } as GitHubUser),
          getAuthenticatedUserOrganizations: () => Promise.resolve([{ login: 'cocollc' } as GitHubOrganization]),
          exchangeOAuthCode: () => Promise.resolve({ access_token: 'access-token' } as GitHubAccessToken),
        },
      },
    ],
    [
      'GET',
      '/admin/apps',
      200,
      [{ cookie: 'token=lol' }],
      [/🌍/, { 'content-type': 'text/html;charset=utf-8' }],
      {
        auth: { verifyToken: () => Promise.resolve({}) },
        gitHub: {
          getInstallations: () =>
            Promise.resolve<GitHubInstallation[]>([
              {
                id: 5432,
                account: {},
                access_tokens_url: '',
                app_id: 1,
                app_slug: '',
                contact_email: '',
                created_at: '',
                events: [],
                html_url: '',
                permissions: {},
                repositories_url: '',
                repository_selection: 'all',
                single_file_name: null,
                target_id: 1,
                target_type: 'foo',
                updated_at: '',
              },
            ]),
        },
      },
    ],
    ['GET', '/admin', 301, [{}], ['', { location: '/admin/' }]],
    [
      'GET',
      '/admin/apps',
      500,
      [{ cookie: 'token=lol' }],
      [/Error: not implemented/],
      { auth: { verifyToken: () => Promise.resolve({}) } },
    ],
    ['GET', '/admin/rest?hello=world', 403, [{}], ['Not Authorized']],
    [
      'GET',
      '/admin/info',
      200,
      [{ cookie: `token=lol` }],
      [/<h1>Info<\/h1>/],
      {
        auth: { verifyToken: () => Promise.resolve({}) },
        gitHub: {
          getApp: () =>
            Promise.resolve<GitHubApp>({
              id: 1,
              node_id: '1',
              name: 'name',
              owner: null,
              description: 'description',
              external_url: 'mock://',
              html_url: 'mock://',
              created_at: '',
              updated_at: '',
              permissions: {},
              events: [],
            }),
        },
      },
    ],
    ['GET', '/admin/', 403, [{ cookie: 'token=lol' }], ['Not Authorized']],
  ];

  it.each(htmlCases)(`HTML %s %s %d`, async (...args) => {
    const [statusCode, headers, body] = await testRequest(
      args[0] === 'GET'
        ? ['GET', args[3][0]]
        : [
            'POST',
            { ...args[3][0], 'content-type': 'application/json', 'content-encoding': 'identity' },
            args[3][1] ?? Readable.from(''),
          ],
      args[1],
      args[5],
    );

    expect(statusCode).toEqual(args[2]);
    if (args[4].length === 2) {
      expect(headers).toMatchObject(args[4][1]);
    }
    expect(await readBody(body)).toMatch(args[4][0]);
  });
});
