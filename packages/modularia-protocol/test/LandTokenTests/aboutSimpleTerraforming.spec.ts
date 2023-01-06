import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import fc from 'fast-check'
import { Arbitrary } from '../TestMachinery/Arbitrary'
import { SystemUnderTest } from './SystemUnderTest'

describe('LandToken', () => {
  const systemUnderTestFixture = SystemUnderTest.createFixture()

  describe('terraform', () => {
    it('Should require caller to hold permit token', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.XY.any(), async (xy) => {
          // Arrange
          const {
            actors: { user },
          } = await loadFixture(systemUnderTestFixture)

          // Act
          const txPromise = user.landToken.terraform(xy)

          // Assert
          await expect(txPromise).to.be.revertedWith('Caller does not own permit token')
        })
      )
    })

    it('Should consume permit token', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.XY.originAdjacent(), async (xy) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.terraformOriginLand()
          await routines.issuePermitToUser()

          // Act
          await user.landToken.terraform(xy)

          // Assert
          expect(await user.terraformPermitToken.myBalance()).to.equal(0n)
        })
      )
    })

    it('Should mint land token to caller', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.XY.originAdjacent(), async (xy) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.terraformOriginLand()
          await routines.issuePermitToUser()

          // Act
          await user.landToken.terraform(xy)

          // Assert
          expect(await user.landToken.myBalance()).to.equal(1n)
        })
      )
    })

    it('Should populate land metadata', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.XY.originAdjacent(), async (xy) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.terraformOriginLand()
          await routines.issuePermitToUser()

          // Act
          await user.landToken.terraform(xy)

          // Assert
          const tokenId = await user.landToken.tokenIdByCoordinate(xy)
          const actualLand = await user.landToken.landMetadataByTokenId(tokenId)
          const expectedLand: typeof actualLand = {
            landType: 'parcel',
          }
          expect(actualLand).to.be.deep.eq(expectedLand)
        })
      )
    })
  })
})
