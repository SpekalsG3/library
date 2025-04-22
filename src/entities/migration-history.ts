import {DBEntityManager, EDBFieldTypes} from "./interface";

export const MigrationHistoryDB = new DBEntityManager(
  "migration_history",
  {
    id: "id",
    public_id: "public_id",
    timestamp: "timestamp",
  } as const,
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
      isPrimaryKey: true,
    },
    public_id: {
      dbType: EDBFieldTypes.String,
      isNullable: false,
    },
    timestamp: {
      dbType: EDBFieldTypes.Date,
      isNullable: false,
      deserializeWith: (s) => new Date(s as number),
      serializeWith: (s) => s.getTime(),
    },
  },
);

export type MigrationHistoryDBEntity = ReturnType<typeof MigrationHistoryDB['getEntity']>;
