import { Title } from './components/title'
import React from "react";
import {Movie} from "../../../entities/movies";
import {EDataGroups} from "@api/types";
import { CardsPanel } from '@ui-kit/panels/cards';
import { AddNewMovie } from './components/title/modals/add-new-title';

export default function MoviesPage() {
  return <CardsPanel<Movie, EDataGroups>
    defaultGroup={EDataGroups.planned}
    fetchPathname={"/api/movies"}
    groups={[
      [EDataGroups.planned, "Plan to watch"],
      [EDataGroups.completed, "Completed"],
    ]}
    renderElements={(cachedData, className) => {
      return Object.values(cachedData.getState()?.current ?? {})
        .sort((a, b) => b.updated_at - a.updated_at)
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
