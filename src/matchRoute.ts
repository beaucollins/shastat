import { failure, isSuccess, Result } from '@fracture/parse';
import { Request, Route } from '@fracture/serve';

type RouteType<T> = T extends Route<infer U> ? U : never;

export function matchRoute<T extends Route<unknown>, R extends Route<unknown>[]>(
  route: T,
  ...routes: R
): Route<RouteType<T> | RouteType<R[number]>> {
  const allRoutes = [route, ...routes];
  return async (request) => {
    for (const route of allRoutes) {
      const match = (await route(request)) as Result<RouteType<typeof route>, Request>;
      if (isSuccess(match)) {
        return match;
      }
    }
    return failure(request, 'No match');
  };
}
