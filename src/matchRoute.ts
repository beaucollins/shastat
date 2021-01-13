import { Route } from '@fracture/serve';
import { isSuccess, failure } from '@fracture/parse';

type RouteType<T> = T extends Route<infer U> ? U : never;

export function matchRoute<T extends Route<any>, R extends Route<any>[]>(
  route: T,
  ...routes: R
): Route<RouteType<T> | RouteType<R>> {
  const allRoutes = [route, ...routes];
  return async (whatever) => {
    for (const route of allRoutes) {
      const match = await route(whatever);
      if (isSuccess(match)) {
        return match;
      }
    }
    return failure(whatever, 'No match');
  };
}
