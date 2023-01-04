import { expect } from 'chai'
import { BigNumber } from 'ethers'

export function expectBigNumber(actual: BigNumber | number) {
  const asNumber = (x: BigNumber | number): number => (typeof x === 'number' ? x : x.toNumber())

  return {
    toEqual: (other: BigNumber | number) => {
      expect(asNumber(actual)).to.be.eq(asNumber(other))
    },
    toNotEqual: (other: BigNumber | number) => {
      expect(asNumber(actual)).to.not.be.eq(asNumber(other))
    },
    toBeLessThanOrEqual: (other: BigNumber | number) => {
      expect(asNumber(actual)).to.be.lessThanOrEqual(asNumber(other))
    },
  }
}
