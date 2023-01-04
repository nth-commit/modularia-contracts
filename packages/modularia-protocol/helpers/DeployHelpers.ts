import { ethers } from 'hardhat'
import { TerraformPermitToken, IERC165 } from '../typechain-types'

export async function deployTerraformPermitToken(
  airdropTo: IERC165,
  airdropMaxSupply: bigint
): Promise<TerraformPermitToken> {
  const factory = await ethers.getContractFactory('TerraformPermitToken')
  const instance = await factory.deploy(airdropTo.address, airdropMaxSupply)
  await instance.deployed()
  return instance
}
