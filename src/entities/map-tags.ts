import {DBEntityManager, EDBFieldTypes} from "./interface";

export const MapTagsDB = new DBEntityManager(
  "map_tags",
  {
    id: "id",
    name: "name",
  } as const,
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isPrimaryKey: true,
      isNullable: false,
    },
    name: {
      dbType: EDBFieldTypes.String,
      isNullable: false,
    },
  },
);
export type MapTagsEntity = ReturnType<typeof MapTagsDB['getEntity']>
