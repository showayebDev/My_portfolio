import * as migration_20261011_143502_add_projects_drafts from './20261011_143502_add_projects_drafts';

export const migrations = [
  {
    up: migration_20261011_143502_add_projects_drafts.up,
    down: migration_20261011_143502_add_projects_drafts.down,
    name: '20261011_143502_add_projects_drafts'
  },
];
