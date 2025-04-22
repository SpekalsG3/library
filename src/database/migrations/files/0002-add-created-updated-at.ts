import { Migration } from "../cli/types";
import {IDBAdapter} from "../../types";
import {MoviesDB} from "../../../entities/movies";
import {TvShowsDB} from "../../../entities/tv-shows";

export default <Migration> {
  name: "add-created-updated-at",
  up: async (DB: IDBAdapter) => {
    const knex = DB.getKnex();

    const now = new Date().toISOString();

    await knex.schema
      .alterTable(MoviesDB.tableName, (table) => {
        table.datetime(MoviesDB.fields.updated_at, { useTz: true }).defaultTo(now).notNullable();
        table.datetime(MoviesDB.fields.created_at, { useTz: true }).defaultTo(now).notNullable();
        table.datetime(MoviesDB.fields.updated_at, { useTz: true }).notNullable().alter();
        table.datetime(MoviesDB.fields.created_at, { useTz: true }).notNullable().alter();
      })
      .alterTable(TvShowsDB.tableName, (table) => {
        table.datetime(TvShowsDB.fields.updated_at, { useTz: true }).defaultTo(now).notNullable();
        table.datetime(TvShowsDB.fields.created_at, { useTz: true }).defaultTo(now).notNullable();
        table.datetime(TvShowsDB.fields.updated_at, { useTz: true }).notNullable().alter();
        table.datetime(TvShowsDB.fields.created_at, { useTz: true }).notNullable().alter();
      });
  },

  down: async (DB: IDBAdapter) => {
    const knex = DB.getKnex();

    await knex.schema
      .alterTable(MoviesDB.tableName, (table) => {
        table.dropColumn(MoviesDB.fields.updated_at);
        table.dropColumn(MoviesDB.fields.created_at);
      })
      .alterTable(TvShowsDB.tableName, (table) => {
        table.dropColumn(TvShowsDB.fields.updated_at);
        table.dropColumn(TvShowsDB.fields.created_at);
      });
  }
}
