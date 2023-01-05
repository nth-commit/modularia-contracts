import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployTerraformPermitToken } from '../../helpers/DeployHelpers'
import { EthersHelpers } from '../Helpers/EthersHelpers'

describe('TerraformPermitToken', () => {
  describe('setIssuer', () => {
    it('Should require caller to be owner', async () => {
      // Arrange
      const nonOwner = await EthersHelpers.deployRandomSigner()
      const issuer = await EthersHelpers.deployRandomSigner()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.connect(nonOwner).setIssuer(issuer.address)

      // Assert
      await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should only be able to set issuer once', async () => {
      // Arrange
      const issuer = await EthersHelpers.deployRandomSigner()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      await terraformPermitToken.setIssuer(issuer.address)
      const txPromise = terraformPermitToken.setIssuer(issuer.address)

      // Assert
      await expect(txPromise).to.be.revertedWith('Issuer already set')
    })

    it('Should not be able to set issuer to the zero address', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.setIssuer(ethers.constants.AddressZero)

      // Assert
      await expect(txPromise).to.be.revertedWith('Cannot set issuer to zero address')
    })
  })

  describe('issue', () => {
    it('Should revert if called by non-issuer', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)
      const toAddress = await EthersHelpers.createWalletAddress()

      // Act
      const txPromise = terraformPermitToken.issue(toAddress)

      // Assert
      await expect(txPromise).to.be.revertedWith('Caller does not have issuer rights')
    })

    it('Should mint token on issuance', async () => {
      // Arrange
      const issuer = await EthersHelpers.deployRandomSigner()
      const toAddress = await EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)
      await terraformPermitToken.setIssuer(issuer.address)

      // Act
      await terraformPermitToken.connect(issuer).issue(toAddress)

      // Assert
      const balance = await terraformPermitToken.balanceOf(toAddress)
      expect(balance).to.equal(1)
    })
  })
})
