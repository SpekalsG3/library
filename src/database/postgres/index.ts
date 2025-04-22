import { knex, Knex } from "knex";
import {IDBAdapter} from "../types";
import {MigrationHistoryDB, MigrationHistoryDBEntity} from "../../entities/migration-history";
import {MigrationLockDB} from "../../entities/migration-lock";

export interface IOptionsPG {
  user: string,
  password: string,
  host: string,
  port: number,
  dbName: string,
}

export interface IOptionsSQLite3 {
  filename: string,
  flags?: string[],
  debug?: boolean,
}

export enum EKnexClients {
  Postgres = "pg",
  SQLite3 = "sqlite3",
}

export interface IKnexOptions {
  [EKnexClients.Postgres]: IOptionsPG,
  [EKnexClients.SQLite3]: IOptionsSQLite3,
}

export class DBKnex<T extends EKnexClients> implements IDBAdapter {
  public readonly schema = "public";
  private readonly knex: Knex
  private tx: Knex.Transaction | null

  public constructor(
    client: T,
    opts: IKnexOptions[T],
  ) {
    this.tx = null;
    this.knex = knex({
      client: client,
      connection: opts,
    });
  }
  public async try_connection(): Promise<void> {
    return this.knex.select(this.knex.raw('true')) as Promise<any>;
  }
  public async close(): Promise<void> {
    return this.knex.destroy();
  }
  public getKnex(): Knex {
    return this.tx ?? this.knex;
  }

  public async begin(): Promise<void> {
    this.tx = await this.knex.transaction();
  }
  public async commit(): Promise<any[]> {
    if (!this.tx) {
      throw new Error("no PG transaction to commit");
    }
    const res = await this.tx.commit();
    this.tx = null;
    return res;
  }
  public async rollback(): Promise<any[]> {
    if (!this.tx) {
      throw new Error("no PG transaction to rollback");
    }
    const res = await this.tx.rollback();
    this.tx = null;
    return res;
  }

  public async migrationsInit(): Promise<void> {
    await this.getKnex()
      .schema
      .withSchema(this.schema)
      .createTable(MigrationHistoryDB.tableName, (table) => {
        table
          .increments(MigrationHistoryDB.fields.id)
          .primary()
          .notNullable();
        table
          .string(MigrationHistoryDB.fields.public_id)
          .unique()
          .notNullable();
        table
          .timestamp(MigrationHistoryDB.fields.timestamp, {
            useTz: true,
          })
          .notNullable();
      })
      .createTable(MigrationLockDB.tableName, (table) => {
        table
          .boolean(MigrationLockDB.fields.is_locked)
          .notNullable()
          .unique();
      });
    return this.getKnex()(MigrationLockDB.tableName).insert({
      [MigrationLockDB.fields.is_locked]: false,
    })
  }

  public async migrationsAll(): Promise<MigrationHistoryDBEntity[]> {
    try {
      return await this.getKnex()(MigrationHistoryDB.tableName)
        .orderBy(MigrationHistoryDB.fields.id, "asc")
    } catch (e) {
      // if (e instanceof TableNotFoundException) {
      //   return []
      // }

      throw e
    }
  }

  public async migrationsSetLock(lock: boolean): Promise<boolean> {
    const res = await this.getKnex()(MigrationLockDB.tableName)
      .update({
        [MigrationLockDB.fields.is_locked]: lock,
      })
      .where({
        [MigrationLockDB.fields.is_locked]: !lock,
      });
    return res == 1;
  }

  public async migrationsCreate(publicId: string): Promise<void> {
    return this.getKnex()(MigrationHistoryDB.tableName)
      .insert({
        [MigrationHistoryDB.fields.public_id]: publicId,
        [MigrationHistoryDB.fields.timestamp]: new Date(),
      });
  }

  public async migrationsDelete(publicId: string): Promise<number> {
    return this.getKnex()(MigrationHistoryDB.tableName)
      .delete()
      .where({
        [MigrationHistoryDB.fields.public_id]: publicId,
      });
  }
}
