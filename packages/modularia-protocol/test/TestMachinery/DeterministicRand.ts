import prand from 'pure-rand'

export type DeterministicRand = {
  next(): number
}

export namespace DeterministicRand {
  export function create(seed: number): DeterministicRand {
    let gen = prand.mersenne(seed)
    return {
      next: () => {
        const [value, nextGen] = gen.next()
        gen = nextGen
        return value / 0xffffffff
      },
    }
  }
}
