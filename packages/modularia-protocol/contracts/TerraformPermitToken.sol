// SPDX-License-Identifier: GNU GPLv3
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import {ITerraformPermitToken} from "./interfaces/ITerraformPermitToken.sol";

contract TerraformPermitToken is ITerraformPermitToken, ERC721, Ownable {
    uint256 private _totalSupply;
    address private _issuer;
    address private _consumer;
    mapping(uint32 => bool) private _oncePerContractUsedKeys;

    IERC721 private immutable airdropTo;
    uint256 private immutable airdropMaxSupply;
    mapping(uint256 => bool) private airdropCompletedByTokenId;
    uint256 private airDropCount;

    mapping(uint256 => uint256) public lockedUntilByTokenId;

    constructor(IERC721 _airdropTo, uint256 _airdropMaxSupply) ERC721("Modularia Terraform Permit Token", "MODT") {
        airdropTo = _airdropTo;
        airdropMaxSupply = _airdropMaxSupply;
    }

    modifier onlyIssuer() {
        require(_issuer == msg.sender, "Caller does not have issuer rights");
        _;
    }

    modifier onlyConsumer() {
        require(_consumer == msg.sender, "Caller does not have consumer rights");
        _;
    }

    modifier oncePerContract(uint32 key, string memory errorMessage) {
        require(_oncePerContractUsedKeys[key] == false, errorMessage);
        _oncePerContractUsedKeys[key] = true;
        _;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * Sets the issuer of the permit tokens. This can only be called once. Should be called with the address of the
     * contract that manages permit token auctions. Allows the target issuer to mint permit tokens.
     */
    function setIssuer(address issuer) external onlyOwner oncePerContract(0, "Issuer already set") {
        require(issuer != address(0), "Cannot set issuer to zero address");
        _issuer = issuer;
    }

    /**
     * Sets the consumer of the permit tokens. This can only be called once. Should be called with the address of the
     * contract that manages permit token auctions. Allows the target consumer to burn permit tokens.
     */
    function setConsumer(address consumer) external onlyOwner oncePerContract(1, "Consumer already set") {
        require(consumer != address(0), "Cannot set consumer to zero address");
        _consumer = consumer;
    }

    /**
     * Mints a new permit token to the specified address. Can only be called by the issuer.
     */
    function issue(address to) external onlyIssuer {
        _mint(to);
    }

    /**
     * Burns a permit token. Can only be called by the consumer.
     */
    function consume(uint256 tokenId) external onlyConsumer {
        _burn(tokenId);
    }

    /**
     * Airdrops a land permit to the owner of the token ID in the airdropTo contract. Can only be called oncer per
     * token ID.
     */
    function airdrop(uint256 airdropToTokenId) external {
        require(airDropCount < airdropMaxSupply, "Airdrop max supply reached");
        require(airdropCompletedByTokenId[airdropToTokenId] == false, "Airdrop already completed for token ID");

        airDropCount++;
        airdropCompletedByTokenId[airdropToTokenId] = true;

        address owner = _lookupAirdropOwner(airdropToTokenId);
        require(owner != address(0), "Error looking up owner of token ID, the token may not exist");

        _mint(owner);
    }

    /**
     * Locks a land permit for a specified duration. Can only be called by the owner.
     */
    function lock(uint256 tokenId, uint256 durationSeconds) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        lockedUntilByTokenId[tokenId] = block.timestamp + durationSeconds;
    }

    /**
     * Unlocks a land permit. Can only be called by the owner.
     */
    function unlock(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        delete lockedUntilByTokenId[tokenId];
    }

    function _lookupAirdropOwner(uint256 airdropToTokenId) internal view returns (address) {
        try airdropTo.ownerOf(airdropToTokenId) returns (address owner) {
            return owner;
        } catch {
            return address(0);
        }
    }

    function _mint(address to) internal {
        _totalSupply++;
        _mint(to, _totalSupply);
    }

    function _beforeTokenTransfer(address from, address to, uint256 firstTokenId, uint256 batchSize) internal override {
        require(lockedUntilByTokenId[firstTokenId] < block.timestamp || from == owner(), "Token is locked");
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
}
