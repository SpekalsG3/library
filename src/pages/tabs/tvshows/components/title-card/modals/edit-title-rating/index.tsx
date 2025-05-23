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

export function EditTitleRating (props: {
    onClose: () => void,
    cachedData: CachedUseFetch<EDataGroups, { [id: string]: TVShowDTO }>
    itemData: TVShowDTO,
}) {
    const newScore = useRef<TVShowDTO['score']>(props.itemData.score)

    const editItem = async () => {
        const data: IEditTvShowReq = {
            item: {
                ...props.itemData,
                score: newScore.current,
            },
        };

        try {
            await myRequest<IEditTvShowReq, any>(`/api/tvshows/${props.itemData.id}`, {
                method: MyRequestMethods.PUT,
                body: data,
            });
            props.itemData.score = newScore.current;
            props.cachedData.updateCurrentState((s) => {
                s[props.itemData.id] = props.itemData;
                return s;
            });
            props.onClose();
        } catch (e) {
            const error = e as MyRequestError<any>;
            console.log(`failed to edit tvshow raiting: ${error}`)
        }
    }

    const onScoreChange = (season: number, value: number | undefined) => {
        let score: {
            [season: number]: number | undefined
        } = newScore.current === undefined ? {} : {...newScore.current}

        if (value === undefined) {
            delete score[season];
        } else {
            score[season] = value;
        }

        if (Object.keys(score).length === 0) {
            newScore.current = null;
        } else {
            newScore.current = score;
        }
    }

    let lastGivenRating: undefined | number;
    const inputs = [];
    for (let i = 1; i <= props.itemData.episodes_count.length; i++) {
        const ratingReal = newScore.current?.[i];
        const ratingProject = ratingReal ?? lastGivenRating;
        lastGivenRating = ratingProject;

        inputs.push(
          <Input
            autoFocus={i === 1}
            tabIndex={i}
            key={i}
            className={styles.ratingField}
            classNameTitle={styles.ratingFieldTitle}
            classNameInner={styles.ratingFieldInner}
            title={`Season ${i}`}
            onChange={(v) => onScoreChange(i, v)}
            type={EInputType.number}
            value={ratingReal}
            placeholder={ratingProject ?? 10}
            max={10}
            min={0}
          />
        )
    }

    return <ModalElement
      title={`${props.itemData.title} score`}
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
