// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IProofVerifier {
    function validProof(address from, address to, uint256 tokenId, bytes calldata sealedKey, bytes calldata proof)
        external
        view
        returns (bool);
}

contract MockTEEOracle is IProofVerifier {
    bytes32 public validProofHash;

    constructor(bytes32 proofHash) {
        validProofHash = proofHash;
    }

    function validProof(address, address, uint256, bytes calldata sealedKey, bytes calldata proof)
        external
        view
        returns (bool)
    {
        return sealedKey.length > 0 && keccak256(proof) == validProofHash;
    }
}
