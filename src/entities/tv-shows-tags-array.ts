import { DBEntityManager, EDBFieldTypes } from "./interface";

export const TVShowsTagsDB = new DBEntityManager(
  "tv_shows_tags_array",
  {
    id: "id",
    tv_show_id: "tv_show_id",
    tag_id: "tag_id",
  } as const,
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
      isPrimaryKey: true,
    },
    tv_show_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    tag_id: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
  },
);
