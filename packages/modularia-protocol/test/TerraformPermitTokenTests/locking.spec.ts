import { expect } from 'chai'
import { deployTerraformPermitToken } from '../../helpers/DeployHelpers'
import { EthersHelpers } from '../Helpers/EthersHelpers'
import { time } from '@nomicfoundation/hardhat-network-helpers'

describe('TerraformPermitToken', () => {
  describe('lock', () => {
    it('Should require caller to be owner', async () => {
      // Arrange
      const nonOwner = await EthersHelpers.deployRandomSigner()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.connect(nonOwner).lock(0, 0)

      // Assert
      await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should revert if token does not exist', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.lock(1, 0)

      // Assert
      await expect(txPromise).to.be.revertedWith('Token does not exist')
    })

    it('Should set lockedUntil', async () => {
      // Arrange
      const toAddress = await EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(toAddress)

      // Act
      await terraformPermitToken.lock(1, 1)

      // Assert
      const lockedUntil = await terraformPermitToken.lockedUntilByTokenId(1)
      expect(lockedUntil).to.equal((await time.latest()) + 1)
    })
  })

  describe('unlock', () => {
    it('Should require caller to be owner', async () => {
      // Arrange
      const nonOwner = await EthersHelpers.deployRandomSigner()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.connect(nonOwner).unlock(1)

      // Assert
      await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('Should revert if token does not exist', async () => {
      // Arrange
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      // Act
      const txPromise = terraformPermitToken.unlock(1)

      // Assert
      await expect(txPromise).to.be.revertedWith('Token does not exist')
    })

    it('Should clear lockedUntil', async () => {
      // Arrange
      const toAddress = await EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(toAddress)
      await terraformPermitToken.lock(1, 1)

      // Act
      await terraformPermitToken.unlock(1)

      // Assert
      const lockedUntil = await terraformPermitToken.lockedUntilByTokenId(1)
      expect(lockedUntil).to.equal(0)
    })
  })

  describe('transfer', () => {
    it('Should revert if locked', async () => {
      // Arrange
      const owner = await EthersHelpers.getDefaultSigner()
      const tokenOwner = await EthersHelpers.deployRandomSigner()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(tokenOwner.address)
      await terraformPermitToken.connect(owner).lock(1, 1)

      // Act
      const txPromise = terraformPermitToken
        .connect(tokenOwner)
        .transferFrom(tokenOwner.address, EthersHelpers.createWalletAddress(), 1)

      // Assert
      await expect(txPromise).to.be.revertedWith('Token is locked')
    })

    it('Should transfer if lock expired', async () => {
      // Arrange
      const owner = await EthersHelpers.getDefaultSigner()
      const tokenOwner = await EthersHelpers.deployRandomSigner()
      const toAddress = EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(tokenOwner.address)
      await terraformPermitToken.connect(owner).lock(1, 1)
      await time.setNextBlockTimestamp((await time.latest()) + 2)

      // Act
      await terraformPermitToken.connect(tokenOwner).transferFrom(tokenOwner.address, toAddress, 1)

      // Assert
      const balance = await terraformPermitToken.balanceOf(toAddress)
      expect(balance).to.equal(1)
    })

    it('Can transfer if lock active but token owner is contract owner', async () => {
      // Arrange
      const owner = await EthersHelpers.getDefaultSigner()
      const toAddress = EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(owner.address)
      await terraformPermitToken.connect(owner).lock(1, 1)

      // Act
      await terraformPermitToken.connect(owner).transferFrom(owner.address, toAddress, 1)

      // Assert
      const balance = await terraformPermitToken.balanceOf(toAddress)
      expect(balance).to.equal(1)
    })

    it('Can consume if lock active', async () => {
      // Arrange
      const owner = await EthersHelpers.getDefaultSigner()
      const toAddress = EthersHelpers.createWalletAddress()
      const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(airdropTo, 1n)

      const privileged = await EthersHelpers.deployRandomSigner()
      await terraformPermitToken.setIssuer(privileged.address)
      await terraformPermitToken.setConsumer(privileged.address)
      await terraformPermitToken.connect(privileged).issue(owner.address)
      await terraformPermitToken.connect(owner).lock(1, 1)

      // Act
      await terraformPermitToken.connect(privileged).consume(1)

      // Assert
      const balance = await terraformPermitToken.balanceOf(toAddress)
      expect(balance).to.equal(0)
    })
  })
})
