import cn from 'classnames'

import styles from './title.module.css'
import { type ReactNode, useState } from "react";
import { EditTitle } from "./modals/edit-title";
import {CachedUseFetch} from "../../../../../utils/cached-use-fetch";
import {EDataGroups} from "@api/types";
import {MovieDTO} from "../../../../../entities/movies";

export function Title ({ itemData, ...props }: {
  className?: string,
  cachedData: CachedUseFetch<EDataGroups, { [id: string]: MovieDTO }>
  itemData: MovieDTO,
}) {
  const [modal, setModal] = useState<ReactNode | null>(null);

  return (<>
    <div className={cn(styles.title, props.className)}>
      <div className={styles.titleCover}>
        <div
          className={styles.titleCoverInner}
          style={{
            backgroundImage: `url(${itemData.cover_url})`,
          }}
        />
        <div title="Score" className={styles.titleRate}>{`${itemData.score ?? '-'}`}</div>
        <div onClick={() => setModal(<EditTitle
          cachedData={props.cachedData}
          itemData={itemData}
          onClose={() => setModal(null)}
        />)} className={cn(styles.titleEditIcon, 'symbol')}>edit_square</div>
        {itemData.rewatched_times !== undefined &&
          <div title="Rewatched times" className={styles.titleRewatchedTimes}>+{itemData.rewatched_times}</div>
        }
      </div>
      <div className={styles.secondHalf}>
        <div className={styles.titleInfoTitle}>{itemData.title}</div>
        <div className={styles.titleEpisodeInfo}>
          <div className={styles.titleInfoItem}>{itemData.len_min}m</div>
        </div>
      </div>
      <div className={styles.titleInfoType}>Movie</div>
    </div>
    {modal}
  </>)
}
