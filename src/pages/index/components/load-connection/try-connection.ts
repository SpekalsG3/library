import {useLocalStorage} from "../../../../utils/use-local-storage";
import {StorageConnectionKey} from "./index";
import {myRequest, MyRequestMethods} from "../../../../utils/request";
import {useEffect, useState} from "react";
import {ConnectionOptions, ConnectionTypes} from "@api/db/index.p";

export function tryConnection(connection: null | ConnectionOptions<ConnectionTypes>) {
  const [isLoading, setIsLoading] = useState(true);
  const [defaultConn, setConnection] = useLocalStorage<ConnectionOptions<ConnectionTypes>>(StorageConnectionKey);
  const [isSuccess, setIsSuccess] = useState(defaultConn !== null);

  async function tryConnect() {
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

  useEffect(() => {
    if (connection === null) {
      return;
    }

    setIsLoading(true);
    tryConnect()
      .then(() => setIsLoading(false));
  }, [connection]);

  return { isSuccess, isLoading, defaultConn };
}
