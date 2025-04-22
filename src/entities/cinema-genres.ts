import { DBEntityManager, EDBFieldTypes } from "./interface";

export const CinemaGenresDB = new DBEntityManager(
  "cinema_genres",
  {
    id: "id",
    name: "name",
  } as const,
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
  } as const,
);
