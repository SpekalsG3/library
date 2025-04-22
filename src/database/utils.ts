import {DBKnex, EKnexClients} from "./knex";
import {ConnectionOptions, ConnectionTypes, IDBAdapter} from "./types";

export function tryConnOpts(opts: ConnectionOptions<ConnectionTypes>): IDBAdapter {
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

  return db;
}
