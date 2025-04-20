import { DBEntityManager, EDBFieldTypes } from "./interface";

export const CinemaGenresDBManager = new DBEntityManager(
  "cinema_genres",
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
