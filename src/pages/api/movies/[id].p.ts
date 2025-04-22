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

function validatePutBody(body: any): {
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
      })
    if (n === 0) {
      throw new Error(`Updated no record with id "${movieId}"`);
    }

    const updateArray = async (
      request: string[],
      sourceManager: DBEntityManager<{ id: string, name: string }, any, { id: number, name: string }>,
      arrayTable: DBEntityManager<{ id: string }, any, { id: number }>,
      arrayIdMapName: string,
      arraySourceIdName: string,
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

        const moviesArrayRaw = await knex
          .table(arrayTable.tableName)
          .select<[{
            id: number,
            arrayId: number,
          }]>(`${sourceManager.fields.id} as id`, `${arraySourceIdName} as arrayId`)
          .where({
            [arraySourceIdName]: movieId,
          });

        const movieArrayById = moviesArrayRaw.reduce<{ [id: number]: number | undefined }>((acc, el) => {
          acc[el.arrayId] = el.id;
          return acc;
        }, {});

        const arrayInserts: number[] = [];
        for (const listNameRaw of request) {
          const listName = listNameRaw.toLowerCase();
          let listId = listByName[listName];

          if (listId === undefined) {
            const [e] = await knex
              .table(sourceManager.tableName)
              .insert({
                [sourceManager.fields.name]: listName,
              })
              .returning<[{
                id: number,
              }]>(`${sourceManager.fields.id} as id`);
            listId = e.id;
            listByName[listName] = listId;
            arrayInserts.push(listId);
          } else {
            if (movieArrayById[listId]) {
              delete movieArrayById[listId];
            } else {
              arrayInserts.push(listId);
            }
          }
        }

        if (arrayInserts.length > 0) {
          await knex.table(arrayTable.tableName)
            .insert(
              arrayInserts.map((listId) => ({
                [arrayIdMapName]: listId,
                [arraySourceIdName]: movieId,
              })),
            );
        }

        const deleteIds = Object.values(movieArrayById);
        if (deleteIds.length > 0) {
          await knex.table(arrayTable.tableName)
            .delete()
            .whereIn(
              arrayTable.fields.id,
              deleteIds,
            );
        }
      } else {
        await knex.table(arrayTable.tableName)
          .delete()
          .where({
            [arraySourceIdName]: movieId,
          });
      }
    }
    await updateArray(
      dtoGenres,
      CinemaGenresDB,
      MoviesGenresDB,
      MoviesGenresDB.fields.genre_id,
      MoviesGenresDB.fields.movie_id,
    );
    await updateArray(
      dtoTags,
      CinemaTagsDB,
      MoviesTagsDB,
      MoviesTagsDB.fields.tag_id,
      MoviesTagsDB.fields.movie_id,
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

    const n = await knex
      .table(MoviesDB.tableName)
      .delete()
      .where({
        [MoviesDB.fields.id]: id,
      });
    if (n === 0) {
      throw new Error(`Deleted no record with id "${id}"`);
    }

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
