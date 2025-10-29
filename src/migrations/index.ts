import * as migration_20251029_004430 from './20251029_004430';
import * as migration_20251029_010838 from './20251029_010838';
import * as migration_20251029_011231 from './20251029_011231';

export const migrations = [
  {
    up: migration_20251029_004430.up,
    down: migration_20251029_004430.down,
    name: '20251029_004430',
  },
  {
    up: migration_20251029_010838.up,
    down: migration_20251029_010838.down,
    name: '20251029_010838',
  },
  {
    up: migration_20251029_011231.up,
    down: migration_20251029_011231.down,
    name: '20251029_011231'
  },
];
