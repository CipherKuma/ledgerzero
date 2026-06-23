// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {LedgerMarketplace} from "../src/LedgerMarketplace.sol";

/**
 * @title DeployMarketplace
 * @notice Deploys LedgerMarketplace against an existing WorkerINFT deployment.
 *
 * Example:
 * PRIVATE_KEY=$ZEROG_PROJECT_TEST_PRIVATE_KEY \
 * NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT=$NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT \
 * forge script script/DeployMarketplace.s.sol --rpc-url $ZEROG_RPC --broadcast
 */
contract DeployMarketplace is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address workerINFT = vm.envAddress("NEXT_PUBLIC_LEDGER_ZERO_WORKER_INFT");
        address deployer = vm.addr(deployerPrivateKey);

        require(workerINFT != address(0), "WorkerINFT address required");

        console2.log("Deploying LedgerMarketplace from:", deployer);
        console2.log("WorkerINFT:", workerINFT);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);
        LedgerMarketplace marketplace = new LedgerMarketplace(workerINFT);
        vm.stopBroadcast();

        console2.log("LedgerMarketplace deployed at:", address(marketplace));
    }
}
