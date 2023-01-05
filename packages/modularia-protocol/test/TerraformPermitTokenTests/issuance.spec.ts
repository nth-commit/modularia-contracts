import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import fc from 'fast-check'
import { ethers } from 'hardhat'
import { Arbitrary } from '../TestMachinery/Arbitrary'
import { SystemFixture } from './SystemFixture'

describe('TerraformPermitToken', () => {
  const systemFixture = SystemFixture.create()

  describe('setIssuer', () => {
    it('Should require caller to be owner', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (walletAddress) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.user.terraformPermitToken.setIssuer(walletAddress)

          // Assert
          await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
        })
      )
    })

    it('Should only be able to set issuer once', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (walletAddress) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)
          await agents.owner.terraformPermitToken.setIssuer(walletAddress)

          // Act
          const txPromise = agents.owner.terraformPermitToken.setIssuer(walletAddress)

          // Assert
          await expect(txPromise).to.be.revertedWith('Issuer already set')
        })
      )
    })

    it('Should not be able to set issuer to the zero address', async () => {
      // Arrange
      const { agents } = await loadFixture(systemFixture)

      // Act
      const txPromise = agents.owner.terraformPermitToken.setIssuer(ethers.constants.AddressZero)

      // Assert
      await expect(txPromise).to.be.revertedWith('Cannot set issuer to zero address')
    })
  })

  describe('issue', () => {
    it('Should revert if called by non-issuer', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (toAddress) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.user.terraformPermitToken.issue(toAddress)

          // Assert
          await expect(txPromise).to.be.revertedWith('Caller does not have issuer rights')
        })
      )
    })

    it('Should mint token on issuance', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (toAddress) => {
          // Arrange
          const { agents, routines } = await loadFixture(systemFixture)
          const issuer = await routines.deployPriviligedTerraformPermitTokenActor()

          // Act
          await issuer.issue(toAddress)

          // Assert
          const balance = await agents.user.terraformPermitToken.balanceOf(toAddress)
          expect(balance).to.equal(1)
        })
      )
    })
  })
})
