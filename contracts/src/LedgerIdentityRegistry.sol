// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdentityWorkerINFT {
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

/**
 * @title LedgerIdentityRegistry
 * @notice Pure 0G agent identity registry. Replaces ENS with on-chain naming.
 *         Each agent registers a unique name that resolves to their identity.
 */
contract LedgerIdentityRegistry {
    struct AgentIdentity {
        address agentAddress;
        string agentName;       // Human-readable name (replaces ENS)
        string capabilities;    // Comma-separated capability tags
        uint256 workerTokenId;  // Associated WorkerINFT token ID
        uint64 registeredAt;
    }

    mapping(address => AgentIdentity) private _agents;
    mapping(string => address) private _nameToAgent;
    mapping(uint256 => address) private _tokenToAgent;

    address public immutable workerINFT;
    address public immutable capabilityRegistry;
    address public immutable owner;

    event AgentRegistered(
        address indexed agentAddress,
        string agentName,
        uint256 workerTokenId,
        string capabilities
    );
    event AgentNameUpdated(address indexed agentAddress, string newName);

    error InvalidAddress();
    error NotRegistered();
    error NotAuthorized();
    error NameAlreadyTaken();
    error EmptyName();
    error TokenAlreadyRegistered();
    error TokenOwnerMismatch();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    constructor(address workerINFT_, address capabilityRegistry_) {
        owner = msg.sender;
        workerINFT = workerINFT_;
        capabilityRegistry = capabilityRegistry_;
    }

    function registerAgent(
        address agentAddress,
        string calldata agentName,
        string calldata capabilities,
        uint256 workerTokenId
    ) external {
        if (agentAddress == address(0)) revert InvalidAddress();
        if (bytes(agentName).length == 0) revert EmptyName();
        if (_nameToAgent[agentName] != address(0)) revert NameAlreadyTaken();
        if (_tokenToAgent[workerTokenId] != address(0)) revert TokenAlreadyRegistered();
        if (msg.sender != agentAddress) revert NotAuthorized();
        if (IIdentityWorkerINFT(workerINFT).ownerOf(workerTokenId) != agentAddress) {
            revert TokenOwnerMismatch();
        }

        _agents[agentAddress] = AgentIdentity({
            agentAddress: agentAddress,
            agentName: agentName,
            capabilities: capabilities,
            workerTokenId: workerTokenId,
            registeredAt: uint64(block.timestamp)
        });
        _nameToAgent[agentName] = agentAddress;
        _tokenToAgent[workerTokenId] = agentAddress;

        emit AgentRegistered(agentAddress, agentName, workerTokenId, capabilities);
    }

    function updateName(string calldata newName) external {
        if (bytes(newName).length == 0) revert EmptyName();
        if (_nameToAgent[newName] != address(0)) revert NameAlreadyTaken();

        AgentIdentity storage identity = _agents[msg.sender];
        if (identity.agentAddress == address(0)) revert NotRegistered();

        delete _nameToAgent[identity.agentName];
        identity.agentName = newName;
        _nameToAgent[newName] = msg.sender;

        emit AgentNameUpdated(msg.sender, newName);
    }

    function getAgent(address agentAddress) external view returns (AgentIdentity memory identity) {
        identity = _agents[agentAddress];
        if (identity.agentAddress == address(0)) revert NotRegistered();
    }

    function resolveByName(string calldata agentName) external view returns (AgentIdentity memory identity) {
        address agent = _nameToAgent[agentName];
        if (agent == address(0)) revert NotRegistered();
        return _agents[agent];
    }

    function resolveByToken(uint256 tokenId) external view returns (AgentIdentity memory identity) {
        address agent = _tokenToAgent[tokenId];
        if (agent == address(0)) revert NotRegistered();
        return _agents[agent];
    }

    function isRegistered(address agentAddress) external view returns (bool) {
        return _agents[agentAddress].agentAddress != address(0);
    }
}
