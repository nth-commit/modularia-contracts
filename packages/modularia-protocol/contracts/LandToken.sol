// SPDX-License-Identifier: GNU GPLv3
pragma solidity ^0.8.9;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import {ITerraformPermitToken} from "./interfaces/ITerraformPermitToken.sol";
import {ILandToken} from "./interfaces/ILandToken.sol";

struct LandTokenMetadata {
    uint32 landType;
}

contract LandToken is ILandToken, ERC721 {
    uint256 private _totalSupply;

    mapping(int256 => mapping(int256 => LandTokenMetadata)) public landMetadata;

    ITerraformPermitToken private immutable terraformPermitToken;

    constructor(ITerraformPermitToken _terraformPermitToken) ERC721("Modularia Land Token", "MODL") {
        terraformPermitToken = _terraformPermitToken;
    }

    function terraform(int256 x, int256 y) external {
        require(terraformPermitToken.balanceOf(msg.sender) > 0, "Caller does not own permit token");
        require(landMetadata[x][y].landType == 0, "Land already terraformed");

        terraformPermitToken.consumeFrom(msg.sender);
        _mint(msg.sender);
        landMetadata[x][y] = LandTokenMetadata(1);
    }

    function _mint(address to) internal {
        _totalSupply++;
        _mint(to, _totalSupply);
    }
}
