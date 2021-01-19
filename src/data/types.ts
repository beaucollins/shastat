import { setupTypeGen } from '@slonik/typegen';
import { resolve } from 'path';

import { knownTypes } from './generated';

export const { sql, poolConfig } = setupTypeGen({
  knownTypes,
  writeTypes: process.env.NODE_ENV !== 'production' && resolve(__dirname, './generated'),
});
