// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IProofVerifier} from "./IProofVerifier.sol";

contract MockTEEOracle is IProofVerifier {
    bytes32 public immutable validProofHash;

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
