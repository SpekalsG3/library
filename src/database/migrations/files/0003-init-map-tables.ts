import {Migration} from "@database/migrations/cli/types";
import {MapBmsTagsArrayDB} from "../../../entities/map-bookmarks-tags-array";
import {MapBookmarksDB} from "../../../entities/map-bookmarks";
import {MapTagsDB} from "../../../entities/map-tags";

export default <Migration> {
  name: "init-map-tables",

  async up(DB) {
    const knex = DB.getKnex();

    await knex
      .schema
      .createTable(MapBookmarksDB.tableName, (table) => {
        table.increments(MapBookmarksDB.fields.id).notNullable().primary();
        table.float(MapBookmarksDB.fields.lat).notNullable();
        table.float(MapBookmarksDB.fields.lng).notNullable();
        table.text(MapBookmarksDB.fields.title);
        table.text(MapBookmarksDB.fields.notes);
        table.datetime(MapBookmarksDB.fields.updated_at, { useTz: true }).notNullable();
        table.datetime(MapBookmarksDB.fields.created_at, { useTz: true }).notNullable();
      })
      .createTable(MapTagsDB.tableName, (table) => {
        table.increments(MapTagsDB.fields.id).notNullable().primary();
        table.text(MapTagsDB.fields.name).notNullable().unique();
      })
      .createTable(MapBmsTagsArrayDB.tableName, (table) => {
        table.increments(MapBmsTagsArrayDB.fields.id).notNullable().primary();
        table.integer(MapBmsTagsArrayDB.fields.map_bm_id).notNullable();
        table.integer(MapBmsTagsArrayDB.fields.map_tag_id).notNullable();
      });
  },

  async down(DB) {
    const knex = DB.getKnex();

    await knex
      .schema
      .dropTable(MapBookmarksDB.tableName)
      .dropTable(MapTagsDB.tableName)
      .dropTable(MapBmsTagsArrayDB.tableName);
  },
}
