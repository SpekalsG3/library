import {useLocalStorage} from "../../../../utils/use-local-storage";
import {StorageConnOpts, StorageConnectionKey, StorageConnType} from "../../../../storage/use-storage";
import {Select} from "../../../../components/ui/select";
import {useRef, useState} from "react";
import Button from "../../../../components/ui/button";
import {EInputType, Input} from "../../../../components/ui/input";

import styles from './styles.module.css'

export function LoadStorage() {
  const [connType, setConnType] = useState<StorageConnType>(StorageConnType.Postgres);
  const [connection, setConnection] = useLocalStorage<StorageConnOpts<StorageConnType>>(StorageConnectionKey);

  function defaultConnOptions() {
    const opts: {
      [T in StorageConnType]: StorageConnOpts<T>['options']
    } = {};
    for (const type of Object.values(StorageConnType)) {
      if (connection) {
        opts[type] = connection.type == type
          ? connection.options
          : {};
      } else {
        opts[type] = {};
      }
    }
    return opts;
  }
  const connOptions = useRef(defaultConnOptions())

  function onConnect() {
    setConnection({
      type: connType,
      options: connOptions.current[connType],
    });
  }

  return <div className={styles.content}>
    <div className={styles.title}>Provide storage information</div>
    <div>
      <Select
        className={styles.input}
        tabIndex={0}
        title="Connection type"
        options={[{
          label: "Postgres",
          value: StorageConnType.Postgres,
        // }, {
        //   label: "SQLite3",
        //   value: StorageConnType.SQLite3,
        }]}
        onChange={setConnType}
        value={connType}
      />
      {
        connType != StorageConnType.Postgres
          ? null
          : <>
            <Input
              title="Username"
              onChange={(v) => connOptions.current[connType].user = v}
              type={EInputType.text}
              className={styles.input}
              tabIndex={1}
            />
            <Input
              title="User password"
              onChange={(v) => connOptions.current[connType].password = v}
              type={EInputType.text}
              className={styles.input}
              tabIndex={2}
            />
            <Input
              title="Hostname"
              onChange={(v) => connOptions.current[connType].host = v}
              type={EInputType.text}
              className={styles.input}
              tabIndex={3}
            />
            <Input
              title="Host port"
              onChange={(v) => connOptions.current[connType].port = v}
              type={EInputType.number}
              className={styles.input}
              tabIndex={4}
            />
            <Input
              title="Database name"
              onChange={(v) => connOptions.current[connType].dbName = v}
              type={EInputType.text}
              className={styles.input}
              tabIndex={5}
            />
          </>
      }
    </div>
    <Button className={styles.input} text="Connect" onClick={onConnect} />
  </div>
}
