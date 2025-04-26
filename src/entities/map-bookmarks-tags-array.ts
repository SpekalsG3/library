import {DBEntityManager, EDBFieldTypes} from "./interface";

export const MapBmsTagsArrayDB = new DBEntityManager(
  "map_bms_tags_array",
  {
    id: "id",
    map_bm_id: "map_bm_id",
    map_tag_id: "map_tag_id",
  } as const,
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isPrimaryKey: true,
      isNullable: false,
    },
    map_bm_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    map_tag_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
  },
);

export type MapBmsTagsArrayEntity = ReturnType<typeof MapBmsTagsArrayDB['getEntity']>;
