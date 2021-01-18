import { DatabasePoolType } from 'slonik';
import { sql } from './types';
import { Foo } from './generated';
import { ulid } from 'ulid';

export type Gateway = {
  getFoo: (fooId: string) => Promise<Foo>;
  createFoo: (params: { sha: string }) => Promise<Foo>;
  getFooForSha: (sha: string) => Promise<Foo>;
};

type DatabaseMethod<T> = (pool: DatabasePoolType) => T;

type DatabaseGateway = { [Method in keyof Gateway]: DatabaseMethod<Gateway[Method]> };

const slonikGateway: DatabaseGateway = {
  getFoo: (pool) => (id: string) => pool.one(sql.Foo`SELECT * FROM foo WHERE id = ${id}`),
  getFooForSha: (pool) => (sha: string) => pool.one(sql.Foo`SELECT * FROM foo WHERE sha=${sha}`),
  createFoo: (pool) => ({ sha }) => pool.one(sql.Foo`INSERT INTO foo(id, sha) VALUES (${ulid()}, ${sha}) RETURNING *`),
};

export function createDatabaseGateway(pool: DatabasePoolType): Gateway {
  return Object.entries(slonikGateway).reduce(
    (partial, [key, value]) => ({ ...partial, [key]: value(pool) }),
    {},
  ) as Gateway;
}
