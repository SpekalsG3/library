import { Migration } from "../cli/types";
import {IStorageAdapter} from "../../types";

export default <Migration> {
  name: "add-created-updated-at",
  up: async (DB: IStorageAdapter) => {
    const knex = DB.getKnex();

    const now = Date.now();

    await knex.raw("ALTER TABLE movies ADD created_at INTEGER");
    await knex.raw("ALTER TABLE movies ADD updated_at INTEGER");
    await knex.raw(`UPDATE movies SET created_at = ${now} + id, updated_at = ${now} + id`);

    await knex.raw("ALTER TABLE tv_shows ADD created_at INTEGER");
    await knex.raw("ALTER TABLE tv_shows ADD updated_at INTEGER");
    await knex.raw(`UPDATE tv_shows SET created_at = ${now} + id, updated_at = ${now} + id`);

    // Postgres
    await knex.raw("ALTER TABLE movies " +
      "ALTER COLUMN created_at SET NOT NULL" +
      ", ALTER COLUMN updated_at SET NOT NULL");
    await knex.raw("ALTER TABLE tv_shows " +
      "ALTER COLUMN created_at SET NOT NULL" +
      ", ALTER COLUMN updated_at SET NOT NULL");

    // TODO: SQLite3
    // set these columns to not null via some scary sql
    // await knex.raw("PRAGMA writable_schema = 1");
    //
    // const moviesSQL = "CREATE TABLE movies (" +
    //   "id INTEGER PRIMARY KEY NOT NULL" +
    //   ",status TEXT NOT NULL" +
    //   ",title TEXT NOT NULL" +
    //   ",cover_url TEXT NOT NULL" +
    //   ",notes TEXT" +
    //   ",score INTEGER" +
    //   ",rewatched_times INTEGER" +
    //   ",len_min INTEGER NOT NULL" +
    //   ",created_at INTEGER NOT NULL" +
    //   ",updated_at INTEGER NOT NULL" +
    //   ")";
    // await knex.raw(`UPDATE SQLITE_MASTER SET sql = "${moviesSQL}" WHERE name = "movies"`);
    //
    // const tvShowsSQl = "CREATE TABLE tv_shows (" +
    //   "id INTEGER PRIMARY KEY NOT NULL" +
    //   ",status TEXT NOT NULL" +
    //   ",title TEXT NOT NULL" +
    //   ",cover_url TEXT NOT NULL" +
    //   ",notes TEXT" +
    //   ",score TEXT" + // example: `1:9,5:10` meaning season 1 score 9 and season 5 score 10
    //   ",rewatched_times TEXT" + // example: `1:9,5:10`
    //   ",episodes_count TEXT" + // example: `1:9,5:10`
    //   ",avg_ep_len_min INTEGER NOT NULL" +
    //   ",last_watched_season INTEGER" +
    //   ",last_watched_episode INTEGER" +
    //   ",created_at INTEGER NOT NULL" +
    //   ",updated_at INTEGER NOT NULL" +
    //   ")";
    // await knex.raw(`UPDATE SQLITE_MASTER SET sql = "${tvShowsSQl}" WHERE name = "tv_shows"`);

    // await knex.raw("PRAGMA writable_schema = 0");
  },

  down: async (DB: IStorageAdapter) => {
    const knex = DB.getKnex();

    await knex.raw("ALTER TABLE movies DROP COLUMN created_at");
    await knex.raw("ALTER TABLE movies DROP COLUMN updated_at");

    await knex.raw("ALTER TABLE tv_shows DROP COLUMN created_at");
    await knex.raw("ALTER TABLE tv_shows DROP COLUMN updated_at");
  }
}
