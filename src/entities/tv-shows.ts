import { DBEntityManager, EDBFieldTypes } from "./interface";
import {CTvShowGroups, EDataGroups} from "./types";

function fromSeasonList(
  s: string,
): { [season: number]: number | undefined } {
  // @ts-ignore // broken interface of .reduce
  return s
    .split(',')
    .reduce<{ [season: number]: number }>((acc, data) => {
      if (data.length > 0) {
        const [season, count] = data.split(':');
        acc[Number(season)] = Number(count);
      }
      return acc;
    }, {})
}

function toSeasonList(obj: { [season: number]: number | undefined }): string {
  return Object.keys(obj)
    .map((season) =>
      // @ts-ignore
      `${season}:${obj[season]}`)
    .join(',');
}

export const TvShowsDB = new DBEntityManager(
  "tv_shows",
  {
    id: "id",
    status: "status",
    title: "title",
    cover_url: "cover_url",
    notes: "notes",
    score: "score",
    rewatched_times: "rewatched_times",
    episodes_count: "episodes_count",
    avg_ep_len_min: "avg_ep_len_min",
    last_watched_season: "last_watched_season",
    last_watched_episode: "last_watched_episode",
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
          throw new Error('Unknown status')
        }
        return s as EDataGroups;
      },
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
      dbType: EDBFieldTypes.JSON,
      isNullable: true,
      deserializeWith: (score) => fromSeasonList(score as string),
      serializeWith: (score) => toSeasonList(score as any),
    },
    rewatched_times: {
      dbType: EDBFieldTypes.JSON,
      isNullable: true,
      deserializeWith: (score) => fromSeasonList(score as string),
      serializeWith: (score) => toSeasonList(score as any),
    },
    episodes_count: {
      dbType: EDBFieldTypes.JSON,
      isNullable: false,
      deserializeWith: (s) => (s as string).split(',').map((el: string) => Number(el)),
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

export type TVShowDb = ReturnType<typeof TvShowsDB['getEntity']>;
export type TVShowDTO = TVShowDb & {
  tags: string[],
  genres: string[],
}

export type TVShowDTOEditable = Omit<TVShowDTO, 'id' | 'created_at' | 'updated_at'>;
