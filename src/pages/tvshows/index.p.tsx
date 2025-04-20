import { Title } from './components/title-card'

import { EDataGroups } from '../api/types';
import { AddNewTvShowModal } from './components/title-card/modals/add-new-title';
import { CardsPanel } from "../../components/panels/cards";
import { TVShow } from "../../entities/tvshows";

export default function TvShowsPage () {
  return <CardsPanel<TVShow, EDataGroups>
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
