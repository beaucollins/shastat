import { setupSlonikMigrator } from '@slonik/migrator';
import { resolve } from 'path';

import { createPool } from '../data/createPool';

const migrator = setupSlonikMigrator({
  migrationsPath: resolve(__dirname, '../data/migrations'),
  slonik: createPool(),
  mainModule: module,
});

module.exports = { migrator };
