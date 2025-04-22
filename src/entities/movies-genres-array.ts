import { DBEntityManager, EDBFieldTypes } from "./interface";

export const MoviesGenresDB = new DBEntityManager(
  "movies_genres_array",
  {
    id: "id",
    movie_id: "movie_id",
    genre_id: "genre_id",
  } as const,
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
      isPrimaryKey: true,
    },
    movie_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    genre_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
  },
);
