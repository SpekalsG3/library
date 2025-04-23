export type IResSuccess<Data extends any> = {
    success: true,
} & (undefined extends Data ? {} : { data: Data })
