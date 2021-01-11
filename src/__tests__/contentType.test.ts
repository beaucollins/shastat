import { parseContentType } from '../contentType';

describe('parseContentType', () => {
  it('works', () => {
    expect(parseContentType()('hello')).toEqual('');
  });
});
