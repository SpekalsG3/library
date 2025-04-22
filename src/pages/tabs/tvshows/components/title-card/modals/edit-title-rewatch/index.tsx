import { useRef } from "react";

import styles from './styles.module.css'
import { IEditTvShowReq } from "@api/tvshows/[id].p";
import {CachedUseFetch} from "../../../../../../../utils/cached-use-fetch";
import {TVShowDTO} from "../../../../../../../entities/tv-shows";
import {myRequest, MyRequestError, MyRequestMethods} from "../../../../../../../utils/request";
import {EInputType, Input} from "@ui-kit/ui/input";
import { ModalElement } from "@ui-kit/ux/layers/element";
import Button from "@ui-kit/ui/button";
import { KeybindingLayer } from "@ui-kit/ux/layers";
import {EDataGroups} from "../../../../../../../entities/types";

export function EditTitleRewatch (props: {
  onClose: () => void,
  cachedData: CachedUseFetch<EDataGroups, { [id: string]: TVShowDTO }>
  itemData: TVShowDTO,
}) {
  const newRewatch = useRef<TVShowDTO['rewatched_times']>(props.itemData.rewatched_times)

  const editItem = async () => {
    const data: IEditTvShowReq = {
      item: {
        ...props.itemData,
        rewatched_times: newRewatch.current,
      },
    };

    try {
      await myRequest<IEditTvShowReq, any>(`/api/tvshows/${props.itemData.id}`, {
        method: MyRequestMethods.PUT,
        body: data,
      });
      props.itemData.rewatched_times = newRewatch.current;
      props.itemData.updated_at = Date.now();
      props.cachedData.updateCurrentState((s) => {
        s[props.itemData.id] = props.itemData;
        return s;
      })
      props.onClose();
    } catch (e) {
      const error = e as MyRequestError<any>;
      console.log(`failed to edit tvshow rewatch: ${error}`);
    }
  }

  const onRewatchChange = (season: number, value: number | undefined) => {
    let rewatch = newRewatch.current === undefined ? {} : {...newRewatch.current}

    if (value === undefined) {
      delete rewatch[season];
    } else {
      rewatch[season] = value;
    }

    if (Object.keys(rewatch).length === 0) {
      newRewatch.current = null;
    } else {
      newRewatch.current = rewatch;
    }
  }

  let lastGivenRating: undefined | number;
  const inputs = [];
  for (let i = props.itemData.episodes_count.length; i > 0; i--) {
    const ratingReal = newRewatch.current?.[i];
    const ratingProject = ratingReal ?? lastGivenRating;
    lastGivenRating = ratingProject;

    inputs.unshift(
      <Input
        autoFocus={i === 1}
        tabIndex={i}
        key={i}
        className={styles.ratingField}
        classNameTitle={styles.ratingFieldTitle}
        classNameInner={styles.ratingFieldInner}
        title={`Season ${i}`}
        onChange={(v) => onRewatchChange(i, v)}
        type={EInputType.number}
        value={ratingReal}
        placeholder={ratingProject ?? 0}
        min={0}
      />
    )
  }

  return <ModalElement
    title={`${props.itemData.title} re-watched times`}
    onClose={props.onClose}
    className={styles.modal}
  >
    {inputs}
    <Button className={styles.button} text="Save" onClick={editItem}/>
    <KeybindingLayer
      keyHandler={(e) => {
        if (e.shiftKey) {
          if (e.key === "Enter") {
            e.preventDefault();
            void editItem();
          }
        }
      }}
      onEscape={props.onClose}
    />
  </ModalElement>
}
