import { Response, Request, Responder } from '@fracture/serve';
import { emptyBody } from './emptyBody';

export function redirectTo(location: string): Response {
  return [301, { location }, emptyBody()];
}

export function respondWithRedirect<T>(toLocation: (context: T, request: Request) => string): Responder<T> {
  return (context, request) => redirectTo(toLocation(context, request));
}
