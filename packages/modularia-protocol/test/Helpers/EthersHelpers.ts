import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network } from 'hardhat'
import { range } from 'ix/iterable'
import { IERC721, StubERC721 } from '../../typechain-types'

export namespace EthersHelpers {
  export async function getDefaultSigner(): Promise<SignerWithAddress> {
    const [defaultSigner] = await ethers.getSigners()
    return defaultSigner!
  }

  export function createWalletAddress(): string {
    return ethers.Wallet.createRandom().address
  }

  export function createWalletAddresses(n: number): string[] {
    return Array.from(range(0, n)).map(createWalletAddress)
  }

  export async function deployRandomSigner(): Promise<SignerWithAddress> {
    const address = createWalletAddress()

    // Give em some ETH for gas and whatnot
    donateEth(address)

    return await ethers.getImpersonatedSigner(address)
  }

  export async function donateEth(address: string): Promise<void> {
    await network.provider.send('hardhat_setBalance', [address, '0x10000000000000000000'])
  }

  export namespace IERC721 {
    export async function deployStubERC721(): Promise<StubERC721 & IERC721> {
      const deployer = await ethers.getContractFactory('StubERC721')
      const instance = await deployer.deploy()
      return instance as StubERC721 & IERC721
    }
  }
}
