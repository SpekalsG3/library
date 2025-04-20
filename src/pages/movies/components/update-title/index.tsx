import React, { MutableRefObject, ReactNode } from "react";

import styles from './styles.module.css'
import { EInputType, Input } from "../../../../components/ui/input";
import { EnumInput } from "../../../../components/ui/enum-input";
import { Select } from "../../../../components/ui/select";
import { EDataGroups } from "../../../api/types";
import { KeybindingLayer } from "../../../../components/ux/layers";
import { ModalElement } from "../../../../components/ux/layers/element";
import { Movie } from "../../../../entities/movies";

export function UpdateMovie({ data, ...props }: {
  data: MutableRefObject<Movie>,
  onClose: () => void,
  buttons: ReactNode,
  handleKeyboard: (e: KeyboardEvent) => void,
}) {
  const oldValue = { ...data.current };
  function onClose() {
    data.current = oldValue;
    return props.onClose();
  }

  return <ModalElement
    title="Edit movie"
    onClose={onClose}
    className={styles.modal}
  >
    <KeybindingLayer
      onEscape={onClose}
      keyHandler={props.handleKeyboard}
    />
    <Select autoFocus tabIndex={0} className={styles.input} title="Type" type="" value={data.current.status} onChange={(v) => data.current.status = v} options={[
      { value: EDataGroups.planned,   label: "Planned",   },
      { value: EDataGroups.completed, label: "Completed", },
    ]} />
    <Input type={EInputType.text} className={styles.input} title="Title"           value={data.current.title}      onChange={(v) => data.current.title = v} />
    <Input type={EInputType.text} className={styles.input} title="Cover Image Url" value={data.current.cover_url} onChange={(v) => data.current.cover_url = v}/>
    <EnumInput                    className={styles.input} title="Genres"          values={data.current.genres}    onChange={(v) => data.current.genres = v}/>
    <EnumInput                    className={styles.input} title="Tags"            values={data.current.tags}      onChange={(v) => data.current.tags = v}/>
    <Input type={EInputType.textarea} className={styles.input} title="Notes"           value={data.current.notes}      onChange={(v) => data.current.notes = v}/>
    <Input type={EInputType.number}   className={styles.input} title="Length in minutes" placeholder={0} value={data.current.len_min} onChange={(v) => data.current.len_min = v}/>
    <Input type={EInputType.number}   className={styles.input} title="Rewatched times" placeholder={0} value={data.current.rewatched_times} onChange={(v) => data.current.rewatched_times = v}/>
    <Input type={EInputType.number}   className={styles.input} title="Rating" placeholder={10} max={10} value={data.current.score} onChange={(v) => data.current.score = v}/>
    {props.buttons}
  </ModalElement>
}
