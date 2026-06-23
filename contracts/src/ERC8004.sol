// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ERC8004 {
    struct Reputation {
        uint256 score;
        uint256 totalJobs;
        uint256 successfulJobs;
        uint256 failedJobs;
        uint256 lastUpdated;
    }
    mapping(address => Reputation) public reputations;
    mapping(address => mapping(bytes32 => bool)) public verifiedOutcomes;
    mapping(address => bool) public authorizedWriters;
    address public immutable owner;

    event ReputationUpdated(address indexed agent, uint256 newScore, uint256 totalJobs, bool success);
    event WriterAuthorizationUpdated(address indexed writer, bool authorized);

    error NotAuthorized();

    constructor() {
        owner = msg.sender;
        authorizedWriters[msg.sender] = true;
    }

    function setAuthorizedWriter(address writer, bool authorized) external {
        if (msg.sender != owner) revert NotAuthorized();
        authorizedWriters[writer] = authorized;
        emit WriterAuthorizationUpdated(writer, authorized);
    }

    function recordOutcome(address agent, bytes32 taskHash, bool success, uint256 weight) external {
        if (!authorizedWriters[msg.sender]) revert NotAuthorized();
        require(!verifiedOutcomes[agent][taskHash], "Already recorded");
        verifiedOutcomes[agent][taskHash] = true;
        Reputation storage rep = reputations[agent];
        rep.totalJobs++;
        rep.lastUpdated = block.timestamp;
        if (success) { rep.successfulJobs++; rep.score += weight * 100; }
        else { rep.failedJobs++; rep.score = rep.score > weight * 200 ? rep.score - weight * 200 : 0; }
        emit ReputationUpdated(agent, rep.score, rep.totalJobs, success);
    }

    function getReputation(address agent) external view returns (Reputation memory) {
        return reputations[agent];
    }
}
