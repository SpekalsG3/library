import {Handle, handler} from "@api/utils/handler";
import {MigrationsList} from "@database/migrations/files";
import {MigrationHistoryDB} from "../../../entities/migration-history";

export interface IApplyMigrationsRes {
  message: string,
  appliedMigrations: string[],
}

const post: Handle<IApplyMigrationsRes> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  await global.DB.db.begin();
  try {
    try {
      await global.DB.db.getKnex()
        .table(MigrationHistoryDB.tableName)
        .select()
        .limit(0);
    } catch (_) {
      await global.DB.db.migrationsInit();
    }
    await global.DB.db.commit();
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }

  const appliedMigrations = await global.DB.db.migrationsAll();

  let migrationIndex = 0;
  for (migrationIndex; migrationIndex < appliedMigrations.length; migrationIndex++) {
    const appliedPublicId = appliedMigrations[migrationIndex].public_id;
    const expectedPublicId = MigrationsList[0].name;
    if (appliedPublicId !== expectedPublicId) {
      throw new Error(`Migration id '${appliedPublicId}' is applied instead of listed '${expectedPublicId}' at #${migrationIndex}. Please handle it manually`);
    }
  }

  if (migrationIndex === MigrationsList.length) {
    return res.json({
      success: true,
      data: {
        message: "Already up to date!",
        appliedMigrations: [],
      },
    })
  }

  await global.DB.db.begin();

  try {
    const setLock = await global.DB.db.migrationsSetLock(true);
    if (!setLock) {
      throw new Error('Failed to acquire migration lock');
    }

    const newMigrations: string[] = [];
    for (migrationIndex; migrationIndex < MigrationsList.length; migrationIndex++) {
      const migration = MigrationsList[migrationIndex];

      await global.DB.db.migrationsCreate(migration.name);
      await migration.up(global.DB.db);
      newMigrations.push(migration.name);
    }

    const freeLock = await global.DB.db.migrationsSetLock(false);
    if (!freeLock) {
      throw new Error('Failed to free migration lock');
    }

    await global.DB.db.commit();

    return res.json({
      success: true,
      data: {
        message: "Successfully applied new migrations",
        appliedMigrations: newMigrations,
      },
    })
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }

};

export default handler({
  post,
});
