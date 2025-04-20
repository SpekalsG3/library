export function nonZeroLength(t: any[] | string | undefined | null): boolean {
    return t !== null && t !== undefined && t.length > 0
}
