export type IRequestResponseSuccess<Data extends any> = {
    success: true,
} & (undefined extends Data ? {} : { data: Data })
