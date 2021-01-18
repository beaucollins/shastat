import { Readable } from 'stream';

export function emptyBody(): NodeJS.ReadableStream {
  return Readable.from('');
}
