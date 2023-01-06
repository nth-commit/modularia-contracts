import { Contract } from 'ethers'

export type GenericSystemUnderTestApi = Record<string, any>

export type GenericSystemUnderTestActor<Api extends GenericSystemUnderTestApi> = Api & {
  address: string
}

export type GenericSystemUnderTest<
  Contracts extends Record<string, Contract>,
  ActorId extends string,
  Api extends GenericSystemUnderTestApi,
  Routines extends Record<string, any>
> = {
  contracts: Contracts
  actors: Record<ActorId, GenericSystemUnderTestActor<Api>>
  routines: Routines
}
