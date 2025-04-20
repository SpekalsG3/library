import { DBEntityManager, EDBFieldTypes } from "./interface";

export const MoviesTagsDBManager = new DBEntityManager(
  "movies_tags_array",
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
