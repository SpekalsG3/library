import {Handle, handler} from '../utils/handler'
import { EDataGroups } from '../types';
import { runChecks } from '../utils/run-checks';
import { isValidUrl } from "../utils/is-valid-url";
import { MovieDTO, MovieDTOEditable, MoviesDB } from "../../../entities/movies";
import {CinemaGenresDB} from "../../../entities/cinema-genres";
import {CinemaTagsDB} from "../../../entities/cinema-tags";
import {DBEntityManager} from "../../../entities/interface";
import {MoviesGenresDB} from "../../../entities/movies-genres-array";
import {MoviesTagsDB} from "../../../entities/movies-tags-array";

export const CMovieGroups = [EDataGroups.planned, EDataGroups.completed];

const get: Handle<{
  [id: string]: MovieDTO,
}> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const status = req.query.status as EDataGroups;
  runChecks([
    [CMovieGroups.includes(status), `'req.query.status' has to be one of '${CMovieGroups.join("','")}'`],
  ]);

  if (typeof status !== "string") {
    throw new Error("expected string for param 'status'");
  }

  const movies = await global.DB.db.getKnex()
    .table(MoviesDB.tableName)
    .select()
    .where({
      [MoviesDB.fields.status]: status,
    });
  const genresAll = await global.DB.db.getKnex()
    .table(MoviesGenresDB.tableName)
    .select<[{
      movieId: number,
      name: string,
    }]>(
      `${MoviesGenresDB.tableName}.${MoviesGenresDB.fields.movie_id} as movieId`,
      `${CinemaGenresDB.tableName}.${CinemaGenresDB.fields.name} as name`,
    )
    .innerJoin(
      CinemaGenresDB.tableName,
      `${MoviesGenresDB.tableName}.${MoviesGenresDB.fields.genre_id}`,
      '=',
      `${CinemaGenresDB.tableName}.${CinemaGenresDB.fields.id}`,
    );
  const tagsAll = await global.DB.db.getKnex()
    .table(MoviesTagsDB.tableName)
    .select<[{
      movieId: number,
      name: string,
    }]>(
      `${MoviesTagsDB.tableName}.${MoviesTagsDB.fields.movie_id} as movieId`,
      `${CinemaTagsDB.tableName}.${CinemaTagsDB.fields.name} as name`,
    )
    .innerJoin(
      CinemaTagsDB.tableName,
      `${MoviesTagsDB.tableName}.${MoviesTagsDB.fields.tag_id}`,
      '=',
      `${CinemaTagsDB.tableName}.${CinemaTagsDB.fields.id}`,
    );

  const genres = genresAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
    const arr = acc[data.movieId];
    if (arr) {
      arr.push(data.name)
    } else {
      acc[data.movieId] = [data.name];
    }
    return acc;
  }, {});
  const tags = tagsAll.reduce<{ [id: number]: string[] | undefined }>((acc, data) => {
    const arr = acc[data.movieId];
    if (arr) {
      arr.push(data.name)
    } else {
      acc[data.movieId] = [data.name];
    }
    return acc;
  }, {});

  const data = movies.reduce<{
    [id: string]: MovieDTO,
  }>((acc, raw) => {
    const data = MoviesDB.fromDb(raw);
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

export function validateItemData (item: Partial<MovieDTOEditable>): MovieDTOEditable {
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

function validateCreateBody (body: any): {
  item: MovieDTOEditable,
} {
  runChecks([
    [body !== null, "body is null"],
    [typeof body.item === "object", "Field `body.item` is required"],
    [body.item !== null, "Field `body.item` is required"],
  ]);

  return {
    item: validateItemData(body.item),
  };
}

const post: Handle<number> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const now = new Date();

  const body = validateCreateBody(req.body);

  await global.DB.db.begin();
  let movieId: number;
  try {
    const {
      genres: dtoGenres,
      tags: dtoTags,
      ...dto
    } = body.item;

    const [result] = await global.DB.db.getKnex()
      .table(MoviesDB.tableName)
      .insert(MoviesDB.toDb({
        ...dto,
        created_at: now,
        updated_at: now,
      }))
      .returning(`${MoviesDB.fields.id} as id`);
    movieId = result[MoviesDB.fields.id];

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
    await updateArray(dtoGenres, CinemaGenresDB, MoviesGenresDB, (id) => ({ movie_id: movieId, genre_id: id, }));
    await updateArray(dtoTags,   CinemaTagsDB,   MoviesTagsDB,   (id) => ({ movie_id: movieId, tag_id: id, }));
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }

  await global.DB.db.commit();

  res.status(200).send({
    success: true,
    data: movieId,
  });
}

export default handler({
    "get": get,
    "post": post,
})
