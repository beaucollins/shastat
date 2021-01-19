import { success } from '@fracture/parse';
import { Handler } from '@fracture/serve';
import { createElement } from 'react';

import { htmlDocument } from './htmlDocument';
import { ServerException } from './views';

export function errorHandler(handler: Handler): Handler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error : new Error(`Unknown error: ${error}`);
      return success(await htmlDocument(500, {}, createElement(ServerException, { error: reason })));
    }
  };
}
