import {useLocalStorage} from "../../../../utils/use-local-storage";
import {StorageConnectionKey} from "./index";
import {myRequest, MyRequestMethods} from "../../../../utils/request";
import {useEffect, useState} from "react";
import {ConnectionOptions, ConnectionTypes} from "@api/db/index.p";

type T = null | ConnectionOptions<ConnectionTypes>;

export function tryConnection(connection: T) {
  const [isLoading, setIsLoading] = useState(true);
  const [defaultConn, setConnection] = useLocalStorage<ConnectionOptions<ConnectionTypes>>(StorageConnectionKey);
  const [isSuccess, setIsSuccess] = useState(defaultConn !== null);

  async function tryConnect(connection: T) {
    try {
      await myRequest('/api/db', {
        method: MyRequestMethods.POST,
        body: connection,
      });

      setConnection(connection);
      setIsSuccess(true);
    } catch (e) {
      console.error("Failed to save connection:", e);
      setIsSuccess(false);
    }
  }

  async function effect(connection: T) {
    if (connection === null) {
      return;
    }

    setIsLoading(true);
    await tryConnect(connection);
    setIsLoading(false);
  }

  useEffect(() => {
    void effect(defaultConn)
  }, []);
  useEffect(() => {
    void effect(connection)
  }, [connection]);

  return { isSuccess, isLoading, defaultConn };
}
