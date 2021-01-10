import { parseContentType } from '../contentType';
import { requireSuccess } from './assertResult';

describe('parseContentType', () => {
  it('parses type and subtype', () => {
    expect(requireSuccess(parseContentType('application/json')).value).toEqual({
      type: 'application',
      subtype: 'json',
      parameters: [],
    });
  });

  it('parsers type, subtype, and parameters', () => {
    expect(requireSuccess(parseContentType('application/json;charset=utf-8;lol="something=else"')).value).toEqual({
      type: 'application',
      subtype: 'json',
      parameters: [
        ['charset', 'utf-8'],
        ['lol', 'something=else'],
      ],
    });
  });
});
