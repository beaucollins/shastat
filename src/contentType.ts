import { Parser, isString, mapParser, failure } from '@fracture/parse';

type ContentType = {
  type: string;
  parameters: Record<string, string>;
};

type ContentTypeParser = Parser<ContentType>;

export function parseContentType(): ContentTypeParser {
  return mapParser(isString, () => {
    return failure('not implemnted' as const, 'Not implemented');
  });
}
