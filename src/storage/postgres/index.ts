import { Knex } from "knex";
import {IStorageAdapter} from "../types";
import {IMigrationHistory, MigrationHistory, MigrationLock} from "../entities";

export interface IOptionsPG {
  user: string,
  password: string,
  host: string,
  port: number,
  dbName: string,
}

export class StoragePG implements IStorageAdapter {
  private readonly schema = "public";
  private readonly knex: Knex
  private tx: Knex.Transaction | null

  public constructor(options: IOptionsPG) {
    this.tx = null;
    this.knex = require('knex')({
      client: "pg",
      connection: {
        user: options.user,
        password: options.password,
        host: options.host,
        port: options.port,
        db: options.dbName,
      }
    });
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
      .createTable(MigrationHistory.name, (table) => {
        table
          .increments(MigrationHistory.c.id)
          .primary()
          .notNullable();
        table
          .string(MigrationHistory.c.public_id)
          .unique()
          .notNullable();
        table
          .timestamp(MigrationHistory.c.timestamp, {
            useTz: true,
          })
          .notNullable();
      })
      .createTable(MigrationLock.name, (table) => {
        table
          .boolean(MigrationLock.c.is_locked)
          .notNullable()
          .unique();
      });
    return this.getKnex()(MigrationLock.name).insert({
      [MigrationLock.c.is_locked]: false,
    })
  }

  public async migrationsAll(): Promise<IMigrationHistory[]> {
    try {
      return this.getKnex()(MigrationHistory.name)
    } catch (e) {
      // if (e instanceof TableNotFoundException) {
      //   return []
      // }

      throw e
    }
  }

  public async migrationsSetLock(lock: boolean): Promise<boolean> {
    const res = await this.getKnex()(MigrationLock.name)
      .update({
        [MigrationLock.c.is_locked]: lock,
      })
      .where({
        [MigrationLock.c.is_locked]: !lock,
      });
    return res == 1;
  }

  public async migrationsCreate(publicId: string): Promise<void> {
    return this.getKnex()(MigrationHistory.name)
      .insert({
        [MigrationHistory.c.public_id]: publicId,
        [MigrationHistory.c.timestamp]: new Date(),
      });
  }

  public async migrationsDelete(publicId: string): Promise<number> {
    return this.getKnex()(MigrationHistory.name)
      .delete()
      .where({
        [MigrationHistory.c.public_id]: publicId,
      });
  }
}
