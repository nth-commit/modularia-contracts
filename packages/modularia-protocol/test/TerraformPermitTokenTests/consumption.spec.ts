import { expect } from 'chai'
import { ethers } from 'hardhat'
import { deployTerraformPermitToken } from '../../helpers/DeployHelpers'
import { EthersHelpers } from '../Helpers/EthersHelpers'

describe('TerraformPermitToken', () => {
  describe('setConsumer', () => {
    it('Should require caller to be owner', async () => {
      // Arrange
      const nonOwner = await EthersHelpers.deployRandomSigner()
      const consumer = await EthersHelpers.deployRandomSigner()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.connect(nonOwner).setConsumer(consumer.address)

      // Assert
      await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should only be able to set consumer once', async () => {
      // Arrange
      const consumer = await EthersHelpers.deployRandomSigner()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      await terraformPermitToken.setConsumer(consumer.address)
      const txPromise = terraformPermitToken.setConsumer(consumer.address)

      // Assert
      await expect(txPromise).to.be.revertedWith('Consumer already set')
    })

    it('Should not be able to set consumer to the zero address', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.setConsumer(ethers.constants.AddressZero)

      // Assert
      await expect(txPromise).to.be.revertedWith('Cannot set consumer to zero address')
    })
  })

  describe('consume', () => {
    it('Should revert if called by non-consumer', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)
      const toAddress = await EthersHelpers.createWalletAddress()

      // Act
      const txPromise = terraformPermitToken.consume(toAddress)

      // Assert
      await expect(txPromise).to.be.revertedWith('Caller does not have consumer rights')
    })

    it('Should require token ID to exist', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setConsumer(privileged.address)

      // Act
      const txPromise = terraformPermitToken.connect(privileged).consume(1n)

      // Assert
      await expect(txPromise).to.be.revertedWith('ERC721: invalid token ID')
    })

    it('Should burn token on consumption', async () => {
      // Arrange
      const toAddress = await EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.setConsumer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(toAddress)

      // Act
      await terraformPermitToken.connect(privileged).consume(1n)

      // Assert
      const balance = await terraformPermitToken.balanceOf(toAddress)
      expect(balance).to.equal(0)
    })

    it('Should only be able to consume once per token', async () => {
      // Arrange
      const toAddress = await EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.setConsumer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(toAddress)
      await terraformPermitToken.connect(privileged).consume(1n)

      // Act
      const txPromise = terraformPermitToken.connect(privileged).consume(1n)

      // Assert
      await expect(txPromise).to.be.revertedWith('ERC721: invalid token ID')
    })
  })
})
