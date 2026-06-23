// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC8004ReputationRegistry {
    function feedback(address buyer, address worker, int128 score, bytes32 resultHash, bytes calldata data) external;
}

interface IWorkerINFT {
    function ownerOf(uint256 tokenId) external view returns (address owner);
}

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

    IERC8004ReputationRegistry public reputationRegistry;
    IWorkerINFT public workerINFT;
    mapping(bytes32 => Task) public tasks;
    mapping(bytes32 => uint256) public taskWorkerTokenIds;

    event TaskPosted(
        bytes32 indexed taskId, address indexed buyer, uint256 payment, uint256 deadline, uint256 minReputation
    );
    event BidAccepted(bytes32 indexed taskId, address indexed worker, uint256 bidAmount, uint256 bondAmount);
    event WorkerTokenAttached(bytes32 indexed taskId, uint256 indexed tokenId, address indexed owner);
    event PaymentReleased(bytes32 indexed taskId, address indexed worker, bytes32 resultHash);
    event BondSlashed(bytes32 indexed taskId, address indexed buyer, uint256 amount);
    event TaskCancelled(bytes32 indexed taskId);

    error InvalidTask();
    error InvalidStatus();
    error InvalidPayment();
    error NotBuyer();
    error DeadlineActive();

    constructor(address reputationRegistry_, address workerINFT_) {
        reputationRegistry = IERC8004ReputationRegistry(reputationRegistry_);
        workerINFT = IWorkerINFT(workerINFT_);
    }

    function postTask(bytes32 taskId, uint256 payment, uint256 deadline, uint256 minReputation) external payable {
        if (taskId == bytes32(0) || tasks[taskId].status != Status.None) revert InvalidTask();
        if (msg.value != payment || payment == 0) revert InvalidPayment();
        if (deadline <= block.timestamp) revert InvalidTask();
        tasks[taskId] = Task(msg.sender, address(0), payment, deadline, minReputation, 0, 0, bytes32(0), Status.Posted);
        emit TaskPosted(taskId, msg.sender, payment, deadline, minReputation);
    }

    function acceptBid(bytes32 taskId, address workerAddress, uint256 bidAmount, uint256 bondAmount) external payable {
        Task storage task = tasks[taskId];
        if (task.status != Status.Posted) revert InvalidStatus();
        if (msg.sender != workerAddress || workerAddress == address(0)) revert InvalidTask();
        if (msg.value != bondAmount || bondAmount == 0 || bidAmount == 0 || bidAmount > task.payment) {
            revert InvalidPayment();
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
        if (msg.value != bondAmount || bondAmount == 0 || bidAmount == 0 || bidAmount > task.payment) {
            revert InvalidPayment();
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

        if (address(reputationRegistry) != address(0)) {
            try reputationRegistry.feedback(task.buyer, recipient, int128(1e18), resultHash, "") {} catch {}
        }

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
