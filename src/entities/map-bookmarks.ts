import {DBEntityManager, EDBFieldTypes} from "./interface";

export const MapBookmarksDB = new DBEntityManager(
  "map_bookmarks",
  {
    id: "id",
    lat: "lat",
    lng: "lng",
    title: "title",
    notes: "notes",
    created_at: "created_at",
    updated_at: "updated_at",
  } as const,
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isPrimaryKey: true,
      isNullable: false,
    },
    lat: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    lng: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    title: {
      dbType: EDBFieldTypes.String,
      isNullable: true,
    },
    notes: {
      dbType: EDBFieldTypes.String,
      isNullable: true,
    },
    created_at: {
      dbType: EDBFieldTypes.Date,
      isNullable: false,
      deserializeWith: (s) => new Date(s as string).toISOString(),
      serializeWith: (s) => s.toISOString(),
    },
    updated_at: {
      dbType: EDBFieldTypes.Date,
      isNullable: false,
      deserializeWith: (s) => new Date(s as string).toISOString(),
      serializeWith: (s) => s.toISOString(),
    },
  },
);

export type MapBookmarksEntity = ReturnType<typeof MapBookmarksDB['getEntity']>
export type MapBookmarksDTO = MapBookmarksEntity & {
  tags: string[],
}

export type MapBookmarksDTOEditable = Omit<MapBookmarksDTO, 'id' | 'created_at' | 'updated_at'>
