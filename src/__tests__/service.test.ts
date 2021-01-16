import { IncomingHttpHeaders } from 'http';
import { readBody, readJSON } from './readBody';
import { TestGateways, testRequest } from './testRequest';

describe('service', () => {
  type TestCase<R> = Readonly<
    | [
        method: 'GET' | 'POST',
        path: string,
        responseCode: number,
        requestBody: Buffer | null,
        response: [R] | [R, IncomingHttpHeaders],
        gatewayOverride: TestGateways,
      ]
    | [
        method: 'GET' | 'POST',
        path: string,
        responseCode: number,
        requestBody: Buffer | null,
        response: [R] | [R, IncomingHttpHeaders],
      ]
  >;

  const jsonBuffer = (content: unknown) => Buffer.from(JSON.stringify(content));

  const jsonCases: Readonly<TestCase<any>[]> = [
    ['GET', '/hello', 200, null, [{ hello: 'world' }]],
    ['GET', '/not-a-valid-url', 404, null, [{ status: 'Not Found folks' }]],
    ['GET', '/add/2/to/2', 200, null, [{ sum: 4 }]],
    ['GET', '/greet/alice/from/bob', 200, null, [{ from: 'bob', name: 'alice', message: 'some pattern' }]],
    ['GET', '/foo/sha/abc', 404, null, [{ error: expect.any(String), id: 'abc', status: 'not_found' }]],
    ['POST', '/foo', 424, Buffer.from('{}'), [{ error: /^Failed at 'sha'/ }]],
    ['POST', '/greet/bob/from/alice', 201, Buffer.from('{}'), [{ from: 'alice', name: 'bob', whatsup: 'doc' }]],
    ['POST', '/foo', 424, jsonBuffer({ sha: 'hello' }), [{ error: expect.any(String) }]],
    [
      'POST',
      '/foo',
      201,
      jsonBuffer({ sha: String(Math.random() * 1000) }),
      [{ foo: expect.objectContaining({ id: 'lol', sha: expect.any(String) }) }],
      { db: { createFoo: ({ sha }) => Promise.resolve({ id: 'lol', sha }) } },
    ],
    ['GET', '/foo/bar', 404, null, [{ error: expect.any(String) }]],
    [
      'GET',
      '/foo/bar',
      200,
      null,
      [{ foo: expect.objectContaining({ id: 'bar', sha: 'sha' }) }],
      { db: { getFoo: (id) => Promise.resolve({ id, sha: 'sha' }) } },
    ],
    ['GET', '/admin/', 400, null, [{ status: 'wtf' }]],
    ['GET', '/admin', 404, null, [{ status: 'Not Found folks' }]],
    ['GET', '/admin/rest?hello=world', 400, null, [{ status: 'wtf' }]],
    ['GET', '/admin/users', 200, null, [{ lol: 'son' }]],
  ];

  it.each(jsonCases)(
    '%s %s %d',
    async (method, path, responseCode, requestBody, [responseMatch, responseHeaders], gateways = undefined) => {
      const [statusCode, headers, body] = await testRequest(
        method === 'POST' ? ['POST', 'application/json', 'identity', requestBody ?? Buffer.from('')] : method,
        path,
        gateways,
      );

      expect(statusCode).toEqual(responseCode);
      if (responseHeaders) {
        expect(headers).toMatchObject(responseHeaders);
      }
      expect(await readJSON(body)).toMatchObject(responseMatch);
    },
  );

  const htmlCases: TestCase<string | RegExp>[] = [
    [
      'GET',
      '/admin/apps',
      200,
      null,
      [/🌍/, { 'content-type': 'text/html;charset=utf-8' }],
      { gitHub: { getInstallations: () => Promise.resolve([]) } },
    ],
    ['GET', '/admin/apps', 500, null, [/Error: not implemented/]],
  ];

  it.each(htmlCases)(
    `%s %s %d`,
    async (method, path, responseCode, requestBody, [responseMatch, responseHeaders], gateways = undefined) => {
      const [statusCode, headers, body] = await testRequest(
        method === 'POST' ? ['POST', 'application/json', 'identity', requestBody ?? Buffer.from('')] : method,
        path,
        gateways,
      );

      expect(statusCode).toEqual(responseCode);
      if (responseHeaders) {
        expect(headers).toMatchObject(responseHeaders);
      }
      expect(await readBody(body)).toMatch(responseMatch);
    },
  );
});
