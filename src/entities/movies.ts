import { DBEntityManager, EDBFieldTypes } from "./interface";
import { EDataGroups } from "@api/types";
import {CTvShowGroups} from "@api/tvshows/index.p";

export const MoviesDBManager = new DBEntityManager(
  "movies",
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
          throw new Error('Unknown status')
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
      deserializeWith: (s) => s.getTime(),
      serializeWith: (s) => new Date(s as number),
    },
    updated_at: {
      dbType: EDBFieldTypes.Date,
      isNullable: false,
      deserializeWith: (s) => s.getTime(),
      serializeWith: (s) => new Date(s as number),
    },
  },
);

export type MovieDbEntity = ReturnType<typeof MoviesDBManager['getEntity']>;
export type Movie = MovieDbEntity['current'] & {
  tags: string[],
  genres: string[],
}
export type MovieEditable = Omit<Movie, 'id' | 'created_at' | 'updated_at'>;
