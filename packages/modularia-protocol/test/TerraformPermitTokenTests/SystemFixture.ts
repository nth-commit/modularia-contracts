import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ContractTransaction } from 'ethers'
import { deployTerraformPermitToken } from '../../helpers/DeployHelpers'
import { TerraformPermitToken as TerraformPermitTokenContract } from '../../typechain-types'
import { EthersHelpers } from '../Helpers/EthersHelpers'
import { RawSystemFixture } from '../Helpers/RawSystemFixture'
import { TerraformPermitTokenApi } from '../TestMachinery/Api'

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
    const rawSystemFixture = createRawSystemFixture({ airdropMaxSupply: 10_000n, ...options })

    return async function fixture() {
      const rawSystem = await rawSystemFixture()

      const owner = createApi(rawSystem.owner, rawSystem, lookupAddress)
      const user = createApi(rawSystem.signers.user, rawSystem, lookupAddress)

      function lookupAddress(agent: Agent) {
        if (agent === owner) return rawSystem.owner.address
        if (agent === user) return rawSystem.signers.user.address
        throw new Error(`Unknown agent: ${agent}`)
      }

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
    system: Awaited<ReturnType<ReturnType<typeof createRawSystemFixture>>>,
    lookupAddress: (agent: Agent) => string
  ): Agent {
    const { airdropTo, terraformPermitToken } = system.contracts(signer)

    const agent: Agent = {
      address: signer.address,
      airdropToken: {
        mint: async (to, tokenId) => airdropTo.mint(lookupAddress(to), tokenId),
      },
      terraformPermitToken: TerraformPermitTokenApi.create(terraformPermitToken, signer),
    }

    return agent
  }
}

export type StubERC721Api = {
  mint(to: Agent, tokenId: bigint): Promise<ContractTransaction>
}
