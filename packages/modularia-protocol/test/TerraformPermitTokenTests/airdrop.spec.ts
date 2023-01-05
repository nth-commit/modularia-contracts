import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import fc from 'fast-check'
import { Arbitrary } from '../TestMachinery/Arbitrary'
import { SystemFixture } from './SystemFixture'

describe('TerraformPermitToken', () => {
  const systemFixture = SystemFixture.create()

  describe('airdrop', () => {
    it('Should require max airdrop supply to to not be exceeded', async () => {
      const systemFixture = SystemFixture.create({ airdropMaxSupply: 1n })

      await fc.assert(
        fc.asyncProperty(Arbitrary.two(Arbitrary.tokenId()), async ([tokenId0, tokenId1]) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)
          await agents.owner.airdropToken.mint(agents.user, tokenId0)
          await agents.owner.airdropToken.mint(agents.user, tokenId1)
          await agents.owner.terraformPermitToken.airdrop(tokenId0)

          // Act
          const txPromise = agents.owner.terraformPermitToken.airdrop(tokenId1)

          // Assert
          await expect(txPromise).to.be.revertedWith('Airdrop max supply reached')
        })
      )
    })

    it('Should require token ID to not already have airdrop', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.tokenId(), async (tokenId) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)
          await agents.owner.airdropToken.mint(agents.user, tokenId)
          await agents.owner.terraformPermitToken.airdrop(tokenId)

          // Act
          const txPromise = agents.owner.terraformPermitToken.airdrop(tokenId)

          // Assert
          await expect(txPromise).to.be.revertedWith('Airdrop already completed for token ID')
        })
      )
    })

    it('Should require token ID to be valid ID of the airdrop token', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.tokenId(), async (tokenId) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)

          // Act
          const txPromise = agents.owner.terraformPermitToken.airdrop(tokenId)

          // Assert
          await expect(txPromise).to.be.revertedWith('Error looking up owner of token ID, the token may not exist')
        })
      )
    })

    it('Should mint terraform permit token', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.tokenId(), async (tokenId) => {
          // Arrange
          const { agents } = await loadFixture(systemFixture)
          await agents.owner.airdropToken.mint(agents.user, tokenId)

          // Act
          await agents.owner.terraformPermitToken.airdrop(tokenId)

          // Assert
          const balance = await agents.user.terraformPermitToken.myBalance()
          expect(balance).to.equal(1n)
        })
      )
    })
  })
})
