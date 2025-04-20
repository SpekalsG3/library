// Get rid of magic strings because column names are often reused in multiple places

interface Table<Schema extends Record<string, any>> {
  name: string,
  c: {
    [K in keyof Schema]: string
  },
}

export interface IMigrationHistory {
  id: number;
  public_id: string;
  timestamp: Date;
}
export const MigrationHistory: Table<IMigrationHistory> = {
  name: "migration_history",
  c: {
    id: "id",
    public_id: "public_id",
    timestamp: "timestamp",
  },
}

export interface IMigrationLock {
  is_locked: boolean,
}
export const MigrationLock: Table<IMigrationLock> = {
  name: "migration_lock",
  c: {
    is_locked: "is_locked",
  },
}
