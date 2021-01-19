import { Success, success } from '@fracture/parse';
import { Request, Response } from '@fracture/serve';

type Found<T> = [status: 'found', resource: T];
type NotFound<T> = [status: 'not_found', param: T, reason: Error];
type Resource<T, P> = Found<T> | NotFound<P>;

const found = <T>(resource: T): Found<T> => ['found', resource];

const notFoundWith = <P>(param: P) => (error: Error): NotFound<P> => ['not_found', param, error];

export function isFound<T, P>(resource: Resource<T, P>): resource is Found<T> {
  return resource[0] === 'found';
}

export const resourceFromParam = <P, R, T>(fetcher: (param: P) => Promise<R>, getParam: (params: T) => P) => {
  return (params: T): Promise<Success<Resource<R, P>>> => {
    const param = getParam(params);
    return fetcher(param).then(found, notFoundWith(param)).then(success);
  };
};

export const whenFound = <T, P>(
  onFound: (resource: T, request: Request) => Response | Promise<Response>,
  notFound: (param: P, reason: Error, request: Request) => Response | Promise<Response>,
) => {
  return (resource: Resource<T, P>, request: Request): Response | Promise<Response> => {
    if (isFound(resource)) {
      return onFound(resource[1], request);
    }
    return notFound(resource[1], resource[2], request);
  };
};
