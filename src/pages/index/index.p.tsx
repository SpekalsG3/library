import dynamic from "next/dynamic";

import {IndexContent} from "./components/content";
import {LoadConnection} from "./components/load-connection";

import styles from './styles.module.css'
import {tryConnection} from "./components/load-connection/try-connection";
import {useState} from "react";
import {ConnectionOptions, ConnectionTypes} from "@api/db/index.p";

function el() {
  if (typeof window === 'undefined') {
    return null;
  }

  const [connOpts, setConnOpts] = useState<ConnectionOptions<ConnectionTypes> | null>(null);
  const { isSuccess, isLoading, defaultConn } = tryConnection(connOpts);

  function onConnect(opts: ConnectionOptions<ConnectionTypes>) {
    setConnOpts(opts);
  }

  return <>
    <div className={styles.main}>
      {
        isSuccess
          ? <IndexContent isLoading={isLoading}/>
          : <LoadConnection isLoading={isLoading} defaultConn={defaultConn} onConnect={onConnect}/>
      }
    </div>
  </>
}

export const IndexPage = dynamic(() => Promise.resolve(el), {
  ssr: false,
})
