import React, { useRef } from "react";

import styles from './styles.module.css'
import { MyRequestError, MyRequestMethods, myRequest } from "../../../../../../../utils/request";
import Button from "@ui-kit/ui/button";
import { CachedUseFetch } from "../../../../../../../utils/cached-use-fetch";
import { MovieDTO } from "../../../../../../../entities/movies";
import { UpdateMovie } from "../../../update-title";
import {IMoviesCreateDTO} from "@api/movies/index.p";
import {EDataGroups} from "../../../../../../../entities/types";

export function AddNewMovie(props: {
  onClose: () => void,
  cachedData: CachedUseFetch<EDataGroups, { [id: string]: MovieDTO }>
}) {
  const data = useRef<MovieDTO>({
    status: props.cachedData.getCurrentKey(),
  } as Partial<MovieDTO> as MovieDTO);

  const saveNewItem = async () => {
    const body: IMoviesCreateDTO = {
      item: data.current,
    };

    try {
      const res = await myRequest<IMoviesCreateDTO, number>(`/api/movies`, {
        method: MyRequestMethods.POST,
        body: body,
      });
      data.current.id = res.body.data;
      props.cachedData.updateCurrentState((s) => {
        s[data.current.id] = data.current;
        return s;
      });
      props.onClose()
    } catch (e) {
      const error = e as MyRequestError<any>;
      console.log(`failed to add new movie: ${error}`);
    }
  }

  const handleKey = (e: KeyboardEvent) => {
    if (e.shiftKey) {
      if (e.key === "Enter") {
        e.preventDefault();
        void saveNewItem();
      }
    }
  }

  return <UpdateMovie
    onClose={props.onClose}
    data={data}
    buttons={<Button className={styles.button} text="Save" onClick={saveNewItem}/>}
    handleKeyboard={handleKey}
  />
}
