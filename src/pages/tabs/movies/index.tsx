import { Title } from './components/title'
import React from "react";
import {MovieDTO} from "../../../entities/movies";
import { CardsPanel } from '@ui-kit/panels/cards';
import { AddNewMovie } from './components/title/modals/add-new-title';
import {EDataGroups} from "../../../entities/types";

export default function MoviesPage() {
  return <CardsPanel<MovieDTO, EDataGroups>
    defaultGroup={EDataGroups.planned}
    fetchPathname={"/api/movies"}
    groups={[
      [EDataGroups.planned, "Plan to watch"],
      [EDataGroups.completed, "Completed"],
    ]}
    renderElements={(cachedData, className) => {
      return Object.values(cachedData.getState()?.current ?? {})
        .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
        .map((data) => {
        return (
          <Title
            key={data.id}
            className={className}
            cachedData={cachedData}
            itemData={data}
          />
        )
      })
    }}
    AddNewModal={(props) => <AddNewMovie {...props} />}
  />
}
