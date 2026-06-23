// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMarketplaceWorkerINFT {
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function getApproved(uint256 tokenId) external view returns (address approved);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function transfer(address from, address to, uint256 tokenId, bytes calldata sealedKey, bytes calldata proof)
        external;
}

contract LedgerMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
        uint64 listedAt;
    }

    IMarketplaceWorkerINFT public immutable workerINFT;
    mapping(uint256 => Listing) public listings;

    event WorkerListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event WorkerListingCancelled(uint256 indexed tokenId, address indexed seller);
    event WorkerPurchased(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    error InvalidToken();
    error InvalidPrice();
    error InvalidBuyer();
    error NotTokenOwner();
    error NotSeller();
    error NotApproved();
    error NotListed();
    error StaleListing();
    error IncorrectPayment();
    error TransferFailed();

    constructor(address workerINFT_) {
        if (workerINFT_ == address(0)) revert InvalidToken();
        workerINFT = IMarketplaceWorkerINFT(workerINFT_);
    }

    function listWorker(uint256 tokenId, uint256 price) external {
        if (tokenId == 0) revert InvalidToken();
        if (price == 0) revert InvalidPrice();
        address owner = workerINFT.ownerOf(tokenId);
        if (msg.sender != owner) revert NotTokenOwner();
        if (!_isApprovedForMarketplace(owner, tokenId)) revert NotApproved();

        listings[tokenId] = Listing({
            seller: owner,
            price: price,
            active: true,
            listedAt: uint64(block.timestamp)
        });
        emit WorkerListed(tokenId, owner, price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        if (!listing.active) revert NotListed();
        if (msg.sender != listing.seller) revert NotSeller();
        listing.active = false;
        emit WorkerListingCancelled(tokenId, msg.sender);
    }

    function buyWorker(uint256 tokenId, bytes calldata sealedKey, bytes calldata proof) external payable {
        Listing storage listing = listings[tokenId];
        if (!listing.active) revert NotListed();
        if (msg.sender == listing.seller) revert InvalidBuyer();
        if (msg.value != listing.price) revert IncorrectPayment();

        address currentOwner = workerINFT.ownerOf(tokenId);
        if (currentOwner != listing.seller) revert StaleListing();
        if (!_isApprovedForMarketplace(currentOwner, tokenId)) revert NotApproved();

        address seller = listing.seller;
        uint256 price = listing.price;
        listing.active = false;

        workerINFT.transfer(seller, msg.sender, tokenId, sealedKey, proof);
        (bool paid,) = payable(seller).call{value: price}("");
        if (!paid) revert TransferFailed();

        emit WorkerPurchased(tokenId, seller, msg.sender, price);
    }

    function activeListing(uint256 tokenId) external view returns (Listing memory listing) {
        listing = listings[tokenId];
        if (!listing.active) revert NotListed();
        if (workerINFT.ownerOf(tokenId) != listing.seller) revert StaleListing();
    }

    function _isApprovedForMarketplace(address owner, uint256 tokenId) internal view returns (bool) {
        return workerINFT.getApproved(tokenId) == address(this)
            || workerINFT.isApprovedForAll(owner, address(this));
    }
}
