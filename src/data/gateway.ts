import { DatabasePoolType } from 'slonik';
import { sql } from './types';
import { Foo } from './generated';
import { ulid } from 'ulid';

export interface Gateway {
  getFoo: (fooId: string) => Promise<Foo>;
  createFoo: (params: { sha: string }) => Promise<Foo>;
  getFooForSha: (sha: string) => Promise<Foo>;
}

export function createDatabaseGateway(pool: DatabasePoolType): Gateway {
  return {
    getFoo: (id: string) => pool.one(sql.Foo`SELECT * FROM foo WHERE id = ${id}`),
    getFooForSha: (sha: string) => pool.one(sql.Foo`SELECT * FROM foo WHERE sha=${sha}`),
    createFoo: ({ sha }) => pool.one(sql.Foo`INSERT INTO foo(id, sha) VALUES (${ulid()}, ${sha}) RETURNING *`),
  };
}
