import { NextApiRequest, NextApiResponse } from "next";
import { IRequestResponseSuccess } from "../types";
import { handler } from "../utils/handler";
import { runChecks } from "../utils/run-checks";
import { validateEditItemData } from "./index.p";
import { getDB } from "../../../../migrations/cli/utils";
import { TvShowDbManager, TVShowEditable } from "../../../entities/tvshows";
import { DBEntityManager } from "../../../entities/interface";
import { CinemaGenresDBManager } from "../../../entities/cinema-genres";
import { CinemaTagsDBManager } from "../../../entities/cinema-tags";

export interface IEditTvShowReq {
    item: TVShowEditable,
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

async function put (
  req: NextApiRequest,
  res: NextApiResponse<IRequestResponseSuccess<any>>,
) {
    const id = validateIdParam(req.query.id);
    const body = validateEditBody(req.body);

    const db = await getDB();

    await db.exec("BEGIN TRANSACTION");

    try {
        const n = await TvShowDbManager.update({
            data: {
                ...body.item,
                updated_at: Date.now(),
            },
            where: {
                id: id,
            }
        });
        if (n === 0) {
            throw new Error(`Updated no record with id "${id}"`);
        }

        const updateArray = async (
          request: string[],
          sourceManager: DBEntityManager<any, { id: number, name: string }>,
          arrayTable: string,
          arrayTableKey: string,
        ) => {
            if (request.length > 0) {
                const listRaw = await sourceManager.getAll({});
                const listByName = listRaw.reduce<{ [name: string]: number | undefined }>((acc, el) => {
                    acc[el.current.name] = el.current.id;
                    return acc;
                }, {});

                const tvshowsArrayRaw = await db.all<{
                    id: number,
                    array_id: number,
                }[]>(
                  `SELECT id, ${arrayTableKey} as array_id FROM ${arrayTable} WHERE tv_show_id = ${id}`
                );
                const tvshowsArrayById = tvshowsArrayRaw.reduce<{ [id: number]: number | undefined }>((acc, el) => {
                    acc[el.array_id] = el.id;
                    return acc;
                }, {});

                const arrayInserts: number[] = [];
                for (const listNameRaw of request) {
                    const listName = listNameRaw.toLowerCase();
                    let listId = listByName[listName];

                    if (listId === undefined) {
                        const e = await sourceManager.insert({
                            name: listName,
                        });
                        listId = e.current.id;
                        listByName[listName] = listId;
                        arrayInserts.push(listId);
                    } else {
                        if (tvshowsArrayById[listId]) {
                            delete tvshowsArrayById[listId];
                        } else {
                            arrayInserts.push(listId);
                        }
                    }
                }

                if (arrayInserts.length > 0) {
                    await db.exec(
                      `INSERT INTO ${arrayTable} (tv_show_id, ${arrayTableKey}) VALUES ` +
                      arrayInserts.map((listId) => `(${id}, ${listId})`).join(',')
                    );
                }

                const deleteIds = Object.values(tvshowsArrayById);
                if (deleteIds.length > 0) {
                    await db.exec(
                      `DELETE FROM ${arrayTable} WHERE id IN (${deleteIds.join(',')})`
                    )
                }
            } else {
                await db.exec(
                  `DELETE FROM ${arrayTable} WHERE tv_show_id = ${id}`
                )
            }
        }
        await updateArray(body.item.genres, CinemaGenresDBManager, "tv_shows_genres_array", "genre_id");
        await updateArray(body.item.tags, CinemaTagsDBManager, "tv_shows_tags_array", "tag_id");
    } catch (e) {
        await db.exec("ROLLBACK");
        throw e;
    }
    await db.exec("COMMIT");

    res.status(200).send({
        success: true,
        data: undefined,
    });
}

async function del (
  req: NextApiRequest,
  res: NextApiResponse,
) {
    const id = validateIdParam(req.query.id);

    const db = await getDB();
    await db.exec("BEGIN TRANSACTION");
    try {
        const n = await TvShowDbManager.delete({
            where: {
                id: id,
            },
        })
        if (n === 0) {
            throw new Error(`Deleted no record with id "${id}"`);
        }
        await db.exec(
          "DELETE FROM tv_shows_genres_array WHERE " +
          `tv_show_id = ${id}`
        );
        await db.exec(
          "DELETE FROM tv_shows_tags_array WHERE " +
          `tv_show_id = ${id}`
        );
    } catch (e) {
        await db.exec("ROLLBACK");
        throw e;
    }
    await db.exec("COMMIT");

    res.status(200).send({
        success: true,
    });
}

export default handler({
    "put": put,
    "delete": del,
})
