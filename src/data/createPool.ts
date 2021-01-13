import { createPool as createSlonikPool, DatabasePoolType } from 'slonik';
import { poolConfig } from './types';

const ENV_KEY_NAME = 'POSTGRES_CONNECTION_STRING';

export function createPool(): DatabasePoolType {
  const connectionString = process.env[ENV_KEY_NAME];

  if (connectionString == null) {
    throw new Error(`${ENV_KEY_NAME} not present, cannot create database connection pool.`);
  }
  return createSlonikPool(connectionString, poolConfig);
}
