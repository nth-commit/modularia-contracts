import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import fc from 'fast-check'
import { ethers } from 'hardhat'
import { Arbitrary } from '../TestMachinery/Arbitrary'
import { SystemFixture } from './SystemFixture'

describe('TerraformPermitToken', () => {
  const systemFixture = SystemFixture.create()

  describe('setConsumer', () => {
    it('Should require caller to be owner', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (consumerAddress) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.user.terraformPermitToken.setConsumer(consumerAddress)

          // Assert
          await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
        })
      )
    })

    it('Should only be able to set consumer once', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (consumerAddress) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          await agents.owner.terraformPermitToken.setConsumer(consumerAddress)
          const txPromise = agents.owner.terraformPermitToken.setConsumer(consumerAddress)

          // Assert
          await expect(txPromise).to.be.revertedWith('Consumer already set')
        })
      )
    })

    it('Should not be able to set consumer to the zero address', async () => {
      // Arrange
      const { agents } = await loadFixture(systemFixture)

      // Act
      const txPromise = agents.owner.terraformPermitToken.setConsumer(ethers.constants.AddressZero)

      // Assert
      await expect(txPromise).to.be.revertedWith('Cannot set consumer to zero address')
    })
  })

  describe('consumeFrom', () => {
    it('Should revert if called by non-consumer', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (permitTokenHolder) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.user.terraformPermitToken.consumeFrom(permitTokenHolder)

          // Assert
          await expect(txPromise).to.be.revertedWith('Caller does not have consumer rights')
        })
      )
    })

    it('Should require owner to have at least one token', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (permitTokenHolder) => {
          // Arrange
          const { routines } = await loadFixture(systemFixture)
          const consumer = await routines.deployPriviligedTerraformPermitTokenActor()

          // Act
          const txPromise = consumer.consumeFrom(permitTokenHolder)

          // Assert
          await expect(txPromise).to.be.revertedWith('Owner does not own token')
        })
      )
    })

    it('Should only be able to consume once per token', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (permitTokenHolder) => {
          // Arrange
          const { routines } = await loadFixture(systemFixture)
          const issuerAndConsumer = await routines.deployPriviligedTerraformPermitTokenActor()
          await issuerAndConsumer.issue(permitTokenHolder)
          await issuerAndConsumer.consumeFrom(permitTokenHolder)

          // Act
          const txPromise = issuerAndConsumer.consumeFrom(permitTokenHolder)

          // Assert
          await expect(txPromise).to.be.revertedWith('Owner does not own token')
        })
      )
    })

    it('Should burn token on consumption', async () => {
      fc.assert(
        fc.asyncProperty(Arbitrary.walletAddress(), async (permitTokenHolder) => {
          // Arrange
          const { routines } = await loadFixture(systemFixture)
          const issuerAndConsumer = await routines.deployPriviligedTerraformPermitTokenActor()
          await issuerAndConsumer.issue(permitTokenHolder)

          // Act
          await issuerAndConsumer.consumeFrom(permitTokenHolder)

          // Assert
          const balance = await issuerAndConsumer.balanceOf(permitTokenHolder)
          expect(balance).to.equal(0)
        })
      )
    })
  })
})
