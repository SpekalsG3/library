import { DBEntityManager, EDBFieldTypes } from "./interface";

export const TVShowsGenresDB = new DBEntityManager(
  "tv_shows_genres_array",
  {
    id: "id",
    tv_show_id: "tv_show_id",
    genre_id: "genre_id",
  } as const,
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
