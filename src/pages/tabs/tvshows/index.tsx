import React from "react";
import {TVShowDTO} from "../../../entities/tv-shows";
import {EDataGroups} from "@api/types";
import { CardsPanel } from "@ui-kit/panels/cards";
import { Title } from "./components/title-card";
import { AddNewTvShowModal } from "./components/title-card/modals/add-new-title";

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
        .sort((a, b) => b.updated_at - a.updated_at)
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
