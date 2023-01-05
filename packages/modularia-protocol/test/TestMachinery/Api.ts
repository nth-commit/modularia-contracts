import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ContractTransaction } from 'ethers'
import { TerraformPermitToken as TerraformPermitTokenContract } from '../../typechain-types'

export type TerraformPermitTokenApi = {
  transfer(to: string, tokenId: bigint): unknown
  setIssuer(issuer: string): unknown
  setConsumer(consumer: string): Promise<ContractTransaction>
  issue(to: string): Promise<ContractTransaction>
  consume(tokenId: bigint): Promise<ContractTransaction>
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
      consume: async (tokenId) => terraformPermitToken.consume(tokenId),
      airdrop: async (tokenId) => terraformPermitToken.airdrop(tokenId),
      myBalance: async () => (await terraformPermitToken.balanceOf(actor.address)).toBigInt(),
      balanceOf: async (address) => (await terraformPermitToken.balanceOf(address)).toBigInt(),
      lock: async (tokenId, durationSeconds) => terraformPermitToken.lock(tokenId, durationSeconds),
      unlock: async (tokenId) => terraformPermitToken.unlock(tokenId),
      lockedUntilByTokenId: async (tokenId) => (await terraformPermitToken.lockedUntilByTokenId(tokenId)).toBigInt(),
    }
  }
}
