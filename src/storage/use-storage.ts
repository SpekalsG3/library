import {useEffect, useState} from "react";
import {useLocalStorage} from "../utils/use-local-storage";
import {EKnexClients, IKnexOptions, StorageKnex} from "./postgres";
import {IStorageAdapter} from "./types";

export enum StorageConnType {
  Postgres = "postgres",
  SQLite3 = "sqlite3"
}
interface TypeToOpts {
  [StorageConnType.Postgres]: IKnexOptions[EKnexClients.Postgres],
  [StorageConnType.SQLite3]: IKnexOptions[EKnexClients.SQLite3],
}

export interface StorageConnOpts<T extends StorageConnType> {
  type: T,
  options: TypeToOpts[T],
}

export const StorageConnectionKey = "storage-connection";

export function useStorage() {
  const [storage, setStorage] = useState<IStorageAdapter | null>(null);

  const [connection, ] = useLocalStorage<StorageConnOpts<StorageConnType>>(StorageConnectionKey);

  useEffect(() => {
    if (!connection) {
      return;
    }

    async function effect(): Promise<void> {
      const conn = connection as StorageConnOpts<any>;

      let db!: IStorageAdapter;
      switch (conn.type) {
        case StorageConnType.Postgres: {
          db = new StorageKnex(EKnexClients.Postgres, conn.options);
          break;
        }
        case StorageConnType.SQLite3: {
          db = new StorageKnex(EKnexClients.SQLite3, conn.options);
          break;
        }
      }

      try {
        await db.try_connection();
        setStorage(db);
      } catch (e) {
        console.error(`Failed to connect to ${conn.type} with provided options\nConfig:`, conn.options, '\nError:', e);
      }
    }

    void effect();
  }, [connection]);

  return storage;
}
