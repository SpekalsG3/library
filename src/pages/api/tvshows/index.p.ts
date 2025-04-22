import {Handle, handler} from '../utils/handler'
import { runChecks } from '../utils/run-checks';
import { isValidUrl } from "../utils/is-valid-url";
import { TVShowDTO, TVShowDTOEditable, TvShowsDB } from "../../../entities/tv-shows";
import { CinemaGenresDB } from "../../../entities/cinema-genres";
import { CinemaTagsDB } from "../../../entities/cinema-tags";
import { DBEntityManager } from "../../../entities/interface";
import { TVShowsGenresDB } from "../../../entities/tv-shows-genres-array";
import { TVShowsTagsDB } from "../../../entities/tv-shows-tags-array";
import {CTvShowGroups, EDataGroups} from "../../../entities/types";

const get: Handle<{
  [id: number]: TVShowDTO,
}> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const status = req.query.status as EDataGroups;
  runChecks([
    [CTvShowGroups.includes(status), `'req.query.status' has to be one of '${CTvShowGroups.join("','")}'`],
  ]);

  if (typeof status !== "string") {
    throw new Error("expected string for param 'status'");
  }

  const tvshows = await global.DB.db.getKnex()
    .table(TvShowsDB.tableName)
    .select()
    .where({
      [TvShowsDB.fields.status]: status,
    });
  const genresAll = await global.DB.db.getKnex()
    .table(TVShowsGenresDB.tableName)
    .select<[{
      tvShowId: number,
      name: string,
    }]>(
      `${TVShowsGenresDB.tableName}.${TVShowsGenresDB.fields.tv_show_id} as tvShowId`,
      `${CinemaGenresDB.tableName}.${CinemaGenresDB.fields.name} as name`,
    )
    .innerJoin(
      CinemaGenresDB.tableName,
      `${TVShowsGenresDB.tableName}.${TVShowsGenresDB.fields.genre_id}`,
      '=',
      `${CinemaGenresDB.tableName}.${CinemaGenresDB.fields.id}`,
    );
  const tagsAll = await global.DB.db.getKnex()
    .table(TVShowsTagsDB.tableName)
    .select<[{
      tvShowId: number,
      name: string,
    }]>(
      `${TVShowsTagsDB.tableName}.${TVShowsTagsDB.fields.tv_show_id} as tvShowId`,
      `${CinemaTagsDB.tableName}.${CinemaTagsDB.fields.name} as name`,
    )
    .innerJoin(
      CinemaTagsDB.tableName,
      `${TVShowsTagsDB.tableName}.${TVShowsTagsDB.fields.tag_id}`,
      '=',
      `${CinemaTagsDB.tableName}.${CinemaTagsDB.fields.id}`,
    );

  const genres = genresAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
    const arr = acc[data.tvShowId];
    if (arr) {
      arr.push(data.name)
    } else {
      acc[data.tvShowId] = [data.name];
    }
    return acc;
  }, {});
  const tags = tagsAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
    const arr = acc[data.tvShowId];
    if (arr) {
      arr.push(data.name)
    } else {
      acc[data.tvShowId] = [data.name];
    }
    return acc;
  }, {});

  const data = tvshows.reduce<{
    [id: number]: TVShowDTO,
  }>((acc, raw) => {
    const data = TvShowsDB.fromDb(raw);
    acc[data.id] = {
      ...data,
      tags: tags[data.id] ?? [],
      genres: genres[data.id] ?? [],
    };
    return acc;
  }, {});
  res
    .status(200)
    .send({
      success: true,
      data: data,
    });
}

