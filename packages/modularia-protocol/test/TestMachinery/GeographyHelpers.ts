export namespace GeographyHelpers {
  export function* neighborsOf([x, y]: [bigint, bigint]): Iterable<[bigint, bigint]> {
    yield [x - 1n, y]
    yield [x + 1n, y]
    yield [x, y - 1n]
    yield [x, y + 1n]
  }
}
