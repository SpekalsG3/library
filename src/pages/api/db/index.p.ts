import {IDBAdapter} from "@database/types";
import {Handle, handler} from "../utils/handler";
import {EKnexClients, IKnexOptions, DBKnex} from "@database/postgres";
import {runChecks} from "../utils/run-checks";

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

export const DB: {
  current: null | {
    opts: ConnectionOptions<ConnectionTypes>,
    db: IDBAdapter,
  },
} = {
  current: null,
};

function validateConnOpts(body: any): ConnectionOptions<ConnectionTypes> {
  if (body == null) {
    throw new Error("body is null");
  }

  runChecks([
    [typeof body === "object", "body should an object"],
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

const post: Handle<string> = async function (req, res) {
  const opts = validateConnOpts(req.body);

  if (DB.current) {
    if (areSameOpts(DB.current.opts, opts)) {
      return res.json({
        success: true,
        data: "DB connection is already initialized with same db and user",
      });
    }

    await DB.current.db.close();
    DB.current = null;
  }

  let db!: IDBAdapter;
  switch (opts.type) {
    case ConnectionTypes.Postgres: {
      db = new DBKnex(EKnexClients.Postgres, opts.options);
      break;
    }
    case ConnectionTypes.SQLite3: {
      db = new DBKnex(EKnexClients.SQLite3, opts.options);
      break;
    }
  }

  await db.try_connection();

  DB.current = {
    opts,
    db,
  };

  res.json({
    success: true,
    data: "Successfully connected",
  })
}

export default handler({
  "post": post,
});
