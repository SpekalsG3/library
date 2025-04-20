import { useState } from "react";
import cn from "classnames";

import styles from './styles.module.css'
import MoviesPage from "../movies/index.p";
import TvShowsPage from "../tvshows/index.p";

enum EPages {
  movies = "movies",
  tvshows = "tvshows",
}

export function IndexPage () {
  const [page, setPage] = useState(EPages.tvshows);
  return <>
    <div className={styles.main}>
      <div className={styles.contentNav}>
        {
          [
            [EPages.tvshows, "Tv Shows"],
            [EPages.movies, "Movies"],
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
      </div>
    </div>
  </>
}
