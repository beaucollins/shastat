import { DatabasePoolType } from 'slonik';
import { sql } from './types';
import { Foo } from './generated';

export interface Gateway {
  getFoo: (fooId: string) => Promise<Foo>;
}

export function createDatabaseGateway(pool: DatabasePoolType): Gateway {
  return {
    getFoo: (id: string) => pool.one(sql.Foo`SELECT * FROM foo WHERE id = ${id}`),
  };
}
