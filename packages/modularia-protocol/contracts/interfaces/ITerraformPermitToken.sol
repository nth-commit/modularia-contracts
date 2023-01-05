// SPDX-License-Identifier: GNU GPLv3
pragma solidity ^0.8.9;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ITerraformPermitToken is IERC721 {
    function totalSupply() external view returns (uint256);

    function issue(address to) external;

    function airdrop(uint256 airdropToTokenId) external;
}
