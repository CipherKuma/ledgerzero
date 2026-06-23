// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LedgerIdentityRegistry {
    struct AgentIdentity {
        address agentAddress;
        string ensName;
        string capabilities;
        uint64 registeredAt;
    }

    mapping(address => AgentIdentity) private _agents;

    event AgentRegistered(address indexed agentAddress, string ensName, string capabilities);

    error InvalidAddress();
    error NotRegistered();

    function registerAgent(address agentAddress, string calldata ensName, string calldata capabilities) external {
        if (agentAddress == address(0)) revert InvalidAddress();
        _agents[agentAddress] = AgentIdentity(agentAddress, ensName, capabilities, uint64(block.timestamp));
        emit AgentRegistered(agentAddress, ensName, capabilities);
    }

    function getAgent(address agentAddress) external view returns (AgentIdentity memory identity) {
        identity = _agents[agentAddress];
        if (identity.agentAddress == address(0)) revert NotRegistered();
    }
}
