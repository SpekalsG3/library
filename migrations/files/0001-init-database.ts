import { Database } from "sqlite";
import { Migration } from "../cli/types";

export default <Migration> {
  name: "init-database",
  up: async (DB: Database) => {
    await DB.run("CREATE TABLE cinema_genres (" +
      "id INTEGER PRIMARY KEY NOT NULL" +
      ",name TEXT NOT NULL" +
      ")");
    await DB.run("CREATE TABLE cinema_tags (" +
      "id INTEGER PRIMARY KEY NOT NULL" +
      ",name TEXT NOT NULL" +
      ")");

    await DB.run("CREATE TABLE movies (" +
      "id INTEGER PRIMARY KEY NOT NULL" +
      ",status TEXT NOT NULL" +
      ",title TEXT NOT NULL" +
      ",cover_url TEXT NOT NULL" +
      ",notes TEXT" +
      ",score INTEGER" +
      ",rewatched_times INTEGER" +
      ",len_min INTEGER NOT NULL" +
      ")");
    await DB.run("CREATE TABLE movies_tags_array (" +
      "id INTEGER PRIMARY KEY" +
      ",movie_id INTEGER" +
      ",tag_id INTEGER" +
      ",FOREIGN KEY(movie_id) REFERENCES movies(id)" +
      ",FOREIGN KEY(tag_id) REFERENCES cinema_tags(id)" +
      ")");
    await DB.run("CREATE TABLE movies_genres_array (" +
      "id INTEGER PRIMARY KEY" +
      ",movie_id INTEGER" +
      ",genre_id INTEGER" +
      ",FOREIGN KEY(movie_id) REFERENCES movies(id)" +
      ",FOREIGN KEY(genre_id) REFERENCES cinema_genres(id)" +
      ")");

    await DB.run("CREATE TABLE tv_shows (" +
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
      ")");
    await DB.run("CREATE TABLE tv_shows_tags_array (" +
      "id INTEGER PRIMARY KEY" +
      ",tv_show_id INTEGER" +
      ",tag_id INTEGER" +
      ",FOREIGN KEY(tv_show_id) REFERENCES tv_shows(id)" +
      ",FOREIGN KEY(tag_id) REFERENCES cinema_tags(id)" +
      ")");
    await DB.run("CREATE TABLE tv_shows_genres_array (" +
      "id INTEGER PRIMARY KEY" +
      ",tv_show_id INTEGER" +
      ",genre_id INTEGER" +
      ",FOREIGN KEY(tv_show_id) REFERENCES tv_shows(id)" +
      ",FOREIGN KEY(genre_id) REFERENCES cinema_genres(id)" +
      ")");
  },

  down: async (DB: Database) => {
    await DB.run("DROP TABLE tv_shows_genres_array");
    await DB.run("DROP TABLE tv_shows_tags_array");
    await DB.run("DROP TABLE tv_shows");
    await DB.run("DROP TABLE movies_genres_array");
    await DB.run("DROP TABLE movies_tags_array");
    await DB.run("DROP TABLE movies");
    await DB.run("DROP TABLE cinema_genres");
    await DB.run("DROP TABLE cinema_tags");
  }
}