export function validateEditItemData(item: Partial<TVShowDTOEditable>): TVShowDTOEditable {
  runChecks([
    [item !== undefined, `'body.item_data' has to be json`],
    [item.status !== undefined && CTvShowGroups.includes(item.status), `'item.status' has to be one of '${CTvShowGroups.join("','")}'`],
    [typeof item.title === 'string' && item.title.length > 0, `'item.title' has to be non zero length`],
    [typeof item.cover_url === 'string' && isValidUrl(item.cover_url), `'item.cover_url' has to be a valid URL`],
    [!(item.genres as unknown[])?.find((el) => !(typeof el === "string" && el.length > 0)), `'item.genres' has to be either undefined or an array of strings`],
    [!(item.tags as unknown[])?.find((el) => !(typeof el === "string" && el.length > 0)), `'item.genres' has to be either undefined or an array of strings`],
    [typeof item.avg_ep_len_min === 'number' && !isNaN(item.avg_ep_len_min), `'item.episode_len_min' has to be a valid number`],
    [Array.isArray(item.episodes_count) && (item.episodes_count.find(el => isNaN(el)) === undefined), `'item.episodes_count' has to be an array of numbers`]
  ]);

  return {
    status: item.status!,
    title: item.title!,
    cover_url: item.cover_url!,
    genres: item.genres ?? [],
    tags: item.tags ?? [],
    notes: item.notes ?? "",
    score: item.score ?? null,
    rewatched_times: item.rewatched_times ?? null,
    episodes_count: item.episodes_count!,
    avg_ep_len_min: item.avg_ep_len_min!,
    last_watched_episode: item.last_watched_episode ?? null,
    last_watched_season: item.last_watched_season ?? null,
  }
}

export interface ICreateTvSHowItemReq {
  item: TVShowDTOEditable,
}

function validateCreateBody (body: ICreateTvSHowItemReq): ICreateTvSHowItemReq {
  return {
    item: validateEditItemData(body.item),
  }
}

const post: Handle<number> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const now = new Date();

  const body = validateCreateBody(req.body);

  await global.DB.db.begin();

  let tvshowId: number;
  try {
    const {
      genres: dtoGenres,
      tags: dtoTags,
      ...dto
    } = body.item;

    const [result] = await global.DB.db.getKnex()
      .table(TvShowsDB.tableName)
      .insert(TvShowsDB.toDb({
        ...dto,
        created_at: now,
        updated_at: now,
      }))
      .returning<[{ id: number }]>(`${TvShowsDB.fields.id} as id`);
    tvshowId = result.id;

    const updateArray = async <T extends Record<string, number>>(
      request: string[],
      sourceManager: DBEntityManager<{ id: string, name: string }, any, { id: number, name: string }>,
      arrayTable: DBEntityManager<{ [key in keyof T]: string }, any, any>,
      f: (toId: number) => T,
    ) => {
      if (request.length > 0) {
        const knex = global.DB!.db.getKnex();

        const listRaw = await knex
          .table(sourceManager.tableName)
          .select<[{
            id: number,
            name: number,
          }]>(`${sourceManager.fields.id} as id`, `${sourceManager.fields.name} as name`);

        const listByName = listRaw.reduce<{ [name: string]: number | undefined }>((acc, el) => {
          acc[el.name] = el.id;
          return acc;
        }, {});

        const listInserts: T[] = [];
        for (const listNameRaw of request) {
          const listName = listNameRaw.toLowerCase();
          let listId = listByName[listName];
          if (listId === undefined) {
            const [e] = await knex
              .table(sourceManager.tableName)
              .insert({
                [sourceManager.fields.name]: listName,
              })
              .returning<[{ id: number }]>(`${sourceManager.fields.id} as id`);
            listId = e.id;
            listByName[listName] = listId;
          }
          listInserts.push(f(listId));
        }

        await knex
          .table(arrayTable.tableName)
          .insert(listInserts);
      }
    }

    await updateArray(body.item.genres, CinemaGenresDB, TVShowsGenresDB, (id) => ({ tv_show_id: tvshowId, genre_id: id, }));
    await updateArray(body.item.tags,  CinemaTagsDB, TVShowsTagsDB, (id) => ({ tv_show_id: tvshowId, tag_id: id, }));
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }

  await global.DB.db.commit();

  res.status(200).send({
    success: true,
    data: tvshowId,
  });
}

export default handler({
  "get": get,
  "post": post,
})
