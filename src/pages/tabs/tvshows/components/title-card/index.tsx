import cn from 'classnames'

import styles from './title.module.css'
import { EDataGroups, } from "@api/types";
import { EditTitle } from "./modals/edit-title";
import { CachedUseFetch } from "../../../../../utils/cached-use-fetch";
import { EditTitleRewatch } from "./modals/edit-title-rewatch";
import { EditTitleRating} from "./modals/edit-title-rating";
import { type ReactNode, useState } from "react";
import { TVShow } from "../../../../../entities/tvshows";

function calculateScore(item: TVShow): number | null {
  let sum: number | undefined;
  const score = item.score ?? {};
  if (score !== undefined && Object.keys(score).length > 0) {
    sum = score[1] as number; // by the nature of score, rating is given starting with first season
    let lastGivenRating = sum;

    for (let i = 2; i <= item.episodes_count.length; i++) {
      const ratingReal = score[i];
      const ratingProject = ratingReal ?? lastGivenRating;

      sum += ratingProject;
      lastGivenRating = ratingProject;
    }
  }
  if (sum === undefined) {
    return null;
  } else {
    const scoreRaw = (sum / item.episodes_count.length).toFixed(1);
    return Number(scoreRaw);
  }
}

function calculateRewatch(item: TVShow): number | null {
  let sum: number | undefined;
  const rtimes = item.rewatched_times ?? {};
  if (rtimes !== undefined && Object.keys(rtimes).length > 0) {
    sum = 0;
    let lastGivenRating = 0;

    for (let i = item.episodes_count.length; i > 0; i--) {
      const ratingReal = rtimes[i];
      const ratingProject = ratingReal ?? lastGivenRating;

      sum += ratingProject;
      lastGivenRating = ratingProject;
    }
  }
  if (sum === undefined) {
    return null;
  } else {
    const scoreRaw = (sum / item.episodes_count.length).toFixed(1);
    return Number(scoreRaw);
  }
}

export function Title ({ itemData, ...props }: {
  className?: string,
  cachedData: CachedUseFetch<EDataGroups, { [id: string]: TVShow }>
  itemData: TVShow,
}) {
  const [modal, setModal] = useState<ReactNode | null>(null);

  const isFinished = itemData.last_watched_season == itemData.episodes_count.length
    && itemData.last_watched_episode == itemData.episodes_count.at(-1);

  const score = calculateScore(itemData);
  const rewatch = calculateRewatch(itemData);

  return (<>
    <div className={cn(styles.title, props.className)}>
      <div className={styles.titleCover}>
        <div
          className={styles.titleCoverInner}
          style={{
            backgroundImage: `url(${itemData.cover_url})`,
          }}
        />
        <div className={cn(
          styles.titleCoverLastep,
          {
            [styles.titleCoverLastep__finished]: isFinished,
            [styles.titleCoverLastep__new]: !isFinished,
          },
        )}>
          {`Ss ${itemData.last_watched_season ?? '-'} Ep ${itemData.last_watched_episode ?? '-'}`}
        </div>
        <div
          title="Edit score"
          className={styles.titleRate}
          onClick={() => setModal(<EditTitleRating
            cachedData={props.cachedData}
            itemData={itemData}
            onClose={() => setModal(null)}
          />)}
        >
          {score ?? '-'}
        </div>
        <div
          className={cn(styles.titleEditIcon, 'symbol')}
          onClick={() => setModal(<EditTitle
            cachedData={props.cachedData}
            itemData={itemData}
            onClose={() => setModal(null)}
          />)}
        >edit_square
        </div>
        <div
          title="Rewatched times"
          className={styles.titleRewatchedTimes}
          onClick={() => setModal(<EditTitleRewatch
            cachedData={props.cachedData}
            itemData={itemData}
            onClose={() => setModal(null)}
          />)}
        >
          {/*have to show '-' here because to edit rewatch we need to open another modal and this is the entry*/}
          {rewatch ?? '-'}
        </div>
      </div>
      <div className={styles.secondHalf}>
        <div className={styles.titleInfoTitle}>{itemData.title}</div>
        <div className={styles.titleEpisodeInfo}>
          <div className={styles.titleInfoItem}>Ss {itemData.episodes_count.length}</div>
          <div className={styles.titleInfoEpisodes}>
            <div
              className={styles.titleInfoEpisodesTotal}>
              Total {itemData.episodes_count.reduce((a, b) => a + b, 0)}
            </div>
            Eps {
            (itemData.last_watched_season && itemData.last_watched_episode)
              ? itemData.episodes_count
                .slice(0, itemData.last_watched_season - 1)
                .reduce((a, b) => a + b, 0)
              + itemData.last_watched_episode
              : "-"
          }
          </div>
          <div className={styles.titleInfoItem}>~{itemData.avg_ep_len_min}m</div>
        </div>
      </div>
      <div className={styles.titleInfoType}>Tv Show</div>
    </div>
    {modal}
  </>)
}
