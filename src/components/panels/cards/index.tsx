import {ReactElement, ReactNode, useEffect, useState} from 'react'
import cn from 'classnames'

import styles from './styles.module.css'
import { CachedUseFetch } from "../../../utils/cached-use-fetch";
import {KeybindingLayer} from "../../ux/layers";

export function CardsPanel<TElement, TGroups>(props: {
  fetchPathname: string,
  defaultGroup: TGroups,
  groups: [TGroups, string][],
  renderElements: (
    cachedData: CachedUseFetch<TGroups, { [id: string]: TElement }>,
    className: string,
  ) => ReactElement[],
  AddNewModal: (props: {
    onClose: () => void,
    cachedData: CachedUseFetch<TGroups, { [id: string]: TElement }>
  }) => ReactNode,
}) {
  const [modal, setModal] = useState<ReactNode | null>(null);

  const cachedData = new CachedUseFetch<TGroups, {[id: string]: TElement}>(props.defaultGroup);
  const data = cachedData.useFetch((currentKey) => {
    const url = new URL(window.location.origin);
    url.pathname = props.fetchPathname;
    url.searchParams.set('status', currentKey as string);
    return url;
  });

  const [elements, setElements] = useState<ReactElement[]>([]);
  useEffect(() => {
    setElements(props.renderElements(cachedData, styles.item));
  }, [data]);

  function removeAddNewLayer() {
    setModal(null);
  }
  function createAddNewLayer() {
    setModal(props.AddNewModal({
      onClose: removeAddNewLayer,
      cachedData,
    }));
  }

  return (
    <div className={styles.content}>
      <div className={styles.contentNav}>
        {
          props.groups.map(([flag, text], i) => (
            <div
              key={i}
              className={cn(
                styles.contentNavButton,
                cachedData.getCurrentKey() === flag && styles.contentNavButtonCurrent
              )}
              onClick={() => cachedData.setCurrentKey(flag)}
            >
              {text}
            </div>
          ))
        }
        <div
          className={cn(styles.contentNavButtonAdd, 'symbol')}
          onClick={createAddNewLayer}
        >
          add
        </div>
      </div>
      <div className={styles.contentWrapper}>
        <div
          className={styles.contentTitles}
          style={{
            width: '100%',
          }}
        >
          {elements}
        </div>
      </div>
      {modal}
      <KeybindingLayer
        onEscape={removeAddNewLayer}
        keyHandler={(e: KeyboardEvent) => {
          if (e.shiftKey) {
            if (e.key === "N") {
              createAddNewLayer();
            }
          }
        }}
      />
    </div>
  )
}
