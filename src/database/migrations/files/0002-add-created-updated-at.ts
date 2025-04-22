import { Migration } from "../cli/types";
import {IDBAdapter} from "../../types";
import {MoviesDB} from "../../../entities/movies";
import {TvShowsDB} from "../../../entities/tv-shows";

export default <Migration> {
  name: "add-created-updated-at",
  up: async (DB: IDBAdapter) => {
    const knex = DB.getKnex();

    const now = Date.now();

    await knex.schema
      .withSchema(DB.schema)
      .alterTable(MoviesDB.tableName, (table) => {
        // table.datetime(MoviesDB.fields.updated_at).defaultTo(now).notNullable();
        table.bigint(MoviesDB.fields.updated_at).defaultTo(now).notNullable();
        table.bigint(MoviesDB.fields.created_at).defaultTo(now).notNullable();
        table.bigint(MoviesDB.fields.updated_at).notNullable().alter();
        table.bigint(MoviesDB.fields.created_at).notNullable().alter();
      })
    await knex.schema
      .withSchema(DB.schema)
      .alterTable(TvShowsDB.tableName, (table) => {
        // table.datetime(TvShowsDB.fields.updated_at).defaultTo(now).notNullable();
        table.bigint(TvShowsDB.fields.updated_at).defaultTo(now).notNullable();
        table.bigint(TvShowsDB.fields.created_at).defaultTo(now).notNullable();
        table.bigint(TvShowsDB.fields.updated_at).notNullable().alter();
        table.bigint(TvShowsDB.fields.created_at).notNullable().alter();
      });
  },

  down: async (DB: IDBAdapter) => {
    const knex = DB.getKnex();

    await knex.schema
      .withSchema(DB.schema)
      .alterTable(MoviesDB.tableName, (table) => {
        table.dropColumn(MoviesDB.fields.updated_at);
        table.dropColumn(MoviesDB.fields.created_at);
      });
    await knex.schema
      .withSchema(DB.schema)
      .alterTable(TvShowsDB.tableName, (table) => {
        table.dropColumn(TvShowsDB.fields.updated_at);
        table.dropColumn(TvShowsDB.fields.created_at);
      });
  }
}
