import { createPool as createSlonikPool, DatabasePoolType } from 'slonik';
import { poolConfig } from './types';

export function createPool(): DatabasePoolType {
  return createSlonikPool(process.env.POSTGRES_CONNECTION_STRING!, poolConfig);
}
