import {Handle, handler} from "@api/utils/handler";
import {
  MapBookmarksDB,
  MapBookmarksDTO,
  MapBookmarksDTOEditable,
  MapBookmarksEntity
} from "../../../../entities/map-bookmarks";
import {MapTagsDB, MapTagsEntity} from "../../../../entities/map-tags";
import {MapBmsTagsArrayDB, MapBmsTagsArrayEntity} from "../../../../entities/map-bookmarks-tags-array";
import {runChecks} from "@api/utils/run-checks";

const get: Handle<MapBookmarksDTO[]> = async (req, res) => {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const knex = global.DB.db.getKnex();

  const bms = await knex
    .table(MapBookmarksDB.tableName)
    .select<MapBookmarksEntity[]>();
  const tagsRaw = await knex
    .table(MapTagsDB.tableName)
    .select<{
      tagName: string,
      bmId: number,
    }[]>(
      `${MapTagsDB.tableName}.${MapTagsDB.fields.name} as tagName`,
      `${MapBmsTagsArrayDB.tableName}.${MapBmsTagsArrayDB.fields.map_bm_id} as bmId`,
    )
    .innerJoin(
      MapBmsTagsArrayDB.tableName,
      `${MapTagsDB.tableName}.${MapTagsDB.fields.id}`,
      '=',
      `${MapBmsTagsArrayDB.tableName}.${MapBmsTagsArrayDB.fields.map_tag_id}`,
    );
  const tags = tagsRaw.reduce<Record<number, string[] | undefined>>((acc, tag) => {
    if (!acc[tag.bmId]) {
      acc[tag.bmId] = []
    }
    acc[tag.bmId]!.push(tag.tagName);
    return acc;
  }, {})

  const dto = bms.reduce<MapBookmarksDTO[]>((acc, bm) => {
    acc.push({
      ...bm,
      tags: tags[bm.id] ?? [],
    })
    return acc;
  }, []);

  res.json({
    success: true,
    data: dto,
  });
}

export function validateItemData (item: any): MapBookmarksDTOEditable {
  runChecks([
    [typeof item === "object", "Field `body.item` is not an object"],
  ]);

  const lat = Number(item.lat);
  const lng = Number(item.lng);

  runChecks([
    [!isNaN(lat), "Field `body.item.lat` is not a number"],
    [!isNaN(lng), "Field `body.item.lng` is not a number"],
    [["undefined", "string"].includes(typeof item.title), "Field `body.item.title` should be a string, if provided"],
    [["undefined", "string"].includes(typeof item.notes), "Field `body.item.notes` should be a string, if provided"],
  ]);
  if (item.tags) {
    runChecks([
      [Array.isArray(item.tags), "Field `body.item.tags` should be an array of strings, if provided"],
      [item.tags.findIndex((el: any) => typeof el !== "string") === -1, "Field `body.item.tags` should be an array of strings, if provided"],
    ])
  }

  return {
    lat: lat,
    lng: lng,
    title: item.title ?? null,
    notes: item.notes ?? null,
    tags: item.tags ?? [],
  }
}

export interface IMapBMCreateReq {
  item: MapBookmarksDTOEditable,
}
function validatePostBody(body: any): IMapBMCreateReq {
  runChecks([
    [typeof body === "object", "Body should be an object"],
  ]);

  return {
    item: validateItemData(body.item),
  }
}

const post: Handle<number> = async (req, res) => {
  if (!global.DB) {
    throw new Error("DB is not initialized");
  }

  const body = validatePostBody(req.body);
  const mapTagsRaw = await global.DB.db
    .getKnex()
    .table(MapTagsDB.tableName)
    .select<MapTagsEntity[]>();
  const mapTags = mapTagsRaw.reduce<Record<string, number>>((acc, el) => {
    acc[el.name] = el.id;
    return acc;
  }, {})

  const tagsToInsert: Array<Partial<MapTagsEntity>> = [];
  const tagsIds: number[] = [];

  for (const tag of body.item.tags) {
    if (mapTags[tag]) {
      tagsIds.push(mapTags[tag]);
    } else {
      tagsToInsert.push({
        [MapTagsDB.fields.name]: tag,
      });
    }
  }

  await global.DB.db.begin();

  let bmId!: number;
  try {
    const knex =  global.DB.db.getKnex();

    const now = new Date();

    const [bm] = await knex
      .table(MapBookmarksDB.tableName)
      .insert({
        [MapBookmarksDB.fields.lat]: body.item.lat,
        [MapBookmarksDB.fields.lng]: body.item.lng,
        [MapBookmarksDB.fields.notes]: body.item.notes,
        [MapBookmarksDB.fields.title]: body.item.title,
        [MapBookmarksDB.fields.created_at]: now,
        [MapBookmarksDB.fields.updated_at]: now,
      })
      .returning<{ id: number }[]>(
        `${MapBookmarksDB.fields.id} as id`,
      );
    bmId = bm.id;

    if (tagsToInsert.length > 0) {
      const newTags = await knex
        .table(MapTagsDB.tableName)
        .insert(tagsToInsert)
        .returning<{
          id: number,
        }[]>(
          `${MapTagsDB.fields.id} as id`,
        );
      for (const newTag of newTags) {
        tagsIds.push(newTag.id);
      }
    }

    const tagLinksToInsert = tagsIds
      .map<Partial<MapBmsTagsArrayEntity>>((tagId) => ({
        [MapBmsTagsArrayDB.fields.map_tag_id]: tagId,
        [MapBmsTagsArrayDB.fields.map_bm_id]: bmId,
      }));
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
    data: bmId,
  });
}

export default handler({
  get,
  post,
})
