import {Select} from "@ui-kit/ui/select";
import {useRef, useState} from "react";
import Button from "@ui-kit/ui/button";
import {EInputType, Input} from "@ui-kit/ui/input";

import styles from './styles.module.css'
import {ConnectionOptions, ConnectionTypes} from "@api/db/index.p";

export const StorageConnectionKey = "storage-connection";

export function LoadConnection(props: {
  defaultConn: null | ConnectionOptions<ConnectionTypes>,
  isLoading: boolean,
  onConnect: (opts: ConnectionOptions<ConnectionTypes>) => void,
}) {
  function defaultConnOptions() {
    const opts: {
      [T in ConnectionTypes]: ConnectionOptions<T>['options']
    } = {};
    for (const type of Object.values(ConnectionTypes)) {
      if (props.defaultConn) {
        opts[type] = props.defaultConn.type === type
          ? props.defaultConn.options
          : {};
      } else {
        opts[type] = {};
      }
    }
    return opts;
  }

  const [connType, setConnType] = useState<ConnectionTypes>(ConnectionTypes.Postgres);
  const connOptsRef = useRef(defaultConnOptions())

  function onConnect() {
    props.onConnect({
      type: connType,
      options: connOptsRef.current[connType],
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
          value: ConnectionTypes.Postgres,
        // }, {
        //   label: "SQLite3",
        //   value: ConnectionTypes.SQLite3,
        }]}
        onChange={setConnType}
        value={connType}
      />
      {
        connType != ConnectionTypes.Postgres
          ? null
          : <>
            <Input
              title="Username"
              onChange={(v) => connOptsRef.current[connType].user = v}
              type={EInputType.text}
              className={styles.input}
              tabIndex={1}
            />
            <Input
              title="User password"
              onChange={(v) => connOptsRef.current[connType].password = v}
              type={EInputType.text}
              className={styles.input}
              tabIndex={2}
            />
            <Input
              title="Hostname"
              onChange={(v) => connOptsRef.current[connType].host = v}
              type={EInputType.text}
              className={styles.input}
              tabIndex={3}
            />
            <Input
              title="Host port"
              onChange={(v) => connOptsRef.current[connType].port = v}
              type={EInputType.number}
              className={styles.input}
              tabIndex={4}
            />
            <Input
              title="Database name"
              onChange={(v) => connOptsRef.current[connType].dbName = v}
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
