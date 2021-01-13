import { Success, success } from '@fracture/parse';

type Found<T> = [status: 'found', resource: T];
type NotFound<T> = [status: 'not_found', param: T, reason: Error];
type Resource<T, P> = Success<Found<T> | NotFound<P>>;

const found = <T>(resource: T): Found<T> => ['found', resource];

const notFoundWith = <P>(param: P) => (error: Error): NotFound<P> => ['not_found', param, error];

export const resourceFromParam = <P, R, T>(fetcher: (param: P) => Promise<R>, getParam: (params: T) => P) => {
  return (params: T): Promise<Resource<R, P>> => {
    const param = getParam(params);
    return fetcher(param).then(found, notFoundWith(param)).then(success);
  };
};
