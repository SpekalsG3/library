import {Knex} from "knex";

export interface IStorageMigration {
  id: number;
  public_id: string;
  timestamp: Date;
}

export interface IStorageAdapter {
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
  migrationsAll(): Promise<IStorageMigration[]>;
  migrationsSetLock(lock: boolean): Promise<boolean>;

  migrationsCreate(publicId: string): Promise<void>;
  migrationsDelete(publicId: string): Promise<number>;
}
