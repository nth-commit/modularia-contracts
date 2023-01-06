import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import fc from 'fast-check'
import { Arbitrary } from '../TestMachinery/Arbitrary'
import { SystemUnderTest } from './SystemUnderTest'

describe('LandToken', () => {
  const systemUnderTestFixture = SystemUnderTest.createFixture()

  describe('terraform', () => {
    it('Should require (x,y) co-ordinate to be vacant', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.XY.originAdjacent(), async (xy) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.terraformOriginLand()
          await routines.issuePermitToUser(2n)
          await user.landToken.terraform(xy)

          // Act
          const txPromise = user.landToken.terraform(xy)

          // Assert
          await expect(txPromise).to.be.revertedWith('Land already terraformed')
        })
      )
    })

    it('Should require (x,y) co-ordinate to be adjacent to an existing parcel', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.XY.nonOriginAdjacent(), async (xy) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.terraformOriginLand()
          await routines.issuePermitToUser()

          // Act
          const txPromise = user.landToken.terraform(xy)

          // Assert
          await expect(txPromise).to.be.revertedWith('Land must be adjacent to existing')
        })
      )
    })
  })
})
