// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProofVerifier {
    function validProof(address from, address to, uint256 tokenId, bytes calldata sealedKey, bytes calldata proof)
        external
        returns (bool);
}
