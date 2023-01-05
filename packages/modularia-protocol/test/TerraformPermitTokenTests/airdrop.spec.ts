import { expect } from 'chai'
import { deployTerraformPermitToken } from '../../helpers/DeployHelpers'
import { EthersHelpers } from '../Helpers/EthersHelpers'

describe('TerraformPermitToken', () => {
  describe('airdrop', () => {
    it('Should require max airdrop supply to to not be exceeded', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)
      await airdropTo.mint(await EthersHelpers.createWalletAddress(), 1)
      await airdropTo.mint(await EthersHelpers.createWalletAddress(), 2)
      await terraformPermitToken.airdrop(1)

      // Act
      const txPromise = terraformPermitToken.airdrop(2)

      // Assert
      await expect(txPromise).to.be.revertedWith('Airdrop max supply reached')
    })

    it('Should require token ID to not already have airdrop', async () => {
      // Arrange
      const owner = await EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 2n)
      await airdropTo.mint(owner, 1)
      await terraformPermitToken.airdrop(1)

      // Act
      const txPromise = terraformPermitToken.airdrop(1)

      // Assert
      await expect(txPromise).to.be.revertedWith('Airdrop already completed for token ID')
    })

    it('Should require token ID to be valid ID of the airdrop token', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.airdrop(1)

      // Assert
      await expect(txPromise).to.be.revertedWith('Error looking up owner of token ID, the token may not exist')
    })

    it('Should mint terraform permit token', async () => {
      // Arrange
      const owner = await EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)
      await airdropTo.mint(owner, 1)

      // Act
      await terraformPermitToken.airdrop(1)

      // Assert
      const balance = await terraformPermitToken.balanceOf(owner)
      expect(balance).to.equal(1)
    })
  })
})
