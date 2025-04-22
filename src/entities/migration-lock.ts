import {DBEntityManager, EDBFieldTypes} from "./interface";

export const MigrationLockDB = new DBEntityManager(
  "migration_lock",
  {
    is_locked: "is_locked",
  } as const,
  {
    is_locked: {
      dbType: EDBFieldTypes.Boolean,
      isNullable: false,
      isPrimaryKey: true,
    },
  },
);
