import React, { useRef } from "react";

import styles from './styles.module.css'
import { EDataGroups } from "@api/types";
import { MyRequestError, MyRequestMethods, myRequest } from "../../../../../../../utils/request";
import Button from "@ui-kit/ui/button";
import { CachedUseFetch } from "../../../../../../../utils/cached-use-fetch";
import { TVShowDTO } from "../../../../../../../entities/tv-shows";
import {ICreateTvSHowItemReq} from "@api/tvshows/index.p";
import { UpdateTvShow } from "../../../update-title";

export function AddNewTvShowModal(props: {
  onClose: () => void,
  cachedData: CachedUseFetch<EDataGroups, { [id: string]: TVShowDTO }>
}) {
  const data = useRef<TVShowDTO>({
    status: props.cachedData.getCurrentKey(),
    episodes_count: [],
  } as Partial<TVShowDTO> as TVShowDTO);

  const saveNewItem = async () => {
    const body: ICreateTvSHowItemReq = {
      item: data.current,
    };

    try {
      const res = await myRequest<ICreateTvSHowItemReq, number>(`/api/tvshows`, {
        method: MyRequestMethods.POST,
        body: body,
      });
      data.current.id = res.body.data;
      data.current.created_at = Date.now();
      data.current.updated_at = Date.now();
      props.cachedData.updateCurrentState((s) => {
        s[data.current.id] = data.current;
        return s;
      });
      props.onClose();
    } catch (e) {
      const error = e as MyRequestError<any>;
      console.error(`failed to add new tvshow: ${error}`);
    }
  }

  function handleKey (e: KeyboardEvent) {
    if (e.shiftKey) {
      if (e.key === "Enter") {
        e.preventDefault();
        void saveNewItem();
      }
    }
  }

  return <UpdateTvShow
    title={"Add new TVShow"}
    onClose={props.onClose}
    data={data}
    buttons={<Button className={styles.button} text="Save" onClick={saveNewItem}/>}
    handleKeyboard={handleKey}
  />
}
