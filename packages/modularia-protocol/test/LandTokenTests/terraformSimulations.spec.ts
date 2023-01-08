import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import { map as ixMap } from 'ix/iterable/operators'
import { LandMetadata } from '../TestMachinery/Api'
import { DeterministicRand } from '../TestMachinery/DeterministicRand'
import { GeographyHelpers } from '../TestMachinery/GeographyHelpers'
import { bigRange } from '../TestMachinery/IterableHelpers'
import { SystemUnderTest } from './SystemUnderTest'

describe('LandToken', () => {
  const systemUnderTestFixture = SystemUnderTest.createFixture()

  describe('terraform simulations', () => {
    it('3x3 world', async () => {
      const sut = await loadFixture(systemUnderTestFixture)
      const worldOfTokenIds = await simulateWorldTerraform(3n, sut)

      const result = WorldModel.renderAsText(worldOfTokenIds, (tokenId) => tokenId.toString())
      expect(result).toMatchSnapshot()
    })

    it('5x5 world', async () => {
      const sut = await loadFixture(systemUnderTestFixture)
      const worldOfTokenIds = await simulateWorldTerraform(5n, sut)

      const result = WorldModel.renderAsText(worldOfTokenIds, (tokenId) => tokenId.toString())
      expect(result).toMatchSnapshot()
    })

    it('9x9 world', async () => {
      const sut = await loadFixture(systemUnderTestFixture)
      const worldOfTokenIds = await simulateWorldTerraform(9n, sut)

      const result = WorldModel.renderAsText(worldOfTokenIds, (tokenId) => tokenId.toString())
      expect(result).toMatchSnapshot()
    })
  })

  async function simulateWorldTerraform(
    size: bigint,
    sut: Awaited<ReturnType<typeof systemUnderTestFixture>>
  ): Promise<WorldModel<bigint>> {
    const rand = DeterministicRand.create(0)

    const worldMintStatus = WorldModel.fill<WorldMintStatus>(size, { type: 'initial' })
    const worldMintCandidates: [bigint, bigint][] = [[0n, 0n]]

    while (worldMintCandidates.length > 0n) {
      const xy = worldMintCandidates.pop()!

      await sut.routines.issuePermitToUser()
      await sut.actors.user.landToken.terraform(xy)
      const tokenId = await sut.actors.user.landToken.tokenIdByCoordinate(xy)
      const metadata = await sut.actors.user.landToken.landMetadataByTokenId(tokenId)
      worldMintStatus.set(xy, { type: 'completed', tokenId, metadata })

      for (const neighborXy of GeographyHelpers.neighborsOf(xy)) {
        if (worldMintStatus.get(neighborXy)?.type === 'initial') {
          const index = Math.ceil(rand.next() * worldMintCandidates.length)
          worldMintCandidates.splice(index, 0, neighborXy)
          worldMintStatus.set(neighborXy, { type: 'queued' })
        }
      }
    }

    return WorldModel.map(worldMintStatus, (status) => (status.type === 'completed' ? status.tokenId : 0n))
  }
})

type WorldMintStatus =
  | {
      type: 'initial'
    }
  | {
      type: 'queued'
    }
  | {
      type: 'completed'
      tokenId: bigint
      metadata: LandMetadata
    }

type WorldModel<T> = {
  get(xy: [bigint, bigint]): T | undefined
  set(xy: [bigint, bigint], value: T): void
  delete(xy: [bigint, bigint]): void
  size(): bigint
  [Symbol.iterator](): IterableIterator<[[bigint, bigint], T]>
}

namespace WorldModel {
  export function empty<T>(): WorldModel<T> {
    return new WorldModelImpl(new Map())
  }

  export function fill<T>(size: bigint, value: T): WorldModel<T> {
    if (size < 1n) throw new Error('World size must be positive.')
    if (size % 2n === 0n) throw new Error('World size must be odd.')

    const startCoordinate = -(size - 1n) / 2n
    const innerMap = new Map(
      bigRange(startCoordinate, size).pipe(
        ixMap((x) => [x, new Map(bigRange(startCoordinate, size).pipe(ixMap((y) => [y, value])))])
      )
    )
    return new WorldModelImpl(innerMap)
  }

  export function map<T, U>(world: WorldModel<T>, f: (value: T) => U): WorldModel<U> {
    const result = empty<U>()
    for (const [xy, value] of world) {
      result.set(xy, f(value))
    }
    return result
  }

  export function renderAsText<T>(world: WorldModel<T>, render: (value: T) => string): string {
    const size = BigInt(Math.sqrt(Number(world.size())))
    const startCoordinate = -(size - 1n) / 2n

    const rows = Array.from(bigRange(startCoordinate, size)).map((rowIx) => {
      const row = Array.from(bigRange(startCoordinate, size)).map((colIx) => {
        const value = world.get([rowIx, colIx])
        const str = value ? render(value) : ''
        return str.padStart(2, ' ')
      })
      return `${row.join(',')}`
    })

    return rows.join('\n')
  }

  class WorldModelImpl<T> implements WorldModel<T> {
    constructor(private readonly map: Map<bigint, Map<bigint, T>>) {}

    get(xy: [bigint, bigint]): T | undefined {
      const [x, y] = xy
      const row = this.map.get(x)
      if (!row) return undefined
      return row.get(y)
    }

    set([x, y]: [bigint, bigint], value: T): void {
      const row = this.map.get(x) || new Map<bigint, T>()
      this.map.set(x, row)
      row.set(y, value)
    }

    delete([x, y]: [bigint, bigint]): void {
      const row = this.map.get(x)
      if (!row) return
      row.delete(y)
      if (row.size === 0) this.map.delete(x)
    }

    size(): bigint {
      return Array.from(this.map.values()).reduce((acc, row) => acc + BigInt(row.size), 0n)
    }

    [Symbol.iterator](): IterableIterator<[[bigint, bigint], T]> {
      const map = this.map
      return (function* () {
        for (const [x, row] of map) {
          for (const [y, value] of row) {
            yield [[x, y], value]
          }
        }
      })()
    }
  }
}
