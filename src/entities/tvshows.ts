import { DBEntityManager, EDBFieldTypes } from "./interface";
import { CTvShowGroups, fromSeasonList, toSeasonList } from "../pages/api/tvshows/index.p";
import { EDataGroups } from "../pages/api/types";

export const TvShowDbManager = new DBEntityManager(
  "tv_shows",
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
      dbType: EDBFieldTypes.String,
      isNullable: true,
      deserializeWith: (score) => fromSeasonList(score),
      serializeWith: (score) => toSeasonList(score as any),
    },
    rewatched_times: {
      dbType: EDBFieldTypes.String,
      isNullable: true,
      deserializeWith: (score) => fromSeasonList(score),
      serializeWith: (score) => toSeasonList(score as any),
    },
    episodes_count: {
      dbType: EDBFieldTypes.String,
      isNullable: false,
      deserializeWith: (s) => s.split(',').map((el: string) => Number(el)),
      serializeWith: (s) => (s as number[]).join(','),
    },
    avg_ep_len_min: {
      dbType: EDBFieldTypes.Integer,
      isNullable: false,
    },
    last_watched_season: {
      dbType: EDBFieldTypes.Integer,
      isNullable: true,
    },
    last_watched_episode: {
      dbType: EDBFieldTypes.Integer,
      isNullable: true,
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

export type TVShowDbEntity = ReturnType<typeof TvShowDbManager['getEntity']>;
export type TVShow = TVShowDbEntity['current'] & {
  tags: string[],
  genres: string[],
}

export type TVShowEditable = Omit<TVShow, 'id' | 'created_at' | 'updated_at'>;
