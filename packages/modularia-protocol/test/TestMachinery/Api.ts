import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ContractTransaction } from 'ethers'
import {
  LandToken as LandTokenContract,
  StubERC721 as StubERC721Contract,
  TerraformPermitToken as TerraformPermitTokenContract,
} from '../../typechain-types'

export type TerraformPermitTokenApi = {
  transfer(to: string, tokenId: bigint): unknown
  setIssuer(issuer: string): unknown
  setConsumer(consumer: string): Promise<ContractTransaction>
  issue(to: string): Promise<ContractTransaction>
  consumeFrom(owner: string): Promise<ContractTransaction>
  airdrop(tokenId: bigint): Promise<ContractTransaction>
  myBalance(): Promise<bigint>
  balanceOf(address: string): Promise<bigint>
  lock(tokenId: bigint, durationSeconds: bigint): Promise<ContractTransaction>
  unlock(tokenId: bigint): Promise<ContractTransaction>
  lockedUntilByTokenId(tokenId: bigint): Promise<bigint>
}

export namespace TerraformPermitTokenApi {
  export function create(
    terraformPermitToken: TerraformPermitTokenContract,
    actor: SignerWithAddress
  ): TerraformPermitTokenApi {
    terraformPermitToken = terraformPermitToken.connect(actor)
    return {
      transfer: async (to, tokenId) => terraformPermitToken.transferFrom(actor.address, to, tokenId),
      setIssuer: async (issuer) => terraformPermitToken.setIssuer(issuer),
      setConsumer: async (consumer) => terraformPermitToken.setConsumer(consumer),
      issue: async (to) => terraformPermitToken.issue(to),
      consumeFrom: async (owner) => terraformPermitToken.consumeFrom(owner),
      airdrop: async (tokenId) => terraformPermitToken.airdrop(tokenId),
      myBalance: async () => (await terraformPermitToken.balanceOf(actor.address)).toBigInt(),
      balanceOf: async (address) => (await terraformPermitToken.balanceOf(address)).toBigInt(),
      lock: async (tokenId, durationSeconds) => terraformPermitToken.lock(tokenId, durationSeconds),
      unlock: async (tokenId) => terraformPermitToken.unlock(tokenId),
      lockedUntilByTokenId: async (tokenId) => (await terraformPermitToken.lockedUntilByTokenId(tokenId)).toBigInt(),
    }
  }
}

export type StubERC721Api = {
  mint(to: string, tokenId: bigint): Promise<ContractTransaction>
}

export namespace StubERC721Api {
  export function create(erc721: StubERC721Contract, actor: SignerWithAddress): StubERC721Api {
    erc721 = erc721.connect(actor)
    return {
      mint: async (to, tokenId) => erc721.mint(to, tokenId),
    }
  }
}

export type LandMetadata = {
  landType: 'parcel'
}

export type LandTokenApi = {
  terraform(xy: [bigint, bigint]): Promise<ContractTransaction>
  myBalance(): Promise<bigint>
  balanceOf(address: string): Promise<bigint>
  tokenIdByCoordinate(xy: [bigint, bigint]): Promise<bigint>
  landMetadataByTokenId(tokenId: bigint): Promise<LandMetadata>
}

export namespace LandTokenApi {
  export function create(landToken: LandTokenContract, actor: SignerWithAddress): LandTokenApi {
    landToken = landToken.connect(actor)
    return {
      terraform: async (xy) => landToken.terraform(...xy),
      myBalance: async () => (await landToken.balanceOf(actor.address)).toBigInt(),
      balanceOf: async (address) => (await landToken.balanceOf(address)).toBigInt(),
      tokenIdByCoordinate: async (xy) => (await landToken.tokenIdByCoordinate(...xy)).toBigInt(),
      landMetadataByTokenId: async (tokenId) => {
        const landType = await landToken.landMetadataByTokenId(tokenId)
        return {
          landType: toLandType(landType),
        }
      },
    }
  }

  function toLandType(landType: number): LandMetadata['landType'] {
    switch (landType) {
      case 1:
        return 'parcel'
      default:
        throw new Error(`Unknown land type: ${landType}`)
    }
  }
}
