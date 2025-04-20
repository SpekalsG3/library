import { Database } from "sqlite";
import { Migration } from "../cli/types";

export default <Migration> {
  name: "add-created-updated-at",
  up: async (DB: Database) => {
    const now = Date.now();

    await DB.run("ALTER TABLE movies ADD created_at INTEGER");
    await DB.run("ALTER TABLE movies ADD updated_at INTEGER");
    await DB.run(`UPDATE movies SET created_at = ${now} + id, updated_at = ${now} + id`);

    await DB.run("ALTER TABLE tv_shows ADD created_at INTEGER");
    await DB.run("ALTER TABLE tv_shows ADD updated_at INTEGER");
    await DB.run(`UPDATE tv_shows SET created_at = ${now} + id, updated_at = ${now} + id`);

    // set these columns to not null via some scary sql
    await DB.run("PRAGMA writable_schema = 1");

    const moviesSQL = "CREATE TABLE movies (" +
      "id INTEGER PRIMARY KEY NOT NULL" +
      ",status TEXT NOT NULL" +
      ",title TEXT NOT NULL" +
      ",cover_url TEXT NOT NULL" +
      ",notes TEXT" +
      ",score INTEGER" +
      ",rewatched_times INTEGER" +
      ",len_min INTEGER NOT NULL" +
      ",created_at INTEGER NOT NULL" +
      ",updated_at INTEGER NOT NULL" +
      ")";
    await DB.run(`UPDATE SQLITE_MASTER SET sql = "${moviesSQL}" WHERE name = "movies"`);

    const tvShowsSQl = "CREATE TABLE tv_shows (" +
      "id INTEGER PRIMARY KEY NOT NULL" +
      ",status TEXT NOT NULL" +
      ",title TEXT NOT NULL" +
      ",cover_url TEXT NOT NULL" +
      ",notes TEXT" +
      ",score TEXT" + // example: `1:9,5:10` meaning season 1 score 9 and season 5 score 10
      ",rewatched_times TEXT" + // example: `1:9,5:10`
      ",episodes_count TEXT" + // example: `1:9,5:10`
      ",avg_ep_len_min INTEGER NOT NULL" +
      ",last_watched_season INTEGER" +
      ",last_watched_episode INTEGER" +
      ",created_at INTEGER NOT NULL" +
      ",updated_at INTEGER NOT NULL" +
      ")";
    await DB.run(`UPDATE SQLITE_MASTER SET sql = "${tvShowsSQl}" WHERE name = "tv_shows"`);

    await DB.run("PRAGMA writable_schema = 0");
  },

  down: async (DB: Database) => {
    await DB.run("ALTER TABLE movies DROP created_at");
    await DB.run("ALTER TABLE movies DROP updated_at");

    await DB.run("ALTER TABLE tv_shows DROP created_at");
    await DB.run("ALTER TABLE tv_shows DROP updated_at");
  }
}
