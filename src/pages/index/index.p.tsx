import dynamic from "next/dynamic";

import {IndexContent} from "./components/content";
import {LoadConnection, StorageConnectionKey} from "./components/load-connection";

import styles from './styles.module.css'
import {useEffect, useState} from "react";
import {ISaveConnectionMigrationRes, ISaveConnectionRes} from "@api/db/index.p";
import {ModalElement} from "@ui-kit/ux/layers/element";
import Button from "@ui-kit/ui/button";
import {myRequest, MyRequestMethods} from "../../utils/request";
import {IApplyMigrationsRes} from "@api/db/migrations.p";
import {useLocalStorage} from "../../utils/use-local-storage";
import {ConnectionOptions, ConnectionTypes} from "@database/types";
import {IResSuccess} from "@api/types";

type ConnOptsNullable = null | ConnectionOptions<ConnectionTypes>;

interface TryConnectionResult {
  isSuccess: boolean,
  migrations?: ISaveConnectionMigrationRes,
}

function el() {
  if (typeof window === 'undefined') {
    return null;
  }

  const [connOpts, setConnOptsLocal] = useState<ConnectionOptions<ConnectionTypes> | null>(null);
  const [defaultConnOpts, setConnOpts] = useLocalStorage<ConnectionOptions<ConnectionTypes>>(StorageConnectionKey);
  const [result, setResult] = useState<TryConnectionResult>({
    isSuccess: defaultConnOpts !== null,
  });
  const [isLoading, setIsLoading] = useState(true);

  async function tryConnect(connection: NonNullable<ConnOptsNullable>) {
    // flickering when existing conn is invalid (from `content` back to `load-connection`)
    // or losing invalid inputs after trying `options` and reloading? (e.g. want to pre-set values and adjust them later)
    setConnOpts(connection);

    try {
      const response = await myRequest<NonNullable<ConnOptsNullable>, IResSuccess<ISaveConnectionRes>>('/api/db', {
        method: MyRequestMethods.POST,
        body: connection,
      });

      setResult({ isSuccess: true, migrations: response.body.data.migrations });
    } catch (e) {
      console.error("Failed to save connection:", e);
      setResult((o) => {
        o.isSuccess = false;
        return o;
      });
    }
  }

  async function effect(connection: ConnOptsNullable) {
    if (connection === null) {
      return;
    }

    setIsLoading(true);
    await tryConnect(connection);
    setIsLoading(false);
  }

  useEffect(() => {
    void effect(defaultConnOpts)
  }, []);
  useEffect(() => {
    void effect(connOpts)
  }, [connOpts]);

  async function applyMigrations() {
    setIsLoading(true);

    try {
      const res = await myRequest<unknown, IResSuccess<IApplyMigrationsRes>>('/api/db/migrations', {
        method: MyRequestMethods.POST,
      });

      console.log(`Applied migrations: '${res.body.data.appliedMigrations.join("','")}'`);
      setResult((o) => {
        o.isSuccess = true;
        o.migrations = undefined;
        return o;
      });
    } catch (e) {
      setResult((o) => {
        o.isSuccess = false;
        return o;
      });
    }

    setIsLoading(false);
  }

  return <>
    <div className={styles.main}>
      {(
        result.migrations === undefined
          || (
            result.migrations.conflictingIndex === null
            && result.migrations.extra === 0
            && result.migrations.missing === 0
          )
      )
        ? null
        : <ModalElement
          title={"Migrations issue"}
          onClose={() => {}}
          className={styles.modal}
        >
          {
            result.migrations.conflictingIndex === null
              ? null
              : <>
                <div>Applied migration with index {result.migrations.conflictingIndex} is conflicting with pending migrations</div>
                <div>Please resolve it manually!</div>
              </>
          }
          {
            result.migrations.extra === 0
              ? null
              : <>
                <div>There are {result.migrations.extra} more migrations applied than pending.</div>
                <div>Please resolve it manually!</div>
              </>
          }
          {
            result.migrations.missing === 0
              ? null
              : <>
                <div>There are {result.migrations.missing} pending migrations for database. Apply?</div>
                <Button
                  text={"YOLO"}
                  onClick={applyMigrations}
                />
              </>
          }
          <Button
            text={"Later"}
            onClick={() => setResult((o) => {
              o.isSuccess = true;
              return o;
            })}
          />
        </ModalElement>
      }
      {
        result.isSuccess
          ? <IndexContent isLoading={isLoading}/>
          : <LoadConnection isLoading={isLoading} defaultConn={defaultConnOpts} onConnect={setConnOptsLocal}/>
      }
    </div>
  </>
}

export default dynamic(() => Promise.resolve(el), {
  ssr: false,
})
