import { DBEntityManager, EDBFieldTypes } from "./interface";

export const CinemaTagsDB = new DBEntityManager(
  "cinema_tags",
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
  },
);
