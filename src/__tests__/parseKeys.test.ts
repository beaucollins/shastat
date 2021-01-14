import { failure } from '@fracture/parse';

import { parseKeys } from '../parseKeys';
import { requireFailure } from './assertResult';

describe('parseKeys', () => {
  it('fails when one parser fails', () => {
    const parser = parseKeys({ a: (value) => failure(value, 'Nope') });
    const result = parser('what');
    expect(requireFailure(result)).toMatchObject({
      value: 'what',
      reason: 'Nope',
    });
  });
});
