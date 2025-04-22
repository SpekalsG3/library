import {ConnectionOptions, ConnectionTypes, IDBAdapter} from "@database/types";
import {Handle, handler} from "../utils/handler";
import {runChecks} from "../utils/run-checks";
import {MigrationsList} from "@database/migrations/files";
import {MigrationHistoryDBEntity} from "../../../entities/migration-history";
import {tryConnOpts} from "@database/utils";

declare global {
  var DB: null | {
    opts: ConnectionOptions<ConnectionTypes>,
    db: IDBAdapter,
  };
}

function validateConnOpts(body: any): ConnectionOptions<ConnectionTypes> {
  if (body == null) {
    throw new Error("body is null");
  }

  runChecks([
    [typeof body === "object", "body should be an object"],
    [Object.values(ConnectionTypes).includes(body.type), `Invalid 'body.type', should be one of: '${Object.values(ConnectionTypes).join("','")}'`],
    [typeof body.options === "object", "Field 'body.options' should be an object"],
  ]);

  let options = {};
  switch (body.type as ConnectionTypes) {
    case ConnectionTypes.Postgres: {
      // @ts-ignore
      const opts: ConnectionOptions<ConnectionTypes.Postgres>['options'] = {};

      opts.user = body.options.user;
      opts.password = body.options.password;
      opts.host = body.options.host;
      opts.port = Number(body.options.port);
      opts.dbName = body.options.dbName;

      runChecks([
        [typeof opts.user === "string", "Field 'body.options.user' should be a string"],
        [opts.user.length > 0, "Field 'body.options.user' should be a non-empty string"],
        [typeof opts.password === "string", "Field 'body.options.password' should be a string"],
        [opts.password.length > 0, "Field 'body.options.password' should be a non-empty string"],
        [typeof opts.host === "string", "Field 'body.options.host' should be a string"],
        [opts.host.length > 0, "Field 'body.options.host' should be a non-empty string"],
        [typeof opts.dbName === "string", "Field 'body.options.dbName' should be a string"],
        [opts.dbName.length > 0, "Field 'body.options.dbName' should be a non-empty string"],
        [!isNaN(opts.port), "Field 'body.options.port' should be a number"],
      ]);
      options = opts;

      break;
    }
    case ConnectionTypes.SQLite3: {
      // @ts-ignore
      const opts: ConnectionOptions<ConnectionTypes.SQLite3>['options'] = {};

      opts.filename = body.options.filename;

      runChecks([
        [typeof opts.filename === "string", "Field 'body.options.filename' should be a string"],
        [opts.filename.length > 0, "Field 'body.options.filename' should be a non-empty string"],
      ]);
      options = opts;

      break;
    }
  }

  return {
    type: body.type,
    options: options as any,
  }
}

function areSameOpts(lhs: ConnectionOptions<ConnectionTypes>, rhs: ConnectionOptions<ConnectionTypes>): boolean {
  if (lhs.type !== rhs.type) {
    return false;
  }

  switch (lhs.type) {
    case ConnectionTypes.Postgres: {
      // @ts-ignore
      const l: ConnectionOptions<ConnectionTypes.Postgres>['options'] = lhs.options;
      // @ts-ignore
      const r: ConnectionOptions<ConnectionTypes.Postgres>['options'] = rhs.options;

      const isSameDB = l.dbName === r.dbName
        && l.host === r.host
        && l.port === r.port;
      if (!isSameDB) {
        return false;
      }

      if (l.user !== r.user) {
        return false;
      }

      break;
    }
    case ConnectionTypes.SQLite3: {
      // @ts-ignore
      const l: ConnectionOptions<ConnectionTypes.SQLite3>['options'] = lhs.options;
      // @ts-ignore
      const r: ConnectionOptions<ConnectionTypes.SQLite3>['options'] = rhs.options;

      if (l.filename === r.filename) {
        return false;
      }

      break;
    }
  }

  return true;
}

export interface ISaveConnectionMigrationRes {
  conflictingIndex: null | number,
  missing: number,
  extra: number,
}

export interface ISaveConnectionRes {
  message: string,
  migrations: ISaveConnectionMigrationRes,
}

const post: Handle<ISaveConnectionRes> = async function (req, res) {
  const opts = validateConnOpts(req.body);

  let toReconnect = true;
  let message!: string;

  if (global.DB) {
    if (areSameOpts(global.DB.opts, opts)) {
      toReconnect = false;
      message = "DB connection is already initialized with same db and user";
    } else {
      await global.DB.db.close();
      global.DB = null;
    }
  }

  if (toReconnect) {
    global.DB = {
      opts,
      db: tryConnOpts(opts),
    };

    message = "Successfully connected";
  }

  const migrationsRes: ISaveConnectionMigrationRes = {
    conflictingIndex: null,
    extra: 0,
    missing: 0,
  }

  let appliedMigrations!: MigrationHistoryDBEntity[];

  try {
    appliedMigrations = await global.DB!.db.migrationsAll();
  } catch (e) {
    appliedMigrations = [];
  }

  for (let i = 0; i < appliedMigrations.length; i++) {
    const expectedPublicId = MigrationsList[i].name;
    const appliedPublicId = appliedMigrations[i].public_id;

    if (expectedPublicId !== appliedPublicId) {
      migrationsRes.conflictingIndex = i;
      break;
    }
  }

  if (MigrationsList.length > appliedMigrations.length) {
    migrationsRes.missing = MigrationsList.length - appliedMigrations.length;
  } else {
    migrationsRes.extra = appliedMigrations.length - MigrationsList.length;
  }

  res.json({
    success: true,
    data: {
      message,
      migrations: migrationsRes,
    },
  })
}

export default handler({
  "post": post,
});
