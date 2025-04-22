import { DBEntityManager, EDBFieldTypes } from "./interface";

export const TVShowsGenresDBManager = new DBEntityManager(
  "tv_shows_genres_array",
  {
    id: "id",
    tv_show_id: "tv_show_id",
    genre_id: "genre_id",
  },
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
      isPrimaryKey: true,
    },
    tv_show_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    genre_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
  },
);
