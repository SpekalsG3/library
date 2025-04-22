import {Handle, handler} from "../utils/handler";
import { runChecks } from "../utils/run-checks";
import {MovieDTOEditable, MoviesDB} from "../../../entities/movies";
import { DBEntityManager } from "../../../entities/interface";
import { CinemaGenresDB } from "../../../entities/cinema-genres";
import { CinemaTagsDB } from "../../../entities/cinema-tags";
import {validateItemData} from "./index.p";
import {MoviesGenresDB} from "../../../entities/movies-genres-array";
import {MoviesTagsDB} from "../../../entities/movies-tags-array";

function validateIdParam (param: string | string[] | undefined): number {
  const id = Number(param);
  runChecks([
    [!isNaN(id), "/[id] should be a single parameter"],
  ]);
  return id
}

export interface IMovieUpdateDTO {
  item: MovieDTOEditable,
}

function validatePutBody(body: any): IMovieUpdateDTO {
  runChecks([
    [body !== null, "body is null"],
    [typeof body.item === "object", "Field `body.item` is required"],
    [body.item !== null, "Field `body.item` is required"],
  ]);

  return {
    item: validateItemData(body.item),
  };
}

const put: Handle<undefined> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const movieId = validateIdParam(req.query.id);
  const body = validatePutBody(req.body);

  await global.DB.db.begin();

  try {
    const {
      genres: dtoGenres,
      tags: dtoTags,
      ...dto
    } = body.item;

    const n = await global.DB.db.getKnex()
      .table(MoviesDB.tableName)
      .update(MoviesDB.toDb({
        ...dto,
        updated_at: new Date(),
      }))
      .where({
        [MoviesDB.fields.id]: movieId,
      });
    if (n === 0) {
      throw new Error(`Updated no record with id "${movieId}"`);
    }

    const updateArray = async (
      entityId: number,
      request: string[],
      sourceManager: DBEntityManager<{ id: string, name: string }, any, { id: number, name: string }>,
      arrayTable: DBEntityManager<{ id: string }, any, { id: number }>,
      entityIdField: string,
      sourceIdField: string,
    ) => {
      const knex = global.DB!.db.getKnex();
      if (request.length > 0) {
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

        const arrayRaw = await knex
          .table(arrayTable.tableName)
          .select<[{
            id: number,
            sourceId: number,
          }]>(`${arrayTable.fields.id} as id`, `${sourceIdField} as sourceId`)
          .where({
            [entityIdField]: entityId,
          });

        const arrayById = arrayRaw.reduce<{ [id: number]: number | undefined }>((acc, el) => {
          acc[el.sourceId] = el.id;
          return acc;
        }, {});

        const insertSourceIds: number[] = [];
        for (const listNameRaw of request) {
          const listName = listNameRaw.toLowerCase();
          let sourceId = listByName[listName];

          if (sourceId === undefined) {
            // if source element does not exist at all, create element and create link
            const [e] = await knex
              .table(sourceManager.tableName)
              .insert({
                [sourceManager.fields.name]: listName,
              })
              .returning<[{
                id: number,
              }]>(`${sourceManager.fields.id} as id`);
            sourceId = e.id;
            listByName[listName] = sourceId;
            insertSourceIds.push(sourceId);
          } else {
            // is source element exists
            if (arrayById[sourceId]) {
              // and there's a link, remove as requires no processing
              delete arrayById[sourceId];
            } else {
              // and there's no link, create link
              insertSourceIds.push(sourceId);
            }
          }
        }

        if (insertSourceIds.length > 0) {
          await knex.table(arrayTable.tableName)
            .insert(
              insertSourceIds.map((sourceId) => ({
                [sourceIdField]: sourceId,
                [entityIdField]: entityId,
              })),
            );
        }

        const deleteArrayIds = Object.values(arrayById);
        if (deleteArrayIds.length > 0) {
          await knex.table(arrayTable.tableName)
            .delete()
            .whereIn(
              // @ts-ignore // in doc, `whereIn` also accepts `(string, any[])`
              arrayTable.fields.id,
              deleteArrayIds,
            );
        }
      } else {
        await knex.table(arrayTable.tableName)
          .delete()
          .where({
            [entityIdField]: entityId,
          });
      }
    }

    await updateArray(
      movieId,
      dtoGenres,
      CinemaGenresDB,
      MoviesGenresDB,
      MoviesGenresDB.fields.movie_id,
      MoviesGenresDB.fields.genre_id,
    );
    await updateArray(
      movieId,
      dtoTags,
      CinemaTagsDB,
      MoviesTagsDB,
      MoviesTagsDB.fields.movie_id,
      MoviesTagsDB.fields.tag_id,
    );
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }
  await global.DB.db.commit();

  res.status(200).send({
    success: true,
  });
}

const del: Handle<undefined> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const id = validateIdParam(req.query.id);

  await global.DB.db.begin();
  try {
    const knex = global.DB.db.getKnex();

    await knex
      .table(MoviesGenresDB.tableName)
      .delete()
      .where({
        [MoviesGenresDB.fields.movie_id]: id,
      });
    await knex
      .table(MoviesTagsDB.tableName)
      .delete()
      .where({
        [MoviesTagsDB.fields.movie_id]: id,
      });

    const n = await knex
      .table(MoviesDB.tableName)
      .delete()
      .where({
        [MoviesDB.fields.id]: id,
      });
    if (n === 0) {
      throw new Error(`Deleted no record with id "${id}"`);
    }
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }
  await global.DB.db.commit();

  res
    .status(200)
    .json({
      success: true,
    });
}

export default handler({
  "put": put,
  "delete": del,
})
