export interface IRequestResponseSuccess<Data> {
    success: true,
    data: Data,
}

export enum EDataGroups {
    watching = "watching",
    planned = "planned",
    completed = "completed",
    dropped = "dropped",
}
