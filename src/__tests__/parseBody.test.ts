import { Request } from '@fracture/serve';
import { failure } from '@fracture/parse';

import { JSONParser, parseBody } from '../parseBody';
import { requireFailure } from './assertResult';
import { Readable } from 'stream';

describe('JSONParser', () => {
  it.each(['{', 'some json'])('fails with invalid JSON', (json) => {
    expect(
      requireFailure(JSONParser([{ type: 'application', subtype: 'json', parameters: [] }, Buffer.from(json, 'utf-8')]))
        .reason,
    ).toMatch(/^Unexpected/i);
  });
});

describe('parseBody', () => {
  const parse = (request: Request) => parseBody(request, (content) => failure(content, 'Not implemented'));

  it('fails without Content-Type header', async () => {
    const request = { method: 'FOO', url: '/bar', headers: {}, request: Readable.from(Buffer.from('{}')) } as Request;
    expect(requireFailure(await parse(request)).reason).toMatch('Unsupported Content-Type');
  });

  it('fails with unknown Content-Type header', async () => {
    const request = {
      method: 'FOO',
      url: '/bar',
      headers: { 'content-type': 'lol' },
      request: Readable.from(Buffer.from('{}')),
    } as Request;
    expect(requireFailure(await parse(request)).reason).toMatch(/^Does not match/);
  });

  it('fails with unknown Content-Encoding header', async () => {
    const request = {
      method: 'FOO',
      url: '/bar',
      headers: { 'content-type': 'application/json', 'content-encoding': 'whatever' },
      request: Readable.from(Buffer.from('{}')),
    } as Request;
    expect(requireFailure(await parse(request)).reason).toMatch('Unsupported encoding: whatever');
  });

  it('fails when buffer parser fails', async () => {
    const request = {
      method: 'FOO',
      url: '/bar',
      headers: { 'content-type': 'application/json' },
      request: Readable.from(Buffer.from('{}')),
    } as Request;
    expect(requireFailure(await parse(request)).reason).toEqual('Not implemented');
  });
});
