import { complete, isChar, oneOrMore } from '../tokenizer';
import { requireSuccess } from './assertResult';

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
});
