import { expect } from 'chai'
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers'
import { SystemFixture } from './SystemFixture'
import fc from 'fast-check'
import { Arbitrary } from '../TestMachinery/Arbitrary'

describe('TerraformPermitToken', () => {
  const systemFixture = SystemFixture.create()

  describe('lock', () => {
    it('Should require caller to be owner', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.tokenId(), Arbitrary.bigNat(), async (tokenId, durationSeconds) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.user.terraformPermitToken.lock(tokenId, durationSeconds)

          // Assert
          await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
        })
      )
    })

    it('Should revert if token does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.tokenId(), Arbitrary.bigNat(), async (tokenId, durationSeconds) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.owner.terraformPermitToken.lock(tokenId, durationSeconds)

          // Assert
          await expect(txPromise).to.be.revertedWith('Token does not exist')
        })
      )
    })

    it('Should set lockedUntil', async () => {
      await fc.assert(
        fc.asyncProperty(
          Arbitrary.bigNat(),
          Arbitrary.walletAddress(),
          async (durationSeconds, permitHolderAddress) => {
            // Arrange
            const tokenId = 1n // One issuance
            const { agents, routines } = await loadFixture(systemFixture)
            const issuer = await routines.deployPriviligedTerraformPermitTokenActor()
            await issuer.issue(permitHolderAddress)

            // Act
            await agents.owner.terraformPermitToken.lock(tokenId, durationSeconds)

            // Assert
            const actualLockedUntil = await agents.owner.terraformPermitToken.lockedUntilByTokenId(tokenId)
            const expectedLockedUntil = BigInt(await time.latest()) + durationSeconds
            expect(actualLockedUntil).to.equal(expectedLockedUntil)
          }
        )
      )
    })
  })

  describe('unlock', () => {
    it('Should require caller to be owner', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.tokenId(), async (tokenId) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.user.terraformPermitToken.unlock(tokenId)

          // Assert
          await expect(txPromise).to.be.revertedWith('Ownable: caller is not the owner')
        })
      )
    })

    it('Should revert if token does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.tokenId(), async (tokenId) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.owner.terraformPermitToken.unlock(tokenId)

          // Assert
          await expect(txPromise).to.be.revertedWith('Token does not exist')
        })
      )
    })

    it('Should clear lockedUntil', async () => {
      await fc.assert(
        fc.asyncProperty(
          Arbitrary.bigNat(),
          Arbitrary.walletAddress(),
          async (durationSeconds, permitHolderAddress) => {
            // Arrange
            const tokenId = 1n // One issuance
            const { agents, routines } = await loadFixture(systemFixture)
            const issuer = await routines.deployPriviligedTerraformPermitTokenActor()
            await issuer.issue(permitHolderAddress)
            await agents.owner.terraformPermitToken.lock(tokenId, durationSeconds)

            // Act
            await agents.owner.terraformPermitToken.unlock(tokenId)

            // Assert
            const actualLockedUntil = await agents.owner.terraformPermitToken.lockedUntilByTokenId(tokenId)
            expect(actualLockedUntil).to.equal(0n)
          }
        )
      )
    })
  })

  describe('transfer', () => {
    it('Should revert if locked', async () => {
      await fc.assert(
        fc.asyncProperty(
          Arbitrary.bigNat(),
          Arbitrary.walletAddress(),
          async (durationSeconds, permitReceiverAddress) => {
            // Arrange
            const tokenId = 1n // One issuance
            const { agents, routines } = await loadFixture(systemFixture)
            const issuer = await routines.deployPriviligedTerraformPermitTokenActor()
            await issuer.issue(agents.user.address)
            await agents.owner.terraformPermitToken.lock(tokenId, durationSeconds)

            // Act
            const txPromise = agents.user.terraformPermitToken.transfer(permitReceiverAddress, tokenId)

            // Assert
            await expect(txPromise).to.be.revertedWith('Token is locked')
          }
        )
      )
    })

    it('Should transfer if lock expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          Arbitrary.bigNat(),
          Arbitrary.walletAddress(),
          async (durationSeconds, permitReceiverAddress) => {
            // Arrange
            const tokenId = 1n // One issuance
            const { agents, routines } = await loadFixture(systemFixture)
            const issuer = await routines.deployPriviligedTerraformPermitTokenActor()
            await issuer.issue(agents.user.address)
            await agents.owner.terraformPermitToken.lock(tokenId, durationSeconds)

            // Act
            await time.setNextBlockTimestamp(BigInt(await time.latest()) + durationSeconds + 1n)
            await agents.user.terraformPermitToken.transfer(permitReceiverAddress, tokenId)

            // Assert
            const balance = await agents.owner.terraformPermitToken.balanceOf(permitReceiverAddress)
            expect(balance).to.equal(1)
          }
        )
      )
    })

    it('Can transfer if lock active but token owner is contract owner', async () => {
      await fc.assert(
        fc.asyncProperty(
          Arbitrary.bigNat(),
          Arbitrary.walletAddress(),
          async (durationSeconds, permitReceiverAddress) => {
            // Arrange
            const tokenId = 1n // One issuance
            const { agents, routines } = await loadFixture(systemFixture)
            const issuer = await routines.deployPriviligedTerraformPermitTokenActor()
            await issuer.issue(agents.owner.address)
            await agents.owner.terraformPermitToken.lock(tokenId, durationSeconds)

            // Act
            await agents.owner.terraformPermitToken.transfer(permitReceiverAddress, tokenId)

            // Assert
            const balance = await agents.owner.terraformPermitToken.balanceOf(permitReceiverAddress)
            expect(balance).to.equal(1)
          }
        )
      )
    })

    it('Can consume if lock active', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.bigNat(), async (durationSeconds) => {
          // Arrange
          const tokenId = 1n // One issuance
          const { agents, routines } = await loadFixture(systemFixture)
          const issuerAndConsumer = await routines.deployPriviligedTerraformPermitTokenActor()
          await issuerAndConsumer.issue(agents.owner.address)
          await agents.owner.terraformPermitToken.lock(tokenId, durationSeconds)

          // Act
          await issuerAndConsumer.consumeFrom(agents.owner.address)

          // Assert
          const balance = await agents.owner.terraformPermitToken.balanceOf(agents.owner.address)
          expect(balance).to.equal(0n)
        })
      )
    })
  })
})
