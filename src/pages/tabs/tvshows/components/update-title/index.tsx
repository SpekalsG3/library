import React, { MutableRefObject, ReactNode, useState } from "react";
import cn from 'classnames';

import styles from './styles.module.css'
import { EDataGroups } from "@api/types";
import {TVShowDTO} from "../../../../../entities/tv-shows";
import { ModalElement } from "@ui-kit/ux/layers/element";
import { KeybindingLayer } from "@ui-kit/ux/layers";
import { Select } from "@ui-kit/ui/select";
import {EInputType, Input} from "@ui-kit/ui/input";
import { EnumInput } from "@ui-kit/ui/enum-input";
import Button from "@ui-kit/ui/button";

export function UpdateTvShow({ data, ...props }: {
  data: MutableRefObject<TVShowDTO>,
  title: string,
  onClose: () => void,
  buttons: ReactNode,
  handleKeyboard: (e: KeyboardEvent) => void,
}) {
  const oldValue = { ...data.current };
  function onClose () {
    data.current = oldValue;
    return props.onClose();
  }

  const [episodesCountList, setEpisodesCountList] = useState<Array<undefined | number>>(data.current.episodes_count);

  return <ModalElement
    title={props.title}
    onClose={onClose}
    className={styles.modal}
  >
    <KeybindingLayer
      onEscape={onClose}
      keyHandler={props.handleKeyboard}
    />
    <Select autoFocus tabIndex={0} className={styles.input} title="Type" value={data.current.status} onChange={(v) => data.current.status = v} options={[
      { value: EDataGroups.planned,   label: "Planned",   },
      { value: EDataGroups.watching,  label: "Watching",  },
      { value: EDataGroups.completed, label: "Completed", },
      { value: EDataGroups.dropped,   label: "Dropped",   },
    ]} />
    <Input type={EInputType.text} className={styles.input} title="Title" value={data.current.title} onChange={(v) => data.current.title = v} />
    <Input type={EInputType.text} className={styles.input} title="Cover Image Url" value={data.current.cover_url} onChange={(v) => data.current.cover_url = v}/>
    <EnumInput className={styles.input} title="Genres" values={data.current.genres} onChange={(v) => data.current.genres = v}/>
    <EnumInput className={styles.input} title="Tags" values={data.current.tags} onChange={(v) => data.current.tags = v}/>
    <Input type={EInputType.textarea} className={cn(styles.input, styles.inputNotes)} classNameInner={styles.notes} title="Notes" value={data.current.notes} onChange={(v) => data.current.notes = v}/>
    <Input type={EInputType.number} className={styles.input} title="Average episode length in minutes" placeholder={0} value={data.current.avg_ep_len_min} onChange={(v) => data.current.avg_ep_len_min = v}/>
    <div className={styles.inputColumns}>
      <div className={cn(styles.inputColumn, styles.inputList)}>
        {episodesCountList
          .map((el, i) => (
            <Input key={i} title={`${i+1}:`} type={EInputType.number} className={styles.inputListRow} classNameInner={styles.inputListRowValue} onChange={(v) => data.current.episodes_count[i] = v} value={el} placeholder={1}/>
          ))}
        <Button text="More seasons" onClick={() => setEpisodesCountList([...episodesCountList, undefined])} className={styles.inputListButton} />
      </div>
      <div className={styles.inputColumn}>
        <Input type={EInputType.number} className={styles.input} title="Last watched season" placeholder={0} value={data.current.last_watched_season} onChange={(v) => data.current.last_watched_season = v}/>
        <Input type={EInputType.number} className={styles.input} title="Last watched episode" placeholder={0} value={data.current.last_watched_episode} onChange={(v) => data.current.last_watched_episode = v}/>
      </div>
    </div>
    {props.buttons}
  </ModalElement>
}
