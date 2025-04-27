import {useMemo, useState} from "react";
import cn from "classnames";
import dynamic from "next/dynamic";

import styles from './styles.module.css'
import TvShowsPage from "../../../tabs/tvshows";
import MoviesPage from "../../../tabs/movies";

enum EPages {
  tvshows = "tvshows",
  movies = "movies",
  map = "map",
}

export function IndexContent (props: {
  isLoading: boolean, // TODO: use
}) {
  const MapPage = useMemo(() => dynamic(
    () => import("../../../tabs/map"),
    {
      ssr: false,
    },
  ), []);

  const [page, setPage] = useState(EPages.tvshows);
  return <>
    <div className={styles.contentNav}>
      {
        [
          [EPages.tvshows, "Tv Shows"],
          [EPages.movies, "Movies"],
          [EPages.map, "Map"],
        ].map(([flag, text], i) => (
          <div
            key={i}
            className={cn(styles.contentNavButton, page === flag && styles.contentNavButtonCurrent)}
            onClick={() => setPage(flag as EPages)}
          >
            {text}
          </div>
        ))
      }
    </div>
    <div className={styles.pages}>
      {page === EPages.tvshows && <TvShowsPage/>}
      {page === EPages.movies && <MoviesPage/>}
      {page === EPages.map && <MapPage/>}
    </div>
  </>
}
