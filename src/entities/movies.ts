import { DBEntityManager, EDBFieldTypes } from "./interface";
import { EDataGroups } from "@api/types";
import {CTvShowGroups} from "@api/tvshows/index.p";

export const MoviesDB = new DBEntityManager(
  "movies",
  {
    id: "id",
    status: "status",
    title: "title",
    cover_url: "cover_url",
    notes: "notes",
    score: "score",
    rewatched_times: "rewatched_times",
    len_min: "len_min",
    created_at: "created_at",
    updated_at: "updated_at",
  } as const,
  {
    id: {
      dbType: EDBFieldTypes.Integer,
      isPrimaryKey: true,
      isNullable: false,
    },
    status: {
      dbType: EDBFieldTypes.String,
      isNullable: false,
      deserializeWith: (s) => {
        if (!CTvShowGroups.includes(s as any)) {
          throw new Error('Unknown status');
        }
        return s as EDataGroups;
      }
    },
    title: {
      dbType: EDBFieldTypes.String,
      isNullable: false,
    },
    cover_url: {
      dbType: EDBFieldTypes.String,
      isNullable: false,
    },
    notes: {
      dbType: EDBFieldTypes.String,
      isNullable: true,
    },
    score: {
      dbType: EDBFieldTypes.Integer,
      isNullable: true,
    },
    rewatched_times: {
      dbType: EDBFieldTypes.Integer,
      isNullable: true,
    },
    len_min: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    created_at: {
      dbType: EDBFieldTypes.Date,
      isNullable: false,
      deserializeWith: (s) => new Date(s as number),
      serializeWith: (s) => s.getTime(),
    },
    updated_at: {
      dbType: EDBFieldTypes.Date,
      isNullable: false,
      deserializeWith: (s) => new Date(s as number),
      serializeWith: (s) => s.getTime(),
    },
  },
);

export type MovieDbEntity = ReturnType<typeof MoviesDB['getEntity']>;
export type MovieDTO = MovieDbEntity & {
  tags: string[],
  genres: string[],
}
export type MovieDTOEditable = Omit<MovieDTO, 'id' | 'created_at' | 'updated_at'>;
