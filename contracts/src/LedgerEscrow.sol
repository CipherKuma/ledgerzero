// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC8004} from "./ERC8004.sol";

interface IWorkerINFT {
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

/**
 * @title LedgerEscrow
 * @notice Task escrow with iNFT-owned payout routing.
 *         Uses ERC-8004 ReputationRegistry deployed on 0G mainnet.
 *         Pure 0G — no cross-chain dependencies.
 */
contract LedgerEscrow {
    enum Status {
        None,
        Posted,
        Accepted,
        Released,
        Slashed,
        Cancelled
    }

    struct Task {
        address buyer;
        address worker;
        uint256 payment;
        uint256 deadline;
        uint256 minReputation;
        uint256 bidAmount;
        uint256 bondAmount;
        bytes32 resultHash;
        Status status;
    }

    ERC8004 public immutable reputationRegistry;
    IWorkerINFT public immutable workerINFT;

    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => uint256) public taskWorkerTokenIds;

    event TaskPosted(
        bytes32 indexed taskId,
        address indexed buyer,
        uint256 payment,
        uint256 deadline,
        uint256 minReputation
    );
    event BidAccepted(
        bytes32 indexed taskId,
        address indexed worker,
        uint256 bidAmount,
        uint256 bondAmount
    );
    event WorkerTokenAttached(
        bytes32 indexed taskId,
        uint256 indexed tokenId,
        address indexed owner
    );
    event PaymentReleased(
        bytes32 indexed taskId,
        address indexed worker,
        bytes32 resultHash
    );
    event BondSlashed(bytes32 indexed taskId, address indexed buyer, uint256 amount);
    event TaskCancelled(bytes32 indexed taskId);

    error InvalidTask();
    error InvalidStatus();
    error InvalidPayment();
    error NotBuyer();
    error DeadlineActive();
    error InsufficientReputation();

    constructor(address reputationRegistry_, address workerINFT_) {
        reputationRegistry = ERC8004(reputationRegistry_);
        workerINFT = IWorkerINFT(workerINFT_);
    }

    function postTask(bytes32 taskId, uint256 payment, uint256 deadline, uint256 minReputation)
        external
        payable
    {
        if (taskId == bytes32(0) || tasks[taskId].status != Status.None) revert InvalidTask();
        if (msg.value != payment || payment == 0) revert InvalidPayment();
        if (deadline <= block.timestamp) revert InvalidTask();

        tasks[taskId] = Task(
            msg.sender,
            address(0),
            payment,
            deadline,
            minReputation,
            0,
            0,
            bytes32(0),
            Status.Posted
        );
        emit TaskPosted(taskId, msg.sender, payment, deadline, minReputation);
    }

    function acceptBid(bytes32 taskId, address workerAddress, uint256 bidAmount, uint256 bondAmount)
        external
        payable
    {
        Task storage task = tasks[taskId];
        if (task.status != Status.Posted) revert InvalidStatus();
        if (msg.sender != workerAddress || workerAddress == address(0)) revert InvalidTask();
        if (msg.value != bondAmount || bondAmount == 0 || bidAmount == 0 || bidAmount > task.payment)
        {
            revert InvalidPayment();
        }

        // Check reputation requirement
        if (task.minReputation > 0) {
            ERC8004.Reputation memory rep = reputationRegistry.getReputation(workerAddress);
            if (rep.score < task.minReputation) revert InsufficientReputation();
        }

        task.worker = workerAddress;
        task.bidAmount = bidAmount;
        task.bondAmount = bondAmount;
        task.status = Status.Accepted;
        emit BidAccepted(taskId, workerAddress, bidAmount, bondAmount);
    }

    function acceptTokenBid(bytes32 taskId, uint256 workerTokenId, uint256 bidAmount, uint256 bondAmount)
        external
        payable
    {
        if (address(workerINFT) == address(0) || workerTokenId == 0) revert InvalidTask();
        address owner = workerINFT.ownerOf(workerTokenId);
        Task storage task = tasks[taskId];
        if (task.status != Status.Posted) revert InvalidStatus();
        if (msg.sender != owner) revert NotBuyer();
        if (msg.value != bondAmount || bondAmount == 0 || bidAmount == 0 || bidAmount > task.payment)
        {
            revert InvalidPayment();
        }

        // Check reputation of token owner
        if (task.minReputation > 0) {
            ERC8004.Reputation memory rep = reputationRegistry.getReputation(owner);
            if (rep.score < task.minReputation) revert InsufficientReputation();
        }

        task.worker = owner;
        task.bidAmount = bidAmount;
        task.bondAmount = bondAmount;
        task.status = Status.Accepted;
        taskWorkerTokenIds[taskId] = workerTokenId;
        emit BidAccepted(taskId, owner, bidAmount, bondAmount);
        emit WorkerTokenAttached(taskId, workerTokenId, owner);
    }

    function releasePayment(bytes32 taskId, bytes32 resultHash) external {
        Task storage task = tasks[taskId];
        if (task.status != Status.Accepted) revert InvalidStatus();
        if (msg.sender != task.buyer) revert NotBuyer();
        task.status = Status.Released;
        task.resultHash = resultHash;
        address recipient = payoutRecipient(taskId);

        // Record reputation for WORKER on 0G mainnet (pure 0G, no cross-chain)
        try reputationRegistry.recordOutcome(recipient, taskId, true, task.payment / 1e18) {} catch {}

        payable(recipient).transfer(task.bidAmount + task.bondAmount);
        if (task.payment > task.bidAmount) {
            payable(task.buyer).transfer(task.payment - task.bidAmount);
        }
        emit PaymentReleased(taskId, recipient, resultHash);
    }

    function payoutRecipient(bytes32 taskId) public view returns (address) {
        Task storage task = tasks[taskId];
        uint256 tokenId = taskWorkerTokenIds[taskId];
        if (tokenId == 0) return task.worker;
        return workerINFT.ownerOf(tokenId);
    }

    function slashBond(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        if (task.status != Status.Accepted) revert InvalidStatus();
        if (block.timestamp <= task.deadline) revert DeadlineActive();
        task.status = Status.Slashed;

        // Record negative reputation for WORKER
        try reputationRegistry.recordOutcome(task.worker, taskId, false, task.payment / 1e18) {} catch {}

        payable(task.buyer).transfer(task.payment + task.bondAmount);
        emit BondSlashed(taskId, task.buyer, task.bondAmount);
    }

    function cancelTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        if (task.status != Status.Posted) revert InvalidStatus();
        if (msg.sender != task.buyer) revert NotBuyer();
        task.status = Status.Cancelled;
        payable(task.buyer).transfer(task.payment);
        emit TaskCancelled(taskId);
    }
}
