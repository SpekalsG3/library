import {Handle, handler} from "../utils/handler";
import { runChecks } from "../utils/run-checks";
import { validateEditItemData } from "./index.p";
import { TvShowsDB, TVShowDTOEditable } from "../../../entities/tv-shows";
import { DBEntityManager } from "../../../entities/interface";
import { CinemaGenresDB } from "../../../entities/cinema-genres";
import { CinemaTagsDB } from "../../../entities/cinema-tags";
import {TVShowsGenresDB} from "../../../entities/tv-shows-genres-array";
import {TVShowsTagsDB} from "../../../entities/tv-shows-tags-array";

export interface IEditTvShowReq {
  item: TVShowDTOEditable,
}

function validateEditBody (body: IEditTvShowReq): IEditTvShowReq {
  return {
    item: validateEditItemData(body.item),
  }
}

function validateIdParam (param: string | string[] | undefined): number {
  const id = Number(param);
  runChecks([
    [!isNaN(id), "/[id] should be a single parameter"],
  ]);
  return id
}

const put: Handle<undefined> = async function (req, res) {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const tvShowId = validateIdParam(req.query.id);
  const body = validateEditBody(req.body);

  await global.DB.db.begin();

  try {
    const {
      genres: dtoGenres,
      tags: dtoTags,
      ...dto
    } = body.item;

    const n = await global.DB.db.getKnex()
      .table(TvShowsDB.tableName)
      .update(TvShowsDB.toDb({
        ...dto,
        updated_at: new Date(),
      }))
      .where({
        [TvShowsDB.fields.id]: tvShowId,
      });
    if (n === 0) {
      throw new Error(`Updated no record with id "${tvShowId}"`);
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
      tvShowId,
      dtoGenres,
      CinemaGenresDB,
      TVShowsGenresDB,
      TVShowsGenresDB.fields.tv_show_id,
      TVShowsGenresDB.fields.genre_id,
    );
    await updateArray(
      tvShowId,
      dtoTags,
      CinemaTagsDB,
      TVShowsTagsDB,
      TVShowsTagsDB.fields.tv_show_id,
      TVShowsTagsDB.fields.tag_id,
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
      .table(TvShowsDB.tableName)
      .delete()
      .where({
        [TvShowsDB.fields.id]: id,
      });
    if (n === 0) {
      throw new Error(`Deleted no record with id "${id}"`);
    }

    await knex
      .table(TVShowsGenresDB.tableName)
      .delete()
      .where({
        [TVShowsGenresDB.fields.tv_show_id]: id,
      });
    await knex
      .table(TVShowsTagsDB.tableName)
      .delete()
      .where({
        [TVShowsTagsDB.fields.tv_show_id]: id,
      });
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }
  await global.DB.db.commit();

  res.status(200).send({
    success: true,
  });
}

export default handler({
  "put": put,
  "delete": del,
})
