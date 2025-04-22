import React, {ReactNode, useRef, useState} from "react";

import styles from "./styles.module.css"
import { myRequest, MyRequestError, MyRequestMethods } from "../../../../../../../utils/request";
import Button from "@ui-kit/ui/button";
import { CachedUseFetch } from "../../../../../../../utils/cached-use-fetch";
import { ModalElement } from "@ui-kit/ux/layers/element";
import { KeybindingLayer } from "@ui-kit/ux/layers";
import { MovieDTO } from "../../../../../../../entities/movies";
import { UpdateMovie } from "../../../update-title";
import {IMovieUpdateDTO} from "@api/movies/[id].p";
import {EDataGroups} from "../../../../../../../entities/types";

export function EditTitle(props: {
  onClose: () => void,
  cachedData: CachedUseFetch<EDataGroups, { [id: string]: MovieDTO }>
  itemData: MovieDTO,
}) {
  const data = useRef<MovieDTO>(props.itemData);
  const [confirmationModal, setConfirmationModal] = useState<ReactNode | null>(null);

  const editItem = async () => {
    const body: IMovieUpdateDTO = {
      item: data.current,
    };

    try {
      await myRequest<IMovieUpdateDTO, any>(`/api/movies/${props.itemData.id}`, {
        method: MyRequestMethods.PUT,
        body: body,
      });
      if (data.current.status === props.cachedData.getCurrentKey()) {
        props.cachedData.updateCurrentState((s) => {
          s[props.itemData.id] = data.current
          return s;
        });
      } else {
        props.cachedData.updateStateByKey(data.current.status, (s) => {
          s[props.itemData.id] = data.current;
          return s;
        });
        props.cachedData.updateCurrentState((s) => {
          delete s[props.itemData.id];
          return s;
        });
      }
      props.onClose()
    } catch (e) {
      const error = e as MyRequestError<any>;
      console.log(`failed to edit movie: ${error}`)
    }
  }

  const deleteItem = async () => {
    try {
      await myRequest<undefined, any>(`/api/movies/${props.itemData.id}`, {
        method: MyRequestMethods.DELETE,
      });
      props.cachedData.updateCurrentState((s) => {
        delete s[props.itemData.id];
        return s;
      });
      props.onClose();
    } catch (e) {
      const error = e as MyRequestError<any>;
      console.log(`failed to delete movie: ${error}`);
    }
  }

  function askToConfirmDelete () {
    setConfirmationModal(<ModalElement
      title="You sure you want to delete?"
      onClose={() => setConfirmationModal(null)}
    >
      <Button className={styles.button} text="Yes" onClick={deleteItem}/>
      <KeybindingLayer
        onEscape={() => setConfirmationModal(null)}
        keyHandler={(e) => {
          if (e.shiftKey) {
            if (e.key === "Enter") {
              e.preventDefault();
              void deleteItem()
            }
          }
        }}
      />
    </ModalElement>)
  }

  return <UpdateMovie
    onClose={props.onClose}
    data={data}
    handleKeyboard={(e) => {
      if (e.shiftKey) {
        if (e.key === "Enter") {
          e.preventDefault();
          void editItem();
        } else if (e.key === "Backspace") {
          e.preventDefault();
          askToConfirmDelete();
        }
      }
    }}
    buttons={<>
      <div className={styles.buttons}>
        <Button className={styles.buttonDelete} text="Delete" onClick={askToConfirmDelete}/>
        <Button className={styles.button}       text="Save"   onClick={editItem}/>
      </div>

      {confirmationModal}
    </>}
  />
}
