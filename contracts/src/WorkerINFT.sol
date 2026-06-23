// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IProofVerifier} from "./IProofVerifier.sol";

contract WorkerINFT {
    struct AgentMetadata {
        string agentName;
        bytes sealedKey;
        string memoryCID;
        string initialReputationRef;
        uint64 updatedAt;
    }

    string public constant name = "Ledger Worker iNFT";
    string public constant symbol = "LWINFT";

    IProofVerifier public oracle;
    uint256 public nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => AgentMetadata) private _metadata;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event MetadataUpdated(uint256 indexed tokenId, string memoryCID, bytes sealedKey);
    event OracleUpdated(address indexed oracle);

    error NotAuthorized();
    error InvalidAddress();
    error InvalidToken();
    error InvalidProof();

    constructor(address oracle_) {
        if (oracle_ == address(0)) revert InvalidAddress();
        oracle = IProofVerifier(oracle_);
    }

    function mint(
        address to,
        string calldata agentName,
        bytes calldata sealedKey,
        string calldata memoryCID,
        string calldata initialReputationRef
    ) external returns (uint256 tokenId) {
        if (to == address(0)) revert InvalidAddress();
        tokenId = nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        _metadata[tokenId] =
            AgentMetadata(agentName, sealedKey, memoryCID, initialReputationRef, uint64(block.timestamp));
        emit Transfer(address(0), to, tokenId);
        emit MetadataUpdated(tokenId, memoryCID, sealedKey);
    }

    function transfer(address from, address to, uint256 tokenId, bytes calldata sealedKey, bytes calldata proof)
        external
    {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotAuthorized();
        if (ownerOf(tokenId) != from) revert NotAuthorized();
        if (to == address(0)) revert InvalidAddress();
        if (!oracle.validProof(from, to, tokenId, sealedKey, proof)) revert InvalidProof();

        _approve(address(0), tokenId);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        _metadata[tokenId].sealedKey = sealedKey;
        _metadata[tokenId].updatedAt = uint64(block.timestamp);

        emit Transfer(from, to, tokenId);
        emit MetadataUpdated(tokenId, _metadata[tokenId].memoryCID, sealedKey);
    }

    function updateMemoryPointer(uint256 tokenId, string calldata newCID) external {
        if (ownerOf(tokenId) != msg.sender) revert NotAuthorized();
        _metadata[tokenId].memoryCID = newCID;
        _metadata[tokenId].updatedAt = uint64(block.timestamp);
        emit MetadataUpdated(tokenId, newCID, _metadata[tokenId].sealedKey);
    }

    function getMetadata(uint256 tokenId) external view returns (AgentMetadata memory) {
        if (_owners[tokenId] == address(0)) revert InvalidToken();
        return _metadata[tokenId];
    }

    function ownerOf(uint256 tokenId) public view returns (address owner) {
        owner = _owners[tokenId];
        if (owner == address(0)) revert InvalidToken();
    }

    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert InvalidAddress();
        return _balances[owner];
    }

    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender)) revert NotAuthorized();
        _approve(to, tokenId);
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        if (_owners[tokenId] == address(0)) revert InvalidToken();
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return spender == owner || _tokenApprovals[tokenId] == spender || isApprovedForAll(owner, spender);
    }

    function _approve(address to, uint256 tokenId) internal {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }
}
