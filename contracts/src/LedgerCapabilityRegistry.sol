// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LedgerCapabilityRegistry
 * @notice On-chain agent capability registry replacing ENS CCIP-Read.
 *         Stores capability hashes on-chain, full manifests referenced via 0G Storage CIDs.
 *         Follows ERC-8171 agent identity semantics.
 */
contract LedgerCapabilityRegistry {
    struct CapabilityManifest {
        address agentAddress;
        string agentName;           // Human-readable name (replaces ENS)
        bytes32 capabilityHash;     // keccak256 of full capability JSON
        string memoryCID;           // 0G Storage CID of full manifest
        uint256 ratePerHour;        // Agent's rate in wei
        bool available;             // Is the agent accepting jobs?
        uint64 registeredAt;
        uint64 updatedAt;
    }

    mapping(address => CapabilityManifest) private _manifests;
    mapping(address => string[]) private _agentSkills;  // Separate mapping for skills
    mapping(string => address) private _nameToAgent;  // agentName -> agentAddress
    mapping(bytes32 => bool) private _usedHashes;

    address public immutable workerINFT;
    address public immutable owner;

    event CapabilityRegistered(
        address indexed agentAddress,
        string agentName,
        bytes32 capabilityHash,
        string memoryCID
    );
    event CapabilityUpdated(
        address indexed agentAddress,
        bytes32 newCapabilityHash,
        string newMemoryCID
    );
    event AvailabilityToggled(address indexed agentAddress, bool available);

    error InvalidAddress();
    error NameAlreadyTaken();
    error NotRegistered();
    error NotAuthorized();
    error HashAlreadyUsed();
    error EmptyName();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyAgent() {
        if (_manifests[msg.sender].agentAddress == address(0)) revert NotRegistered();
        _;
    }

    constructor(address workerINFT_) {
        owner = msg.sender;
        workerINFT = workerINFT_;
    }

    /**
     * @notice Register an agent's capabilities on-chain.
     * @param agentName Human-readable name (must be unique)
     * @param capabilityHash keccak256 of full capability JSON
     * @param memoryCID 0G Storage CID of full manifest
     * @param skills Array of skill tags
     * @param ratePerHour Agent's rate in wei
     */
    function registerCapability(
        string calldata agentName,
        bytes32 capabilityHash,
        string calldata memoryCID,
        string[] calldata skills,
        uint256 ratePerHour
    ) external {
        _registerCapability(agentName, capabilityHash, memoryCID, skills, ratePerHour);
    }

    function _registerCapability(
        string calldata agentName,
        bytes32 capabilityHash,
        string calldata memoryCID,
        string[] calldata skills,
        uint256 ratePerHour
    ) internal {
        if (msg.sender == address(0)) revert InvalidAddress();
        if (bytes(agentName).length == 0) revert EmptyName();
        if (_nameToAgent[agentName] != address(0)) revert NameAlreadyTaken();
        if (_usedHashes[capabilityHash]) revert HashAlreadyUsed();

        _manifests[msg.sender] = CapabilityManifest({
            agentAddress: msg.sender,
            agentName: agentName,
            capabilityHash: capabilityHash,
            memoryCID: memoryCID,
            ratePerHour: ratePerHour,
            available: true,
            registeredAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp)
        });
        delete _agentSkills[msg.sender];
        for (uint256 i = 0; i < skills.length; i++) {
            _agentSkills[msg.sender].push(skills[i]);
        }
        _nameToAgent[agentName] = msg.sender;
        _usedHashes[capabilityHash] = true;

        emit CapabilityRegistered(msg.sender, agentName, capabilityHash, memoryCID);
    }

    /**
     * @notice Update agent capabilities (must be registered).
     */
    function updateCapability(
        bytes32 newCapabilityHash,
        string calldata newMemoryCID,
        string[] calldata newSkills,
        uint256 newRate
    ) external onlyAgent {
        if (_usedHashes[newCapabilityHash] && newCapabilityHash != _manifests[msg.sender].capabilityHash) {
            revert HashAlreadyUsed();
        }

        CapabilityManifest storage manifest = _manifests[msg.sender];
        _usedHashes[manifest.capabilityHash] = false;
        manifest.capabilityHash = newCapabilityHash;
        manifest.memoryCID = newMemoryCID;
        manifest.ratePerHour = newRate;
        manifest.updatedAt = uint64(block.timestamp);
        _usedHashes[newCapabilityHash] = true;
        delete _agentSkills[msg.sender];
        for (uint256 i = 0; i < newSkills.length; i++) {
            _agentSkills[msg.sender].push(newSkills[i]);
        }

        emit CapabilityUpdated(msg.sender, newCapabilityHash, newMemoryCID);
    }

    function toggleAvailability(bool available) external onlyAgent {
        _manifests[msg.sender].available = available;
        emit AvailabilityToggled(msg.sender, available);
    }

    /**
     * @notice Resolve agent by name (replaces ENS resolution).
     */
    function resolveByName(string calldata agentName) external view returns (CapabilityManifest memory) {
        address agent = _nameToAgent[agentName];
        if (agent == address(0)) revert NotRegistered();
        return _manifests[agent];
    }

    /**
     * @notice Resolve agent by address.
     */
    function resolveByAddress(address agent) external view returns (CapabilityManifest memory) {
        CapabilityManifest memory manifest = _manifests[agent];
        if (manifest.agentAddress == address(0)) revert NotRegistered();
        return manifest;
    }

    /**
     * @notice Check if an address is a registered agent.
     */
    function isRegistered(address agent) external view returns (bool) {
        return _manifests[agent].agentAddress != address(0);
    }

    /**
     * @notice Get all agents with a specific skill (filtered off-chain, paginated on-chain).
     */
    function getSkills(address agent) external view returns (string[] memory) {
        return _agentSkills[agent];
    }

    function filterBySkill(string calldata, uint256, uint256 limit)
        external
        pure
        returns (CapabilityManifest[] memory results)
    {
        // Frontend filters client-side. This is a stub for interface compatibility.
        results = new CapabilityManifest[](limit);
        return results;
    }

    /**
     * @notice Verify that a capability hash matches the registered one.
     */
    function verifyCapabilityHash(address agent, bytes32 hash) external view returns (bool) {
        return _manifests[agent].capabilityHash == hash;
    }
}
