import {IDBAdapter} from "@database/types";
import {Handle, handler} from "../utils/handler";
import {EKnexClients, IKnexOptions, DBKnex} from "@database/postgres";
import {runChecks} from "../utils/run-checks";
import {MigrationsList} from "@database/migrations/files";

export enum ConnectionTypes {
  Postgres = "postgres",
  SQLite3 = "sqlite3"
}
interface ConnTypeToOpts {
  [ConnectionTypes.Postgres]: IKnexOptions[EKnexClients.Postgres],
  [ConnectionTypes.SQLite3]: IKnexOptions[EKnexClients.SQLite3],
}
export interface ConnectionOptions<T extends ConnectionTypes> {
  type: T,
  options: ConnTypeToOpts[T],
}

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

  const options = {};
  switch (body.type as ConnectionTypes) {
    case ConnectionTypes.Postgres: {
      options.user = body.options.user;
      options.password = body.options.password;
      options.host = body.options.host;
      options.port = Number(body.options.port);
      options.dbName = body.options.dbName;

      runChecks([
        [options.user, "Field 'body.options.user' should be a string"],
        [options.password, "Field 'body.options.password' should be a string"],
        [options.host, "Field 'body.options.host' should be a string"],
        [options.port, "Field 'body.options.port' should be a number"],
        [options.dbName, "Field 'body.options.dbName' should be a string"],
      ]);
      break;
    }
    case ConnectionTypes.SQLite3: {
      throw new Error("SQLite3 not yet supported");
      break;
    }
  }

  return {
    type: body.type,
    options,
  }
}

function areSameOpts(lhs: ConnectionOptions<ConnectionTypes>, rhs: ConnectionOptions<ConnectionTypes>): boolean {
  if (lhs.type !== rhs.type) {
    return false;
  }

  switch (lhs.type) {
    case ConnectionTypes.Postgres: {
      const l: ConnectionOptions<ConnectionTypes.Postgres>['options'] = lhs.options;
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
      throw new Error("SQLite3 not yet supported");
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

  let message!: string;
  if (global.DB) {
    if (areSameOpts(global.DB.opts, opts)) {
      message = "DB connection is already initialized with same db and user";
    } else {
      await global.DB.db.close();
      global.DB = null;

      let db!: IDBAdapter;
      switch (opts.type) {
        case ConnectionTypes.Postgres: {
          db = new DBKnex(EKnexClients.Postgres, (opts as ConnectionOptions<ConnectionTypes.Postgres>).options);
          break;
        }
        case ConnectionTypes.SQLite3: {
          db = new DBKnex(EKnexClients.SQLite3, (opts as ConnectionOptions<ConnectionTypes.SQLite3>).options);
          break;
        }
      }

      global.DB = {
        opts,
        db,
      };

      message = "Successfully connected";
    }
  }

  const migrationsRes: ISaveConnectionMigrationRes = {
    conflictingIndex: null,
    extra: 0,
    missing: 0,
  }

  const appliedMigrations = await global.DB!.db.migrationsAll();

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
