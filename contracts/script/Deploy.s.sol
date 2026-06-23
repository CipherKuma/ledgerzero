// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC8004} from "../src/ERC8004.sol";
import {MockTEEOracle} from "../src/MockTEEOracle.sol";
import {WorkerINFT} from "../src/WorkerINFT.sol";
import {LedgerCapabilityRegistry} from "../src/LedgerCapabilityRegistry.sol";
import {LedgerIdentityRegistry} from "../src/LedgerIdentityRegistry.sol";
import {LedgerEscrow} from "../src/LedgerEscrow.sol";
import {LedgerMarketplace} from "../src/LedgerMarketplace.sol";

/**
 * @title Deploy
 * @notice Deploys the full Ledger Zero contract suite to the selected 0G network.
 *         For Zero Cup testing use Galileo: forge script script/Deploy.s.sol --rpc-url $ZEROG_RPC --broadcast
 */
contract Deploy is Script {
    // 0G Galileo Testnet
    uint256 public constant CHAIN_ID = 16602;

    // Mock TEE proof hash (replace with real hash for production)
    bytes32 public constant MOCK_PROOF_HASH = keccak256("ledger-pure0g-mock-proof");

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deploying Ledger Pure 0G from:", deployer);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ERC-8004 ReputationRegistry
        ERC8004 reputationRegistry = new ERC8004();
        console2.log("ERC8004 ReputationRegistry deployed at:", address(reputationRegistry));

        // 2. Deploy Mock TEE Oracle
        MockTEEOracle teeOracle = new MockTEEOracle(MOCK_PROOF_HASH);
        console2.log("MockTEEOracle deployed at:", address(teeOracle));

        // 3. Deploy Worker iNFT (ERC-7857 style)
        WorkerINFT workerINFT = new WorkerINFT(address(teeOracle));
        console2.log("WorkerINFT deployed at:", address(workerINFT));

        // 4. Deploy Capability Registry (replaces ENS)
        LedgerCapabilityRegistry capabilityRegistry = new LedgerCapabilityRegistry(address(workerINFT));
        console2.log("LedgerCapabilityRegistry deployed at:", address(capabilityRegistry));

        // 5. Deploy Identity Registry
        LedgerIdentityRegistry identityRegistry = new LedgerIdentityRegistry(
            address(workerINFT),
            address(capabilityRegistry)
        );
        console2.log("LedgerIdentityRegistry deployed at:", address(identityRegistry));

        // 6. Deploy Escrow
        LedgerEscrow escrow = new LedgerEscrow(address(reputationRegistry), address(workerINFT));
        console2.log("LedgerEscrow deployed at:", address(escrow));

        // 7. Deploy marketplace sale/listing contract.
        LedgerMarketplace marketplace = new LedgerMarketplace(address(workerINFT));
        console2.log("LedgerMarketplace deployed at:", address(marketplace));

        // 8. Gate reputation writes to the escrow contract.
        reputationRegistry.setAuthorizedWriter(address(escrow), true);
        console2.log("ERC8004 authorized writer:", address(escrow));

        vm.stopBroadcast();

        // Summary
        console2.log("\n=== Ledger Pure 0G Deployment Complete ===");
        console2.log("ERC8004 ReputationRegistry:", address(reputationRegistry));
        console2.log("MockTEEOracle:", address(teeOracle));
        console2.log("WorkerINFT:", address(workerINFT));
        console2.log("LedgerCapabilityRegistry:", address(capabilityRegistry));
        console2.log("LedgerIdentityRegistry:", address(identityRegistry));
        console2.log("LedgerEscrow:", address(escrow));
        console2.log("LedgerMarketplace:", address(marketplace));
    }
}
