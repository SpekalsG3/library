import React from "react";
import {TVShowDTO} from "../../../entities/tv-shows";
import { CardsPanel } from "@ui-kit/panels/cards";
import { Title } from "./components/title-card";
import { AddNewTvShowModal } from "./components/title-card/modals/add-new-title";
import {EDataGroups} from "../../../entities/types";

export default function TvShowsPage () {
  return <CardsPanel<TVShowDTO, EDataGroups>
    defaultGroup={EDataGroups.watching}
    fetchPathname={"/api/tvshows"}
    groups={[
      [EDataGroups.watching, "Watching"],
      [EDataGroups.planned, "Plan to watch"],
      [EDataGroups.completed, "Completed"],
      [EDataGroups.dropped, "Dropped"],
    ]}
    renderElements={(cachedData, className) => {
      return Object.values(cachedData.getState()?.current ?? {})
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .map((item) => {
          return (
            <Title
              key={item.id}
              className={className}
              cachedData={cachedData}
              itemData={item}
            />
          )
        })
    }}
    AddNewModal={(props) => <AddNewTvShowModal {...props} />}
  />
}
