import { Request } from '@fracture/serve';

import { errorHandler } from '../errorHandler';
import { readBuffer } from '../parseBody';
import { requireSuccess } from './assertResult';

describe('errorHandler', () => {
  it('handles malformed errors', async () => {
    const handler = errorHandler(() => Promise.reject('lol'));

    const [status, , stream] = requireSuccess(await handler({} as Request)).value;

    const body = (await readBuffer(stream)).toString('utf-8');
    expect(status).toBe(500);
    expect(body).toMatch('Error: Unknown error: lol');
    expect(body).toMatch('<title>Server Exception:');
  });
});
