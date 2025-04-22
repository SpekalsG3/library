import {Knex} from "knex";

import {DBKnex, EKnexClients, IKnexOptions} from "./knex";

export interface IDBMigration {
  id: number;
  public_id: string;
  timestamp: Date;
}

export interface IDBAdapter {
  try_connection(): Promise<void>;
  close(): Promise<void>;
  // TODO: this is used only in migrations because not idea how to generalize them but should
  //       can recreate Knex interface partly but damn...
  //       definitely should not write migrations per adapter
  //       will have to fix it when introducing local_storage
  getKnex(): Knex;

  begin(): Promise<void>;
  commit(): Promise<any[]>;
  rollback(): Promise<any[]>;

  migrationsInit(): Promise<void>;
  migrationsAll(): Promise<IDBMigration[]>;
  migrationsSetLock(lock: boolean): Promise<boolean>;

  migrationsCreate(publicId: string): Promise<void>;
  migrationsDelete(publicId: string): Promise<number>;
}

export enum ConnectionTypes {
  Postgres = "postgres",
  SQLite3 = "sqlite3"
}
interface ConnTypeToOpts {
  [ConnectionTypes.Postgres]: IKnexOptions[EKnexClients.Postgres],
  [ConnectionTypes.SQLite3]: IKnexOptions[EKnexClients.SQLite3],
}
export interface ConnectionOptions<T extends ConnectionTypes> {
  type: T,
  options: ConnTypeToOpts[T],
}
