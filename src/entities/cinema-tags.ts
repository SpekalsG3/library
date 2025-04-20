import { DBEntityManager, EDBFieldTypes } from "./interface";

export const CinemaTagsDBManager = new DBEntityManager(
  "cinema_tags",
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
      isPrimaryKey: true,
    },
    name: {
      dbType: EDBFieldTypes.String,
      isNullable: false,
    },
  },
);
