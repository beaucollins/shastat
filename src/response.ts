import { jsonResponse, Response } from '@fracture/serve';

export const notImplemented = (): Response => jsonResponse(501, {}, { status: 'not implemented' });
