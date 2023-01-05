import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { EthersHelpers } from './EthersHelpers'

import { ObjectHelpers } from './ObjectHelpers'

export type ContractsCollection = Record<string, Contract>

export type SignerNameCollection = ReadonlyArray<string>

export type RawSystemFixtureOptions<Contracts extends ContractsCollection, SignerNames extends SignerNameCollection> = {
  createContracts(): Promise<Contracts>
  signerNames: SignerNames
}

export type System<Contracts extends ContractsCollection, SignerNames extends SignerNameCollection> = {
  owner: SignerWithAddress
  nonOwner: SignerWithAddress
  contracts: Contracts & ((actor: SignerWithAddress) => Contracts)
  signers: Record<SignerNames[number], SignerWithAddress>
}

export type RawSystemFixture<
  Contracts extends ContractsCollection,
  SignerNames extends SignerNameCollection
> = () => Promise<System<Contracts, SignerNames>>

export namespace RawSystemFixture {
  export function create<Contracts extends ContractsCollection, SignerNames extends SignerNameCollection>(
    options: Partial<RawSystemFixtureOptions<Contracts, SignerNames>>
  ): RawSystemFixture<Contracts, SignerNames> {
    const { createContracts, signerNames }: RawSystemFixtureOptions<Contracts, SignerNames> = {
      createContracts: () => Promise.resolve<Contracts>({} as Contracts),
      signerNames: [] as unknown as SignerNames,
      ...options,
    }

    return async function systemFixture(): Promise<System<Contracts, SignerNames>> {
      const [_owner, _nonOwner] = await ethers.getSigners()
      const owner = _owner!
      const nonOwner = _nonOwner!

      const baseContracts = await createContracts()

      const connectContracts = (actor: SignerWithAddress): Contracts =>
        ObjectHelpers.map(baseContracts, (contract) => contract.connect(actor)) as Contracts

      const defaultContracts = connectContracts(nonOwner)

      const signersAndNames = await Promise.all(
        signerNames.map(async (name) => ({
          name: name as SignerNames[number],
          signer: await EthersHelpers.deployRandomSigner(),
        }))
      )
      const signers = signersAndNames.reduce((acc, { name, signer }) => {
        acc[name] = signer
        return acc
      }, {} as Record<SignerNames[number], SignerWithAddress>)

      return {
        owner,
        nonOwner,
        contracts: Object.assign(connectContracts, defaultContracts),
        signers,
      }
    }
  }
}
