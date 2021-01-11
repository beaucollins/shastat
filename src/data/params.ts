import { success, Success } from '@fracture/parse';
import { Gateway } from './gateway';
import { Foo } from './generated';

type Resource<T, P> = Success<['found', T] | ['not_found', P, Error]>;

export const queryFoo = <T>(getId: (params: T) => string, getFoo: Gateway['getFoo']) => (
  params: T,
): Promise<Resource<Foo, string>> =>
  getFoo(getId(params)).then(
    (foo) => success(['found', foo]),
    (error) => success(['not_found', getId(params), error]),
  );
