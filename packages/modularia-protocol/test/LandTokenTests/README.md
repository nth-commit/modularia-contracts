# Land

## Summaries

Land is an NFT that represents a cell on the Modularia map. Types of land are;

- A parcel (standard ownership pattern for ERC-721)
- A common (ownership rights are delegated to all adjacent guilds, who can manage access rights)
- A reserve (no ownership rights, can't be mutated)

Anyone with a permit can terraform (mint land) by providing (x,y) co-ordinates. The co-ordinates must represent vacant cell that:

- Is adjacent to at least one other land NFT
- Is within the current border of the map (can't expand the border further outwards until it is completely filled)

Terraforming will randomly generate a land type and select a guild based on the guilds of adjacent tiles. There is also a small chance of generating a new guild, and that chance increases as the guild population approaches its limit.

The terraforming permit will only be consumed if the land generated was a parcel. If the terraformer generates a common or reserve, the permit will be unaffected, and they'll get their name forever associated with the land (which does not provider any rights, but they'll go in the history books, and maybe get a small plaque dedicated to them).

The land will inherit some properties of the permit:

- ~~The token ID (permit token #1 => land token #1)~~ Nope, we might want to use an "event sourcing"-like algorithm to build the static map assets. We can use the token ID to build the map in the actually order it was minted. This means that all types of land need to share the same ID scheme.
- The lock time (if any)

All land has a terrain type e.g. desert, ocean, jungle, grassland, beach. The terrain type is inherited from the guild - all land associated with a guild has the same terrain type. If the guild is new, the terrain type is also randomly generated, and is weighted based on adjacent geography e.g. beach is more likely to be adjacent to ocean.

In a future generation algorithm, the z co-ordinate could also be generated and persisted. We could also fit a height map around land types on the client, but it makes heights unstable as adjacent land is terraformed. This might be a fine compromise, it might be too hard to generate interesting maps on-chain, as most height map generators require multiple passes. It might be something we could do with ZK-SNARKS.

## Stories

- Minting parcels (no commons or reserves) of any (x,y) co-ordinates, by burning permits
- Write a simple rendering script, so we can observe the algoithm's behaviour
- Validate (x,y) co-ordinates are in bounds, and don't prematurely expand the border
- Spike: generating z-index on-chain (using something like [Diamond-Square](https://en.wikipedia.org/wiki/Diamond-square_algorithm)), or off-chain with ZK-SNARKS
- Basic guild/terrain implementation
- Spike: off-chain guild generation (ZK-SNARKS to compute probabilities)
- Spike: how do guild DAOs work?
- Parcels get lock-time from the permit used
- Generating reserves
- Generating commons
