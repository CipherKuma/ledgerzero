// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {ERC8004} from "../src/ERC8004.sol";
import {MockTEEOracle} from "../src/MockTEEOracle.sol";
import {WorkerINFT} from "../src/WorkerINFT.sol";
import {LedgerCapabilityRegistry} from "../src/LedgerCapabilityRegistry.sol";
import {LedgerIdentityRegistry} from "../src/LedgerIdentityRegistry.sol";
import {LedgerEscrow} from "../src/LedgerEscrow.sol";
import {LedgerMarketplace} from "../src/LedgerMarketplace.sol";

contract LedgerPure0GTest is Test {
    ERC8004 public reputationRegistry;
    MockTEEOracle public teeOracle;
    WorkerINFT public workerINFT;
    LedgerCapabilityRegistry public capabilityRegistry;
    LedgerIdentityRegistry public identityRegistry;
    LedgerEscrow public escrow;
    LedgerMarketplace public marketplace;

    address public deployer = address(1);
    address public buyer = address(2);
    address public worker = address(3);
    address public newOwner = address(4);

    bytes32 public constant MOCK_PROOF_HASH = keccak256("ledger-pure0g-mock-proof");
    bytes32 public constant TASK_ID = keccak256("test-task-1");

    function setUp() public {
        vm.startPrank(deployer);

        reputationRegistry = new ERC8004();
        teeOracle = new MockTEEOracle(MOCK_PROOF_HASH);
        workerINFT = new WorkerINFT(address(teeOracle));
        capabilityRegistry = new LedgerCapabilityRegistry(address(workerINFT));
        identityRegistry = new LedgerIdentityRegistry(address(workerINFT), address(capabilityRegistry));
        escrow = new LedgerEscrow(address(reputationRegistry), address(workerINFT));
        marketplace = new LedgerMarketplace(address(workerINFT));
        reputationRegistry.setAuthorizedWriter(address(escrow), true);

        vm.stopPrank();
    }

    function testFullFlow() public {
        // 1. Mint worker iNFT
        vm.prank(worker);
        uint256 tokenId = workerINFT.mint(
            worker,
            "worker-001",
            hex"7365616c65642d6b6579",
            "0g://0xd8fb3ad312ca5e9002f7bdd47d93839b9a6dcd83d396bb74a44a9f65344982c4",
            "erc8004:local"
        );
        assertEq(tokenId, 1);
        assertEq(workerINFT.ownerOf(tokenId), worker);

        // 2. Register capabilities (replaces ENS)
        string[] memory skills = new string[](2);
        skills[0] = "research";
        skills[1] = "coding";

        vm.prank(worker);
        capabilityRegistry.registerCapability(
            "alpha-worker",
            keccak256("capabilities-json"),
            "0g://capability-cid",
            skills,
            0.01 ether
        );

        assertTrue(capabilityRegistry.isRegistered(worker));

        LedgerCapabilityRegistry.CapabilityManifest memory manifest =
            capabilityRegistry.resolveByAddress(worker);
        assertEq(manifest.agentName, "alpha-worker");
        assertEq(manifest.ratePerHour, 0.01 ether);

        // 3. Register identity
        vm.prank(worker);
        identityRegistry.registerAgent(worker, "alpha-worker", "research,coding", tokenId);

        LedgerIdentityRegistry.AgentIdentity memory identity = identityRegistry.getAgent(worker);
        assertEq(identity.agentName, "alpha-worker");
        assertEq(identity.workerTokenId, tokenId);

        // 4. Post task
        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        escrow.postTask{value: 1 ether}(TASK_ID, 1 ether, block.timestamp + 1 days, 0);

        (address taskBuyer,, uint256 payment,,,,,,) = escrow.tasks(TASK_ID);
        assertEq(taskBuyer, buyer);
        assertEq(payment, 1 ether);

        // 5. Accept bid with iNFT
        vm.deal(worker, 1 ether);
        vm.prank(worker);
        escrow.acceptTokenBid{value: 0.1 ether}(TASK_ID, tokenId, 0.8 ether, 0.1 ether);

        assertEq(escrow.payoutRecipient(TASK_ID), worker);

        // 6. Transfer iNFT to new owner
        bytes memory proof = abi.encodePacked("ledger-pure0g-mock-proof");
        bytes memory newSealedKey = hex"7365616c65642d666f722d726573657276652d6f776e6572";

        vm.prank(worker);
        workerINFT.transfer(worker, newOwner, tokenId, newSealedKey, proof);

        assertEq(workerINFT.ownerOf(tokenId), newOwner);

        // 7. Payout recipient updates to new owner
        assertEq(escrow.payoutRecipient(TASK_ID), newOwner);

        // 8. Release payment
        vm.prank(buyer);
        escrow.releasePayment(TASK_ID, keccak256("result"));

        // New owner should have received payment + bond
        assertGt(newOwner.balance, 0);

        // 9. Reputation recorded for CURRENT iNFT OWNER on 0G mainnet
        // (not original worker — reputation follows the iNFT)
        ERC8004.Reputation memory rep = reputationRegistry.getReputation(newOwner);
        assertEq(rep.totalJobs, 1);
        assertEq(rep.successfulJobs, 1);

        console2.log("Full flow test passed!");
        console2.log("Worker iNFT transferred from worker to newOwner");
        console2.log("Escrow payout routed to new owner automatically");
        console2.log("Reputation recorded on 0G mainnet (pure 0G, no cross-chain)");
    }

    function testSlashBond() public {
        vm.deal(buyer, 2 ether);
        vm.prank(buyer);
        escrow.postTask{value: 1 ether}(TASK_ID, 1 ether, block.timestamp + 1 days, 0);

        vm.deal(worker, 1 ether);
        vm.prank(worker);
        escrow.acceptBid{value: 0.1 ether}(TASK_ID, worker, 0.8 ether, 0.1 ether);

        // Fast forward past deadline
        vm.warp(block.timestamp + 2 days);

        uint256 buyerBalanceBefore = buyer.balance;
        vm.prank(buyer);
        escrow.slashBond(TASK_ID);

        // Buyer gets payment + bond back
        assertEq(buyer.balance, buyerBalanceBefore + 1 ether + 0.1 ether);

        // Reputation penalty recorded
        ERC8004.Reputation memory rep = reputationRegistry.getReputation(worker);
        assertEq(rep.totalJobs, 1);
        assertEq(rep.failedJobs, 1);
    }

    function testOnlyEscrowCanRecordReputation() public {
        vm.expectRevert(ERC8004.NotAuthorized.selector);
        reputationRegistry.recordOutcome(worker, TASK_ID, true, 1);
    }

    function testIdentityMustMatchTokenOwner() public {
        vm.prank(worker);
        uint256 tokenId = workerINFT.mint(
            worker,
            "worker-001",
            hex"7365616c65642d6b6579",
            "0g://memory",
            "erc8004:local"
        );

        vm.prank(newOwner);
        vm.expectRevert(LedgerIdentityRegistry.TokenOwnerMismatch.selector);
        identityRegistry.registerAgent(newOwner, "stolen-worker", "research", tokenId);
    }

    function testMarketplaceListCancelAndBuy() public {
        vm.prank(worker);
        uint256 tokenId = workerINFT.mint(worker, "listed-worker", hex"7365616c6564", "0g://memory", "erc8004:local");

        vm.prank(worker);
        workerINFT.setApprovalForAll(address(marketplace), true);

        vm.prank(worker);
        marketplace.listWorker(tokenId, 0.7 ether);

        LedgerMarketplace.Listing memory listing = marketplace.activeListing(tokenId);
        assertEq(listing.seller, worker);
        assertEq(listing.price, 0.7 ether);
        assertTrue(listing.active);

        vm.prank(worker);
        marketplace.cancelListing(tokenId);

        vm.expectRevert(LedgerMarketplace.NotListed.selector);
        marketplace.activeListing(tokenId);

        vm.prank(worker);
        marketplace.listWorker(tokenId, 0.7 ether);

        uint256 sellerBalanceBefore = worker.balance;
        vm.deal(newOwner, 1 ether);
        vm.prank(newOwner);
        marketplace.buyWorker{value: 0.7 ether}(
            tokenId,
            hex"7365616c65642d666f722d6275796572",
            abi.encodePacked("ledger-pure0g-mock-proof")
        );

        assertEq(workerINFT.ownerOf(tokenId), newOwner);
        assertEq(worker.balance, sellerBalanceBefore + 0.7 ether);
        vm.expectRevert(LedgerMarketplace.NotListed.selector);
        marketplace.activeListing(tokenId);
    }

    function testMarketplaceRejectsUnauthorizedListingAndWrongPayment() public {
        vm.prank(worker);
        uint256 tokenId = workerINFT.mint(worker, "guarded-worker", hex"7365616c6564", "0g://memory", "erc8004:local");

        vm.prank(newOwner);
        vm.expectRevert(LedgerMarketplace.NotTokenOwner.selector);
        marketplace.listWorker(tokenId, 0.7 ether);

        vm.prank(worker);
        vm.expectRevert(LedgerMarketplace.NotApproved.selector);
        marketplace.listWorker(tokenId, 0.7 ether);

        vm.prank(worker);
        workerINFT.approve(address(marketplace), tokenId);

        vm.prank(worker);
        marketplace.listWorker(tokenId, 0.7 ether);

        vm.deal(newOwner, 1 ether);
        vm.prank(newOwner);
        vm.expectRevert(LedgerMarketplace.IncorrectPayment.selector);
        marketplace.buyWorker{value: 0.6 ether}(
            tokenId,
            hex"7365616c65642d666f722d6275796572",
            abi.encodePacked("ledger-pure0g-mock-proof")
        );
    }

    function testMarketplaceRejectsStaleListingAfterExternalTransfer() public {
        vm.prank(worker);
        uint256 tokenId = workerINFT.mint(worker, "stale-worker", hex"7365616c6564", "0g://memory", "erc8004:local");

        vm.prank(worker);
        workerINFT.setApprovalForAll(address(marketplace), true);

        vm.prank(worker);
        marketplace.listWorker(tokenId, 0.7 ether);

        vm.prank(worker);
        workerINFT.transfer(
            worker,
            newOwner,
            tokenId,
            hex"7365616c65642d666f722d6e65772d6f776e6572",
            abi.encodePacked("ledger-pure0g-mock-proof")
        );

        vm.expectRevert(LedgerMarketplace.StaleListing.selector);
        marketplace.activeListing(tokenId);

        vm.deal(address(5), 1 ether);
        vm.prank(address(5));
        vm.expectRevert(LedgerMarketplace.StaleListing.selector);
        marketplace.buyWorker{value: 0.7 ether}(
            tokenId,
            hex"7365616c65642d666f722d6275796572",
            abi.encodePacked("ledger-pure0g-mock-proof")
        );
    }
}
