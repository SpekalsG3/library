import { DBEntityManager, EDBFieldTypes } from "./interface";

export const MoviesTagsDB = new DBEntityManager(
  "movies_tags_array",
  {
    id: "id",
    movie_id: "movie_id",
    tag_id: "tag_id",
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
    tag_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
  },
);
