import { from, IterableX, reduce } from 'ix/iterable'

export function bigRange(start: bigint, count: bigint): IterableX<bigint> {
  return from(
    (function* () {
      for (let i = 0n; i < count; i++) {
        yield start + i
      }
    })()
  )
}

export function bigSum(source: IterableX<bigint>): bigint {
  return reduce(source, (a, b) => a + b, 0n)
}
