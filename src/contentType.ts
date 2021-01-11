import { Parser, isString, mapParser, failure, success, oneOf } from '@fracture/parse';
import { complete, isCaseInsensitiveToken, isChar, many, oneOrMore, sequence, Tokenizer } from './tokenizer';

const types = ['application', 'audio', 'image', 'multipart', 'text', 'video', 'extension-token'] as const;
type Type = typeof types[number];

type Parameter = [name: string, value: string];

type ContentType = {
  type: Type;
  subtype: string;
  parameters: Parameter[];
};

type ContentTypeParser = Parser<ContentType>;

const specials = (['(', ')', '<', '>', '@', ',', ';', ':', '\\', '"', '/', '[', ']', '?', '='] as const).map((char) =>
  char.charCodeAt(0),
);

const isType = isCaseInsensitiveToken(...types);

const isTokenChar: Tokenizer<string> = (value: string) => {
  const code = value.charCodeAt(0);
  if (isNaN(code)) {
    return failure(value, 'no character');
  }
  if (specials.indexOf(code) > -1) {
    return failure(value, `reserved character ${JSON.stringify(specials)}`);
  }
  if (code < 32) {
    return failure(value, 'control character');
  }
  return success([value[0], value.slice(1)]);
};

const isToken = mapParser(oneOrMore(isTokenChar), ([token, rest]) =>
  success([token.join(''), rest] as [string, string]),
);

const isSubtype: Tokenizer<string> = mapParser(isToken, ([subtype, rest]) => success([subtype.toLowerCase(), rest]));

function isNotChar<T extends string[]>(...options: T): Tokenizer<string> {
  return (value) => {
    for (const char of options) {
      if (value.indexOf(char) === 0) {
        return failure(value, `is ${char}`);
      }
    }
    return success([value[0], value.slice(1)]);
  };
}

const isQuotedString: Tokenizer<string> = mapParser(
  sequence(isChar('"'), oneOrMore(isNotChar('"')), isChar('"')),
  ([[, value], rest]) => success([value.join(''), rest]),
);

const isParameter: Tokenizer<[string, string]> = mapParser(
  sequence(isChar(';'), isToken, isChar('='), oneOf(isQuotedString, isToken)),
  ([[, name, , value], rest]) => success([[name, value], rest]),
);

const typeAndSubtype: Tokenizer<[Type, string]> = mapParser(
  sequence(isType, isChar('/'), isSubtype),
  ([[type, _slash, subtype], rest]) => success([[type, subtype], rest]),
);

const maybeParameters = many(isParameter);

const isContentType: Parser<ContentType> = mapParser(
  complete(sequence(typeAndSubtype, maybeParameters)),
  ([[type, subtype], parameters]) => {
    return success({ type, subtype, parameters });
  },
);

/**
 * https://www.mhonarc.org/~ehood/MIME/1521/04_Content-Type.html
 */
export const parseContentType: ContentTypeParser = mapParser(isString, isContentType);
