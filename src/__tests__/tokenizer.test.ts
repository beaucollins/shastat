import { complete, isCaseInsensitiveToken, isChar, oneOrMore } from '../tokenizer';
import { requireFailure, requireSuccess } from './assertResult';

describe('tokenizer', () => {
  describe('oneOrMore', () => {
    const cases = [
      ['135', ['1', '3', '5']],
      ['1', ['1']],
    ] as const;

    cases.forEach(([str, expected]) => {
      it(`parses ${str}`, () => {
        expect(requireSuccess(complete(oneOrMore(isChar('1', '3', '5', '7', '9')))(str)).value).toEqual(expected);
      });
    });

    it('parses at least one', () => {
      expect(requireSuccess(oneOrMore(isChar('X'))('XY')).value).toEqual([['X'], 'Y']);
    });
  });

  describe('isCaseInsensitiveToken', () => {
    it('fails when none  match', () => {
      expect(requireFailure(isCaseInsensitiveToken('X')('y'))).toMatchObject({
        type: 'failure',
        reason: expect.stringMatching(/^Does not match insensitive/),
        value: 'y',
      });
    });
  });
});
