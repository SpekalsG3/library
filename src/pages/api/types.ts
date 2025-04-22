export type IRequestResponseSuccess<Data extends any> = {
    success: true,
} & (undefined extends Data ? {} : { data: Data })

export enum EDataGroups {
    watching = "watching",
    planned = "planned",
    completed = "completed",
    dropped = "dropped",
}
