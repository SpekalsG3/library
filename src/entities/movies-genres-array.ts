import { DBEntityManager, EDBFieldTypes } from "./interface";

export const MoviesGenresDBManager = new DBEntityManager(
  "movies_genres_array",
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
