import { notImplemented } from '../response';
import { readJSON } from './readBody';

describe('response', () => {
  it('notImplemented', async () => {
    const [status, headers, body] = notImplemented();
    expect(status).toBe(501);
    expect(headers).toMatchObject({
      'content-type': 'application/json',
      'content-length': expect.any(Number),
    });
    expect(await readJSON(body)).toEqual({ status: 'not implemented' });
  });
});
