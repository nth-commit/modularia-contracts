// SPDX-License-Identifier: GNU GPLv3
pragma solidity ^0.8.9;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ITerraformPermitToken is IERC721 {
    function consumeFrom(address owner) external;
}
