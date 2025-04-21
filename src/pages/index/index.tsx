import {IndexContent} from "./components/content";
import {LoadStorage} from "./components/load-storage";

import styles from './styles.module.css'
import {useStorage} from "../../storage/use-storage";

export function IndexPage () {
  const storage = useStorage();

  return <>
    <div className={styles.main}>
      {
        storage
          ? <IndexContent/>
          : <LoadStorage/>
      }
    </div>
  </>
}
