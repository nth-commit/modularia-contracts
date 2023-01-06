import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { deployTerraformPermitToken } from '../../helpers/DeployHelpers'
import { TerraformPermitToken as TerraformPermitTokenContract } from '../../typechain-types'
import { EthersHelpers } from '../Helpers/EthersHelpers'
import { RawSystemFixture } from '../Helpers/RawSystemFixture'
import { StubERC721Api, TerraformPermitTokenApi } from '../TestMachinery/Api'

export type SystemOptions = {
  airdropMaxSupply: bigint
}

export type System = {
  contracts: {
    terraformPermitToken: TerraformPermitTokenContract
  }
  agents: Record<'owner' | 'user', Agent>
  routines: {
    deployPriviligedTerraformPermitTokenActor: () => Promise<TerraformPermitTokenApi>
  }
}

export type Agent = {
  address: string
  airdropToken: StubERC721Api
  terraformPermitToken: TerraformPermitTokenApi
}

export namespace SystemFixture {
  export function create(options: Partial<SystemOptions> = {}): () => Promise<System> {
    return async function fixture() {
      const rawSystem = await createRawSystemFixture({ airdropMaxSupply: 10_000n, ...options })()

      const owner = createApi(rawSystem.owner, rawSystem)
      const user = createApi(rawSystem.signers.user, rawSystem)

      const system: System = {
        contracts: {
          terraformPermitToken: rawSystem.contracts.terraformPermitToken,
        },
        agents: {
          owner,
          user,
        },
        routines: {
          deployPriviligedTerraformPermitTokenActor: async () => {
            const actor = await EthersHelpers.deployRandomSigner()
            await system.agents.owner.terraformPermitToken.setIssuer(actor.address)
            await system.agents.owner.terraformPermitToken.setConsumer(actor.address)
            return TerraformPermitTokenApi.create(rawSystem.contracts.terraformPermitToken, actor)
          },
        },
      }

      return system
    }
  }

  function createRawSystemFixture(options: SystemOptions) {
    return RawSystemFixture.create({
      createContracts: async () => {
        const airdropTo = await EthersHelpers.IERC721.deployStubERC721()
        const terraformPermitToken = await deployTerraformPermitToken(airdropTo, options.airdropMaxSupply)
        return { airdropTo, terraformPermitToken }
      },
      signerNames: ['user'] as const,
    })
  }

  function createApi(
    signer: SignerWithAddress,
    system: Awaited<ReturnType<ReturnType<typeof createRawSystemFixture>>>
  ): Agent {
    const { airdropTo, terraformPermitToken } = system.contracts(signer)

    const agent: Agent = {
      address: signer.address,
      airdropToken: StubERC721Api.create(airdropTo, signer),
      terraformPermitToken: TerraformPermitTokenApi.create(terraformPermitToken, signer),
    }

    return agent
  }
}
