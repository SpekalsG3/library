import { CliCommand, CliOptions } from "../types";
import { MigrationsList } from "../../files";
import {IDBAdapter} from "../../../types";

async function execute(name: string, db: IDBAdapter): Promise<void> {
  const history = await db.migrationsAll();

  let count = 0;
  const migrationToIndex: { [name: string]: number } = {};
  for (let i = 0; i < MigrationsList.length; i++) {
    const migration = MigrationsList[i];
    if (migration.name in migrationToIndex) {
      throw new Error(`Already executed migration with the name "${migration.name}" with index ${i}`)
    }
    migrationToIndex[migration.name] = i;

    if (i < history.length) {
      if (history[i].public_id !== migration.name) {
        throw new Error(`Order of migrations does not match migration history (${history[i].public_id} != ${migration.name})`)
      } else {
        continue
      }
    }

    await db.begin();
    try {
      await db.migrationsCreate(migration.name);

      await migration.up(db);

      await db.commit();
    } catch (e) {
      await db.rollback();
      throw e;
    }

    console.log(`[${name}] Executed migration "${migration.name}"`);
    count += 1;
  }

  if (count === 0) {
    console.log(`[${name}] Executed ${count} migrations`);
  }
}

export const RunCommand: CliCommand = {
  description: "Run migrations",
  subcommands: {},

  getOptionsHelp(): CliOptions {
    return {};
  },

  async handler(db: IDBAdapter, name: string, argv: string[]): Promise<void> {
    const unknownOptions = [];
    for (let i = 0; i < argv.length; i++) {
      if (argv[i].startsWith('-')) {
        unknownOptions.push(argv)
      }
    }
    if (unknownOptions.length > 0) {
      throw new Error(`Unknown options: ${unknownOptions.join(', ')}`)
    }

    {
      const setLock = await db.migrationsSetLock(true)
      if (!setLock) {
        throw new Error("Failed to set migration lock");
      }
    }

    let error = null;
    try {
      await execute(name, db);
    } catch (e) {
      error = e;
    }

    {
      const freeLock = await db.migrationsSetLock(false)
      if (!freeLock) {
        throw new Error("Failed to free migration lock");
      }
    }

    if (error !== null) {
      throw error;
    }
  }
}
