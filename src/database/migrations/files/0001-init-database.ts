import { Migration } from "../cli/types";
import {IDBAdapter} from "../../types";
import {CinemaGenresDB} from "../../../entities/cinema-genres";
import {CinemaTagsDB} from "../../../entities/cinema-tags";
import {MoviesDB} from "../../../entities/movies";
import {MoviesTagsDB} from "../../../entities/movies-tags-array";
import {MoviesGenresDB} from "../../../entities/movies-genres-array";
import {TvShowsDB} from "../../../entities/tv-shows";
import {TVShowsGenresDB} from "../../../entities/tv-shows-genres-array";
import {TVShowsTagsDB} from "../../../entities/tv-shows-tags-array";
import {CMovieGroups, CTvShowGroups} from "../../../entities/types";

export default <Migration> {
  name: "init-database",
  up: async (DB: IDBAdapter) => {
    const knex = DB.getKnex();

    await knex
      .schema
      .createTable(CinemaGenresDB.tableName, function (table) {
        table.increments(CinemaGenresDB.fields.id).primary().notNullable();
        table.string(CinemaGenresDB.fields.name).notNullable();
      })
      .createTable(CinemaTagsDB.tableName, function (table) {
        table.increments(CinemaTagsDB.fields.id).primary().notNullable();
        table.string(CinemaTagsDB.fields.name).notNullable();
      })
      .createTable(MoviesDB.tableName, function (table) {
        table.increments(MoviesDB.fields.id).primary().notNullable();
        table.enum(MoviesDB.fields.status, CMovieGroups).notNullable();
        table.text(MoviesDB.fields.title).notNullable();
        table.text(MoviesDB.fields.cover_url).notNullable();
        table.text(MoviesDB.fields.notes);
        table.smallint(MoviesDB.fields.len_min).notNullable();
        table.smallint(MoviesDB.fields.score);
        table.smallint(MoviesDB.fields.rewatched_times);
      })
      .createTable(MoviesGenresDB.tableName, function (table) {
        table.increments(MoviesGenresDB.fields.id).primary().notNullable();
        table.integer(MoviesGenresDB.fields.movie_id).references(`${MoviesDB.tableName}.${MoviesDB.fields.id}`).notNullable();
        table.integer(MoviesGenresDB.fields.genre_id).references(`${CinemaGenresDB.tableName}.${CinemaGenresDB.fields.id}`).notNullable();
      })
      .createTable(MoviesTagsDB.tableName, function (table) {
        table.increments(MoviesTagsDB.fields.id).primary().notNullable();
        table.integer(MoviesTagsDB.fields.movie_id).references(`${MoviesDB.tableName}.${MoviesDB.fields.id}`).notNullable();
        table.integer(MoviesTagsDB.fields.tag_id).references(`${CinemaTagsDB.tableName}.${CinemaTagsDB.fields.id}`).notNullable();
      })
      .createTable(TvShowsDB.tableName, function (table) {
        table.increments(TvShowsDB.fields.id).primary().notNullable();
        table.enum(TvShowsDB.fields.status, CTvShowGroups).notNullable();
        table.text(TvShowsDB.fields.title).notNullable();
        table.text(TvShowsDB.fields.cover_url).notNullable();
        table.text(TvShowsDB.fields.notes);
        table.smallint(TvShowsDB.fields.avg_ep_len_min).notNullable();
        table.string(TvShowsDB.fields.score);
        table.string(TvShowsDB.fields.rewatched_times);
        table.string(TvShowsDB.fields.episodes_count);
        table.smallint(TvShowsDB.fields.last_watched_season);
        table.smallint(TvShowsDB.fields.last_watched_episode);
      })
      .createTable(TVShowsGenresDB.tableName, function (table) {
        table.increments(TVShowsGenresDB.fields.id).primary().notNullable();
        table.integer(TVShowsGenresDB.fields.tv_show_id).references(`${TvShowsDB.tableName}.${TvShowsDB.fields.id}`).notNullable();
        table.integer(TVShowsGenresDB.fields.genre_id).references(`${CinemaGenresDB.tableName}.${CinemaGenresDB.fields.id}`).notNullable();
      })
      .createTable(TVShowsTagsDB.tableName, function (table) {
        table.increments(TVShowsTagsDB.fields.id).primary().notNullable();
        table.integer(TVShowsTagsDB.fields.tv_show_id).references(`${TvShowsDB.tableName}.${TvShowsDB.fields.id}`).notNullable();
        table.integer(TVShowsTagsDB.fields.tag_id).references(`${CinemaTagsDB.tableName}.${CinemaTagsDB.fields.id}`).notNullable();
      });
  },

  down: async (DB: IDBAdapter) => {
    const knex = DB.getKnex();

    await knex.schema
      .dropTable(MoviesGenresDB.tableName)
      .dropTable(MoviesTagsDB.tableName)
      .dropTable(MoviesDB.tableName)
      .dropTable(TVShowsGenresDB.tableName)
      .dropTable(TVShowsTagsDB.tableName)
      .dropTable(TvShowsDB.tableName)
      .dropTable(CinemaGenresDB.tableName)
      .dropTable(CinemaTagsDB.tableName)
  }
}
