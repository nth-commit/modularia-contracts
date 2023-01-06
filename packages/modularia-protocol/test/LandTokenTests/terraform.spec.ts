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
        fc.asyncProperty(Arbitrary.bigInt(), Arbitrary.bigInt(), async (x, y) => {
          // Arrange
          const {
            actors: { user },
          } = await loadFixture(systemUnderTestFixture)

          // Act
          const txPromise = user.landToken.terraform(x, y)

          // Assert
          await expect(txPromise).to.be.revertedWith('Caller does not own permit token')
        })
      )
    })

    it('Should require (x,y) co-ordinate to be vacant', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.bigInt(), Arbitrary.bigInt(), async (x, y) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.issuePermitToUser(2n)
          await user.landToken.terraform(x, y)

          // Act
          const txPromise = user.landToken.terraform(x, y)

          // Assert
          await expect(txPromise).to.be.revertedWith('Land already terraformed')
        })
      )
    })

    it('Should consume permit token', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.bigInt(), Arbitrary.bigInt(), async (x, y) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.issuePermitToUser()

          // Act
          await user.landToken.terraform(x, y)

          // Assert
          expect(await user.terraformPermitToken.myBalance()).to.equal(0n)
        })
      )
    })

    it('Should mint land token to caller', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.bigInt(), Arbitrary.bigInt(), async (x, y) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.issuePermitToUser()

          // Act
          await user.landToken.terraform(x, y)

          // Assert
          expect(await user.landToken.myBalance()).to.equal(1n)
        })
      )
    })

    it('Should populate land metadata', async () => {
      await fc.assert(
        fc.asyncProperty(Arbitrary.bigInt(), Arbitrary.bigInt(), async (x, y) => {
          // Arrange
          const {
            actors: { user },
            routines,
          } = await loadFixture(systemUnderTestFixture)
          await routines.issuePermitToUser()

          // Act
          await user.landToken.terraform(x, y)

          // Assert
          const actualLand = await user.landToken.landMetadata(x, y)
          const expectedLand: typeof actualLand = {
            landType: 'parcel',
          }
          expect(actualLand).to.be.deep.eq(expectedLand)
        })
      )
    })
  })
})
