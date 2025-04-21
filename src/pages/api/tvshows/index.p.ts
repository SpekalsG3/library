import type { NextApiRequest, NextApiResponse } from 'next'
import { handler } from '../utils/handler'
import { EDataGroups, IRequestResponseSuccess } from '../types';
import { runChecks } from '../utils/run-checks';
import { isValidUrl } from "../utils/is-valid-url";
import { TVShow, TVShowEditable, TvShowDbManager } from "../../../entities/tvshows";
import { CinemaGenresDBManager } from "../../../entities/cinema-genres";
import { CinemaTagsDBManager } from "../../../entities/cinema-tags";
import { DBEntityManager } from "../../../entities/interface";
import { TVShowsGenresDBManager } from "../../../entities/tv-shows-genres-array";
import { TVShowsTagsDBManager } from "../../../entities/tv-shows-tags-array";

export function fromSeasonList(
  s: string
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

export function toSeasonList(obj: { [season: number]: number | undefined }): string {
    return Object.keys(obj)
      .map((season) =>
        // @ts-ignore
        `${season}:${obj[season]}`)
      .join(',');
}

export const CTvShowGroups = [EDataGroups.planned, EDataGroups.completed, EDataGroups.dropped, EDataGroups.watching];

async function get (
  req: NextApiRequest,
  res: NextApiResponse<IRequestResponseSuccess<any>>
) {
    const status = req.query.status as EDataGroups;
    runChecks([
        [CTvShowGroups.includes(status), `'req.query.status' has to be one of '${CTvShowGroups.join("','")}'`],
    ]);

    if (typeof status !== "string") {
        throw new Error("expected string for param 'status'");
    }

    const db = await getDB();

    const tvshows = await TvShowDbManager.getAll({
        where: {
            status: status,
        },
    });
    const genresAll = await db.all<{
        tv_show_id: number,
        name: string,
    }[]>("SELECT ga.tv_show_id, t.name from tv_shows_genres_array ga inner join cinema_genres t on ga.genre_id = t.id");
    const tagsAll = await db.all<{
        tv_show_id: number,
        name: string,
    }[]>("SELECT ta.tv_show_id, g.name from tv_shows_tags_array ta inner join cinema_tags g on ta.tag_id = g.id");

    const genres = genresAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
        const arr = acc[data.tv_show_id];
        if (arr) {
            arr.push(data.name)
        } else {
            acc[data.tv_show_id] = [data.name];
        }
        return acc;
    }, {});
    const tags = tagsAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
        const arr = acc[data.tv_show_id];
        if (arr) {
            arr.push(data.name)
        } else {
            acc[data.tv_show_id] = [data.name];
        }
        return acc;
    }, {});

    const data = tvshows.reduce<{
        [id: string]: TVShow,
    }>((acc, data) => {
        const item: TVShow = {
            ...data.current,
            tags: tags[data.current.id] ?? [],
            genres: genres[data.current.id] ?? [],
        };
        acc[data.current.id] = item;
        return acc;
    }, {});
    res
      .status(200)
      .send({
          success: true,
          data: data,
      });
}

export function validateEditItemData(item: Partial<TVShowEditable>): TVShowEditable {
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
    item: TVShowEditable,
}

function validateCreateBody (body: ICreateTvSHowItemReq): ICreateTvSHowItemReq {
    return {
        item: validateEditItemData(body.item),
    }
}

async function post (
  req: NextApiRequest,
  res: NextApiResponse<IRequestResponseSuccess<any>>
) {
    const body = validateCreateBody(req.body);

    const db = await getDB();

    await db.exec("BEGIN TRANSACTION");
    let tvshowId: number;
    try {
        const tvshow = await TvShowDbManager.insert({
            ...body.item,
            created_at: Date.now(),
            updated_at: Date.now(),
        });
        tvshowId = tvshow.current.id;

        const updateArray = async <T extends {}>(
          request: string[],
          sourceManager: DBEntityManager<any, { id: number, name: string }>,
          arrayTable: DBEntityManager<any, T>,
          f: (toId: number) => Partial<T>,
        ) => {
            if (request.length > 0) {
                const listRaw = await sourceManager.getAll({});
                const listByName = listRaw.reduce<{ [name: string]: number | undefined }>((acc, el) => {
                    acc[el.current.name] = el.current.id;
                    return acc;
                }, {});

                const listInserts: Partial<T>[] = [];
                for (const listNameRaw of request) {
                    const listName = listNameRaw.toLowerCase();
                    let listId = listByName[listName];
                    if (listId === undefined) {
                        const e = await sourceManager.insert({
                            name: listName,
                        });
                        listId = e.current.id;
                        listByName[listName] = listId;
                    }
                    listInserts.push(f(listId));
                }
                await arrayTable.insertBulk(listInserts);
            }
        }
        await updateArray(body.item.genres, CinemaGenresDBManager, TVShowsGenresDBManager, (id) => ({ tv_show_id: tvshowId, genre_id: id, }));
        await updateArray(body.item.tags,  CinemaTagsDBManager, TVShowsTagsDBManager, (id) => ({ tv_show_id: tvshowId, tag_id: id, }));
    } catch (e) {
        await db.exec("ROLLBACK");
        throw e;
    }

    await db.exec("COMMIT");

    res.status(200).send({
        data: tvshowId,
        success: true,
    });
}

export default handler({
    "get": get,
    "post": post,
})
