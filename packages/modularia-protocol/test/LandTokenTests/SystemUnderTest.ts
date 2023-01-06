import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Contract } from 'ethers'
import { deployLandToken, deployTerraformPermitToken } from '../../helpers/DeployHelpers'
import { LandToken, StubERC721, TerraformPermitToken } from '../../typechain-types'
import { EthersHelpers } from '../Helpers/EthersHelpers'
import { LandTokenApi, TerraformPermitTokenApi } from '../TestMachinery/Api'
import { GenericSystemUnderTest, GenericSystemUnderTestActor } from '../TestMachinery/GenericSystemUnderTest'

export type SystemUnderTest = GenericSystemUnderTest<
  {
    stubERC721: StubERC721
    terraformPermitToken: TerraformPermitToken
    landToken: LandToken
  },
  'user' | 'terraformPermitTokenIssuer',
  SystemUnderTestApi,
  {
    issuePermitToUser(count?: bigint): Promise<void>
  }
>

export type SystemUnderTestApi = {
  terraformPermitToken: TerraformPermitTokenApi
  landToken: LandTokenApi
}

export namespace SystemUnderTest {
  export function createFixture() {
    return async function fixture(): Promise<SystemUnderTest> {
      const stubERC721 = await EthersHelpers.IERC721.deployStubERC721()
      const terraformPermitToken = await deployTerraformPermitToken(stubERC721, 0n)
      const landToken = await deployLandToken(terraformPermitToken)

      await terraformPermitToken.setConsumer(landToken.address)

      const user = createActor(terraformPermitToken, landToken, await EthersHelpers.deployRandomSigner())
      const terraformPermitTokenIssuer = await createTerraformPermitTokenIssuer(
        terraformPermitToken,
        landToken,
        await EthersHelpers.deployRandomSigner()
      )

      const systemUnderTest: SystemUnderTest = {
        contracts: {
          stubERC721,
          terraformPermitToken,
          landToken,
        },
        actors: {
          user,
          terraformPermitTokenIssuer,
        },
        routines: {
          issuePermitToUser: async (count = 1n) => {
            for (let i = 0; i < Number(count); i++) {
              await terraformPermitTokenIssuer.terraformPermitToken.issue(user.address)
            }
          },
        },
      }

      return systemUnderTest
    }
  }

  async function createTerraformPermitTokenIssuer(
    terraformPermitToken: TerraformPermitToken,
    landToken: LandToken,
    signer: SignerWithAddress
  ): Promise<GenericSystemUnderTestActor<SystemUnderTestApi>> {
    await terraformPermitToken.setIssuer(signer.address)
    return createActor(terraformPermitToken, landToken, signer)
  }

  function createActor(
    terraformPermitToken: TerraformPermitToken,
    landToken: LandToken,
    signer: SignerWithAddress
  ): GenericSystemUnderTestActor<SystemUnderTestApi> {
    return {
      address: signer.address,
      terraformPermitToken: TerraformPermitTokenApi.create(terraformPermitToken, signer),
      landToken: LandTokenApi.create(landToken, signer),
    }
  }
}
