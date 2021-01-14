import { Readable } from 'stream';

export function readableBuffer(buffer: Buffer): Readable {
  let index = 0;
  return new Readable({
    read(length) {
      const part = buffer.slice(index, length);
      index += part.length;
      if (part.length > 0) {
        console.log('reading', part.length);
        this.push(part);
        return;
      }
      this.push(null);
    },
  });
}
