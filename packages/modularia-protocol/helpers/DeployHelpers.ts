import { ethers } from 'hardhat'
import { TerraformPermitToken, IERC165, LandToken } from '../typechain-types'

export async function deployTerraformPermitToken(
  airdropTo: IERC165,
  airdropMaxSupply: bigint
): Promise<TerraformPermitToken> {
  const factory = await ethers.getContractFactory('TerraformPermitToken')
  const instance = await factory.deploy(airdropTo.address, airdropMaxSupply)
  await instance.deployed()
  return instance
}

export async function deployLandToken(terraformPermitToken: TerraformPermitToken): Promise<LandToken> {
  const factory = await ethers.getContractFactory('LandToken')
  const instance = await factory.deploy(terraformPermitToken.address)
  await instance.deployed()
  return instance
}
