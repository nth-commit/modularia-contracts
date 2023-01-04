// SPDX-License-Identifier: GNU GPLv3
pragma solidity ^0.8.9;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract StubERC721 is ERC721 {
    constructor() ERC721("StubERC721", "") {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
