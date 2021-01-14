import { IncomingHttpHeaders } from 'http';
import { Gateway } from '../data/gateway';
import { readJSON } from './readBody';
import { testRequest } from './testRequest';

describe('service', () => {
  it('404s', async () => {
    const [status, headers, body] = await testRequest('GET', '/not-a-valid-url');

    expect(status).toBe(404);
    expect(headers).toMatchObject({
      'content-length': expect.any(Number),
      'content-type': 'application/json',
    });
    expect(await readJSON(body)).toEqual({
      status: 'Not Found folks',
    });
  });

  it('GET /hello', async () => {
    const [status, headers, body] = await testRequest('GET', '/hello');

    expect(status).toBe(200);

    expect(headers).toMatchObject({
      'content-length': expect.any(Number),
      'content-type': 'application/json',
    });

    expect(await readJSON(body)).toMatchObject({
      hello: 'world',
    });
  });

  it('GET /add/2/to/2', async () => {
    const [status, , body] = await testRequest('GET', '/add/2/to/2');

    expect(status).toBe(200);
    expect(await readJSON(body)).toEqual({ sum: 4 });
  });

  it('GET /greet/alice/from/bob', async () => {
    const [status, , body] = await testRequest('GET', '/greet/alice/from/bob');

    expect(status).toBe(200);
    expect(await readJSON(body)).toEqual({
      message: 'some pattern',
      name: 'alice',
      from: 'bob',
    });
  });

  it('POST /greet/alice/from/bob', async () => {
    const [status, , body] = await testRequest(
      ['POST', 'application/json', 'identity', Buffer.from('')],
      '/greet/bob/from/alice',
    );
    expect(status).toBe(201);
    expect(await readJSON(body)).toEqual({
      whatsup: 'doc',
      from: 'alice',
      name: 'bob',
    });
  });

  it('POST /foo 501', async () => {
    const [status] = await testRequest(
      ['POST', 'application/json', 'identity', Buffer.from(JSON.stringify({ sha: 'hello' }))],
      '/foo',
    );
    expect(status).toBe(424);
  });

  describe('GET /foo/bar', () => {
    it('responds with 404 when gateway errors', async () => {
      const [status, , body] = await testRequest('GET', '/foo/bar');
      expect(status).toBe(404);
      expect(await readJSON(body)).toMatchObject({
        status: expect.any(String),
      });
    });

    it('responds with 200 when foo is found', async () => {
      const foo = { id: 'id', sha: 'sha' };
      const [status, , body] = await testRequest('GET', '/foo/bar', { getFoo: () => Promise.resolve(foo) });

      expect(status).toBe(200);
      expect(await readJSON(body)).toEqual({ foo });
    });
  });

  type TestCase = Readonly<
    | [
        method: 'GET' | 'POST',
        path: string,
        responseCode: number,
        requestBody: Buffer | null,
        response: [any] | [any, IncomingHttpHeaders],
        gatewayOverride: Partial<Gateway>,
      ]
    | [
        method: 'GET' | 'POST',
        path: string,
        responseCode: number,
        requestBody: Buffer | null,
        response: [any] | [any, IncomingHttpHeaders],
      ]
  >;

  const requestCases: Readonly<TestCase[]> = [
    ['GET', '/path', 404, null, [{ status: 'Not Found folks' }]],
    ['POST', '/path', 404, null, [{ status: expect.any(String) }]],
    ['GET', '/foo/sha/abc', 404, null, [{ error: expect.any(String), id: 'abc', status: 'not_found' }]],
    ['POST', '/foo', 424, Buffer.from('{}'), [{ error: /^Failed at 'sha'/ }]],
    [
      'POST',
      '/foo',
      201,
      Buffer.from(JSON.stringify({ sha: String(Math.random() * 1000) })),
      [{ foo: expect.objectContaining({ id: 'lol', sha: expect.any(String) }) }],
      { createFoo: ({ sha }) => Promise.resolve({ id: 'lol', sha }) },
    ],
  ];

  it.each(requestCases)(
    '%s %s %d',
    async (method, path, responseCode, requestBody, [responseMatch, responseHeaders], gateway = undefined) => {
      const [statusCode, headers, body] = await testRequest(
        method === 'POST' ? ['POST', 'application/json', 'identity', requestBody ?? Buffer.from('')] : method,
        path,
        gateway,
      );

      expect(statusCode).toEqual(responseCode);
      if (responseHeaders) {
        expect(headers).toMatchObject(responseHeaders);
      }
      expect(await readJSON(body)).toMatchObject(responseMatch);
    },
  );
});
