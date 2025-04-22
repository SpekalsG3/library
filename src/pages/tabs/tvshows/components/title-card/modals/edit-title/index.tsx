import React, { ReactNode, useRef, useState } from "react";
import { EDataGroups, IRequestResponseSuccess } from "@api/types";
import { UpdateTvShow } from "../../../update-title";

import styles from "./styles.module.css"
import { IEditTvShowReq } from "@api/tvshows/[id].p";
import {CachedUseFetch} from "../../../../../../../utils/cached-use-fetch";
import {TVShowDTO} from "../../../../../../../entities/tv-shows";
import {myRequest, MyRequestError, MyRequestMethods} from "../../../../../../../utils/request";
import { ModalElement } from "@ui-kit/ux/layers/element";
import Button from "@ui-kit/ui/button";
import { KeybindingLayer } from "@ui-kit/ux/layers";

export function EditTitle(props: {
  onClose: () => void,
  cachedData: CachedUseFetch<EDataGroups, { [id: string]: TVShowDTO }>
  itemData: TVShowDTO,
}) {
  const data = useRef<TVShowDTO>(props.itemData);
  const [confirmationModal, setConfirmationModal] = useState<ReactNode | null>(null);

  const editItem = async () => {
    if (
      data.current
        .episodes_count
        // @ts-ignore // UI provides ability to user to update each element individually, and element can be missed
        .includes(undefined)
    ) {
      console.error('Skipped season in episodes_count (set to undefined)');
      return;
    }

    const body: IEditTvShowReq = {
      item: data.current,
    };

    try {
      await myRequest<IEditTvShowReq, IRequestResponseSuccess<undefined>>(`/api/tvshows/${props.itemData.id}`, {
        method: MyRequestMethods.PUT,
        body: body,
      });
      data.current.updated_at = Date.now();
      if (data.current.status === props.cachedData.getCurrentKey()) {
        props.cachedData.updateCurrentState((s) => {
          s[props.itemData.id] = data.current;
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
      props.onClose();
    } catch (e) {
      const error = e as MyRequestError<any>;
      console.error('request error', error)
    }
  }

  const deleteItem = async () => {
    try {
      await myRequest<undefined, undefined>(`/api/tvshows/${props.itemData.id}`, {
        method: MyRequestMethods.DELETE,
      });
      props.cachedData.updateCurrentState((s) => {
        delete s[props.itemData.id];
        return s;
      });
      props.onClose();
    } catch (e) {
      const error = e as MyRequestError<any>;
      console.log(`failed to edit tvshow: ${error}`);
    }
  }

  function askToConfirmDelete() {
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
    </ModalElement>);
  }

  return <UpdateTvShow
    title="Edit tv show"
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
