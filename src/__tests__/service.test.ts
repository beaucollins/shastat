import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import { Gateway } from '../data/gateway';
import { createService } from '../service';
import { readJSON } from './readBody';
import { overrideGateway } from './testGateway';

async function testRequest(method: 'GET' | 'POST' | 'HEAD', url: string, gateway?: Partial<Gateway>) {
  const message = new IncomingMessage(new Socket());
  message.url = url;
  message.method = method;
  const response = new ServerResponse(message);

  return await createService(overrideGateway(gateway ?? {}))(message, response);
}

describe('server', () => {
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
    const [status, , body] = await testRequest('POST', '/greet/bob/from/alice');
    expect(status).toBe(201);
    expect(await readJSON(body)).toEqual({
      whatsup: 'doc',
      from: 'alice',
      name: 'bob',
    });
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
});
