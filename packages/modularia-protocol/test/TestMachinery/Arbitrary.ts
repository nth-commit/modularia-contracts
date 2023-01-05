import fc from 'fast-check'
import { range } from 'ix/iterable'

export namespace Arbitrary {
  export function two<T>(arb: fc.Arbitrary<T>): fc.Arbitrary<[T, T]> {
    return fc.uniqueArray(arb, { minLength: 2, maxLength: 2 }).map((arr) => arr as [T, T])
  }

  export type BigIntConstraints = {
    min?: bigint
    max?: bigint
  }

  export function bigInt(constraints: BigIntConstraints): fc.Arbitrary<bigint> {
    const safeConstraints: fc.IntegerConstraints = {}

    if (constraints.min !== undefined) {
      safeConstraints.min = Number(constraints.min)
    }

    if (constraints.max !== undefined) {
      safeConstraints.max = Number(constraints.max)
    }

    return fc.integer(safeConstraints).map((i) => BigInt(i))
  }

  export type BigNatConstraints = {
    min?: bigint
    max?: bigint
  }

  export function bigNat(constraints: BigNatConstraints = {}): fc.Arbitrary<bigint> {
    const bigIntConstraints: BigIntConstraints = {
      ...constraints,
      min: constraints.min ?? 0n,
    }

    return bigInt(bigIntConstraints)
  }

  export function tokenId(): fc.Arbitrary<bigint> {
    return bigNat()
  }

  export function walletAddress(): fc.Arbitrary<string> {
    return fc.hexaString({ minLength: 40, maxLength: 40 }).map((hex) => `0x${hex}`)
  }
}
