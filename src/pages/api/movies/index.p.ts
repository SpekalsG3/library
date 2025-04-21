import type { NextApiRequest, NextApiResponse } from 'next'
import { handler } from '../utils/handler'
import { EDataGroups, IRequestResponseSuccess } from '../types';
import { runChecks } from '../utils/run-checks';
import { escapeSqlString } from "../../../utils/database/escapes";
import { isValidUrl } from "../utils/is-valid-url";
import { Movie, MovieEditable, MoviesDBManager } from "../../../entities/movies";
import {CinemaGenresDBManager} from "../../../entities/cinema-genres";
import {TVShowsGenresDBManager} from "../../../entities/tv-shows-genres-array";
import {CinemaTagsDBManager} from "../../../entities/cinema-tags";
import {TVShowsTagsDBManager} from "../../../entities/tv-shows-tags-array";
import {DBEntityManager} from "../../../entities/interface";
import {MoviesGenresDBManager} from "../../../entities/movies-genres-array";
import {MoviesTagsDBManager} from "../../../entities/movies-tags-array";

export const CMovieGroups = [EDataGroups.planned, EDataGroups.completed];

async function get (
    req: NextApiRequest,
    res: NextApiResponse<IRequestResponseSuccess<any>>
) {
    const status = req.query.status as EDataGroups;
    runChecks([
        [CMovieGroups.includes(status), `'req.query.status' has to be one of '${CMovieGroups.join("','")}'`],
    ]);

    if (typeof status !== "string") {
        throw new Error("expected string for param 'status'");
    }

    const db = await getDB();

    const movies = await MoviesDBManager.getAll({
      where: {
        status: status,
      },
    });
    const genresAll = await db.all<{
        movie_id: number,
        name: string,
    }[]>("SELECT ga.movie_id, t.name from movies_genres_array ga inner join cinema_genres t on ga.genre_id = t.id");
    const tagsAll = await db.all<{
        movie_id: number,
        name: string,
    }[]>("SELECT ta.movie_id, g.name from movies_tags_array ta inner join cinema_tags g on ta.tag_id = g.id");

    const genres = genresAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
        const arr = acc[data.movie_id];
        if (arr) {
            arr.push(data.name)
        } else {
            acc[data.movie_id] = [data.name];
        }
        return acc;
    }, {});
    const tags = tagsAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
        const arr = acc[data.movie_id];
        if (arr) {
            arr.push(data.name)
        } else {
            acc[data.movie_id] = [data.name];
        }
        return acc;
    }, {});

    const data = movies.reduce<{
        [id: string]: Movie,
    }>((acc, data) => {
        acc[data.current.id] = {
          ...data.current,
          tags: tags[data.current.id] ?? [],
          genres: genres[data.current.id] ?? [],
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

export function validateItemData (item: Partial<MovieEditable>): MovieEditable {
    runChecks([
        [item !== undefined, `'body.item_data' has to be json`],
    ]);

    runChecks([
        [item.status !== undefined && CMovieGroups.includes(item.status), `'item.status' has to be one of '${CMovieGroups.join("','")}'`],
        [typeof item.title === 'string' && item.title.length > 0, `'item.title' has to be non zero length`],
        [typeof item.cover_url === 'string' && isValidUrl(item.cover_url), `'item.cover_url' has to be a valid URL`],
        [!(item.genres as unknown[])?.find((el) => !(typeof el === "string" && el.length > 0)), `'item.genres' has to be either undefined or an array of strings`],
        [!(item.tags as unknown[])?.find((el) => !(typeof el === "string" && el.length > 0)), `'item.genres' has to be either undefined or an array of strings`],
        [typeof item.len_min === 'number' && !isNaN(item.len_min), `'item.len_min' has to be a valid number`],
    ]);

    return {
        status: item.status!,
        title: item.title!,
        cover_url: item.cover_url!,
        genres: item.genres ?? [],
        tags: item.tags ?? [],
        notes: item.notes ?? null,
        score: item.score ?? null,
        rewatched_times: item.rewatched_times ?? null,
        len_min: item.len_min!,
    }
}

export interface ICreateMovieItemReq {
    item: MovieEditable,
}

function validateCreateBody (body: ICreateMovieItemReq): ICreateMovieItemReq {
    return {
        item: validateItemData(body.item),
    }
}

async function post (
  req: NextApiRequest,
  res: NextApiResponse<IRequestResponseSuccess<any>>
) {
  const body = validateCreateBody(req.body);

  const db = await getDB();

  await db.exec("BEGIN TRANSACTION");
  let movieId: number;
  try {
    const e = await MoviesDBManager.insert({
      ...body.item,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    movieId = e.current.id;

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
    await updateArray(body.item.genres, CinemaGenresDBManager, MoviesGenresDBManager, (id) => ({ tv_show_id: movieId, genre_id: id, }));
    await updateArray(body.item.tags,  CinemaTagsDBManager, MoviesTagsDBManager, (id) => ({ tv_show_id: movieId, tag_id: id, }));
  } catch (e) {
    await db.exec("ROLLBACK");
    throw e;
  }

  await db.exec("COMMIT");

  res.status(200).send({
      data: movieId,
      success: true,
  });
}

export default handler({
    "get": get,
    "post": post,
})
