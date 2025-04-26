import {Handle, handler} from "@api/utils/handler";
import {validateIdParam} from "@api/utils/validate-id-param";
import {MapBookmarksDB, MapBookmarksDTOEditable} from "../../../../entities/map-bookmarks";
import {MapBmsTagsArrayDB, MapBmsTagsArrayEntity} from "../../../../entities/map-bookmarks-tags-array";
import {validateItemData} from "@api/map/bms/index.p";
import {runChecks} from "@api/utils/run-checks";
import {MapTagsDB, MapTagsEntity} from "../../../../entities/map-tags";

export interface IMapBMEditReq {
  item: MapBookmarksDTOEditable,
}

function validatePutBody(body: any): IMapBMEditReq {
  runChecks([
    [typeof body === "object", "Body should be an object"],
  ]);

  return {
    item: validateItemData(body.item),
  }
}

const put: Handle<undefined> = async (req, res) => {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const bmId = validateIdParam(req.query.id);
  const body = validatePutBody(req.body);

  const knex = global.DB.db.getKnex();
  const haveTagsRaw = await knex
    .table(MapTagsDB.tableName)
    .select<{
      tagId: number,
      tagName: string,
      arrayId: number | null,
    }[]>(
      `${MapTagsDB.tableName}.${MapTagsDB.fields.id} as tagId`,
      `${MapTagsDB.tableName}.${MapTagsDB.fields.name} as tagName`,
      `${MapBmsTagsArrayDB.tableName}.${MapBmsTagsArrayDB.fields.id} as arrayId`,
    )
    .leftJoin(
      MapBmsTagsArrayDB.tableName,
      function () {
        this
          .on(
            `${MapTagsDB.tableName}.${MapTagsDB.fields.id}`,
            '=',
            `${MapBmsTagsArrayDB.tableName}.${MapBmsTagsArrayDB.fields.map_tag_id}`,
          )
          .andOn(
            `${MapBmsTagsArrayDB.tableName}.${MapBmsTagsArrayDB.fields.map_bm_id}`,
            '=',
            knex.raw('?', [bmId]),
          );
      },
    )
    .where({
      [`${MapBmsTagsArrayDB.tableName}.${MapBmsTagsArrayDB.fields.map_bm_id}`]: bmId,
    });
  const haveTags = haveTagsRaw.reduce<Record<string, {
    tagId: number,
    arrayId: number | null,
  }>>((acc, el) => {
    acc[el.tagName] = {
      tagId: el.tagId,
      arrayId: el.arrayId,
    };
    return acc;
  }, {});

  const tagLinksToInsert: Partial<MapBmsTagsArrayEntity>[] = [];
  const tagsToInsert: Partial<MapTagsEntity>[] = [];
  const tagLinksToDelete: number[] = [];
  for (const tag of body.item.tags) {
    if (haveTags[tag] === undefined) {
      // tag does not exist - insert and then link
      tagsToInsert.push({
        name: tag,
      });
    } else if (haveTags[tag].arrayId === null) {
      // tag exists but no link - link
      tagLinksToInsert.push({
        map_tag_id: haveTags[tag].tagId,
        map_bm_id: bmId,
      });
    } else {
      // tag exists and link exists, remove from processing
      delete haveTags[tag];
    }
  }
  // remaining tags are not mentioned in new array - delete
  for (const tag in haveTags) {
    if (haveTags[tag].arrayId) {
      tagLinksToDelete.push(haveTags[tag].arrayId);
    }
  }

  await global.DB.db.begin();
  try {
    const knex = global.DB.db.getKnex();

    await knex
      .table(MapBookmarksDB.tableName)
      .update({
        [MapBookmarksDB.fields.lat]: body.item.lat,
        [MapBookmarksDB.fields.lng]: body.item.lng,
        [MapBookmarksDB.fields.title]: body.item.title,
        [MapBookmarksDB.fields.notes]: body.item.notes,
        [MapBookmarksDB.fields.updated_at]: new Date(),
      })
      .where({
        [MapBookmarksDB.fields.id]: bmId,
      });

    if (tagLinksToDelete.length > 0) {
      await knex
        .table(MapBmsTagsArrayDB.tableName)
        .delete()
        .whereIn(
          MapBmsTagsArrayDB.fields.id,
          tagLinksToDelete,
        );
    }

    if (tagsToInsert.length > 0) {
      const newTags = await knex
        .table(MapTagsDB.tableName)
        .insert(tagsToInsert)
        .returning<{
          id: number
        }[]>(`${MapTagsDB.tableName}.${MapTagsDB.fields.id} as id`);
      for (const newTag of newTags) {
        tagLinksToInsert.push({
          map_tag_id: newTag.id,
          map_bm_id: bmId,
        })
      }
    }
    if (tagLinksToInsert.length > 0) {
      await knex
        .table(MapBmsTagsArrayDB.tableName)
        .insert(tagLinksToInsert);
    }

    await global.DB.db.commit();
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }

  res.json({
    success: true,
  });
}

const del: Handle<undefined> = async (req, res) => {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const bmId = validateIdParam(req.query.id);

  await global.DB.db.begin();
  try {
    const knex = global.DB.db.getKnex();

    await knex
      .table(MapBmsTagsArrayDB.tableName)
      .delete()
      .where({
        [MapBmsTagsArrayDB.fields.map_bm_id]: bmId,
      })

    const n = await knex
      .table(MapBookmarksDB.tableName)
      .delete()
      .where({
        [MapBookmarksDB.fields.id]: bmId,
      });
    if (n === 0) {
      throw new Error('Failed to delete any bm');
    }

    await global.DB.db.commit();
  } catch (e) {
    await global.DB.db.rollback();
    throw e;
  }

  res.json({
    success: true,
  })
}

export default handler({
  put,
  delete: del,
})
