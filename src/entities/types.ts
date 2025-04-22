export enum EDataGroups {
  watching = "watching",
  planned = "planned",
  completed = "completed",
  dropped = "dropped",
}

export const CTvShowGroups = [EDataGroups.planned, EDataGroups.completed, EDataGroups.dropped, EDataGroups.watching];
export const CMovieGroups = [EDataGroups.planned, EDataGroups.completed];
