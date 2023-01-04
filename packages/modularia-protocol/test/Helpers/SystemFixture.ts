import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { range } from 'ix/iterable'
import { EthersHelpers } from './EthersHelpers'

import { ObjectHelpers } from './ObjectHelpers'

export type ContractsCollection = Record<string, Contract>

export type SystemFixtureOptions<Contracts extends ContractsCollection> = {
  createContracts(): Promise<Contracts>
  actors: {
    setupActor(actor: SignerWithAddress, ownerContracts: Contracts): Promise<void>
    count: number
  }
}

export type System<Contracts extends ContractsCollection> = {
  owner: SignerWithAddress
  nonOwner: SignerWithAddress
  contracts: Contracts & ((actor: SignerWithAddress) => Contracts)
  actors: SignerWithAddress[]
}

export type SystemFixture<Contracts extends ContractsCollection> = () => Promise<System<Contracts>>

export namespace SystemFixture {
  export function create<Contracts extends Record<string, Contract>>(
    options: Partial<SystemFixtureOptions<Contracts>>
  ): SystemFixture<Contracts> {
    const { createContracts, actors: actorOptions }: SystemFixtureOptions<Contracts> = {
      createContracts: () => Promise.resolve<Contracts>({} as Contracts),
      actors: {
        count: 0,
        setupActor: () => Promise.resolve(),
      },
      ...options,
    }

    return async function systemFixture(): Promise<System<Contracts>> {
      const [_owner, _nonOwner] = await ethers.getSigners()
      const owner = _owner!
      const nonOwner = _nonOwner!

      const baseContracts = await createContracts()

      const connectContracts = (actor: SignerWithAddress): Contracts =>
        ObjectHelpers.map(baseContracts, (contract) => contract.connect(actor)) as Contracts

      const defaultContracts = connectContracts(nonOwner)

      const actors = await Promise.all(
        Array.from(range(0, actorOptions.count)).map(async () => {
          const actor = await EthersHelpers.deployRandomSigner()
          await actorOptions.setupActor(actor, connectContracts(owner))
          return actor
        })
      )

      return {
        owner,
        nonOwner,
        contracts: Object.assign(connectContracts, defaultContracts),
        actors,
      }
    }
  }
}
