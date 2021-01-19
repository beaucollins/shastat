import { Response } from '@fracture/serve';
import { OutgoingHttpHeaders } from 'http';
import { renderToNodeStream } from 'react-dom/server';
import { Readable } from 'stream';
import { ServerStyleSheet } from 'styled-components';

async function readBuffer(stream: NodeJS.ReadableStream) {
  const buffers: Buffer[] = [];
  for await (const chunk of stream) {
    buffers.push(Buffer.from(chunk));
  }
  return Buffer.concat(buffers);
}

export async function htmlDocument(
  status: number,
  headers: OutgoingHttpHeaders,
  view: React.ReactElement,
): Promise<Response> {
  const sheet = new ServerStyleSheet();
  try {
    const jsx = sheet.collectStyles(view);
    const stream = sheet.interleaveWithNodeStream(renderToNodeStream(jsx));
    const html = await readBuffer(stream);
    return [
      status,
      { ...headers, 'content-type': 'text/html;charset=utf-8', 'content-length': html.length },
      Readable.from(html),
    ];
  } finally {
    sheet.seal();
  }
}
