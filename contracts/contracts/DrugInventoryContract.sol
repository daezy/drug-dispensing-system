// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DrugInventoryContract
 * @dev Manages drug inventory on Base blockchain
 * @notice This contract handles drug addition, stock updates, and inventory tracking
 */
contract DrugInventoryContract is AccessControl, ReentrancyGuard {

    // Role definitions
    bytes32 public constant PHARMACIST_ROLE = keccak256("PHARMACIST_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    // Drug structure
    struct Drug {
        uint256 id;
        string name;
        string genericName;
        uint256 currentQuantity;
        uint256 minimumStockLevel;
        uint256 expiryDate; // Unix timestamp
        string batchNumber;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
        address addedBy;
    }

    // Stock transaction structure
    struct StockTransaction {
        uint256 id;
        uint256 drugId;
        int256 quantityChange;
        uint256 previousQuantity;
        uint256 newQuantity;
        string transactionType; // "stock_in", "dispensed", "expired", "damaged", "adjustment"
        address performedBy;
        uint256 timestamp;
        bytes32 blockchainHash; // Link to off-chain hash
    }

    // State variables
    uint256 private _drugIdCounter;
    uint256 private _transactionIdCounter;
    
    mapping(uint256 => Drug) public drugs;
    mapping(uint256 => StockTransaction[]) public drugTransactions;
    mapping(uint256 => bool) public drugExists;

    // Events
    event DrugAdded(
        uint256 indexed drugId,
        string name,
        uint256 initialQuantity,
        address indexed pharmacistAddress,
        uint256 timestamp
    );

    event DrugStockUpdated(
        uint256 indexed drugId,
        uint256 previousQuantity,
        uint256 newQuantity,
        string transactionType,
        address indexed performedBy,
        uint256 timestamp,
        bytes32 blockchainHash
    );

    event DrugExpired(
        uint256 indexed drugId,
        uint256 quantity,
        uint256 expiryDate,
        uint256 timestamp
    );

    event DrugDeactivated(
        uint256 indexed drugId,
        address indexed deactivatedBy,
        uint256 timestamp
    );

    event LowStockAlert(
        uint256 indexed drugId,
        string name,
        uint256 currentQuantity,
        uint256 minimumLevel,
        uint256 timestamp
    );

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PHARMACIST_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    /**
     * @dev Add a new drug to inventory
     * @param name Drug name
     * @param genericName Generic name of the drug
     * @param initialQuantity Initial stock quantity
     * @param minimumStockLevel Minimum stock level for alerts
     * @param expiryDate Expiry date as Unix timestamp
     * @param batchNumber Batch number
     * @return drugId The ID of the added drug
     */
    function addDrug(
        string memory name,
        string memory genericName,
        uint256 initialQuantity,
        uint256 minimumStockLevel,
        uint256 expiryDate,
        string memory batchNumber
    ) external onlyRole(PHARMACIST_ROLE) returns (uint256) {
        require(bytes(name).length > 0, "Drug name cannot be empty");
        require(expiryDate > block.timestamp, "Expiry date must be in the future");

        _drugIdCounter++;
        uint256 newDrugId = _drugIdCounter;

        Drug storage newDrug = drugs[newDrugId];
        newDrug.id = newDrugId;
        newDrug.name = name;
        newDrug.genericName = genericName;
        newDrug.currentQuantity = initialQuantity;
        newDrug.minimumStockLevel = minimumStockLevel;
        newDrug.expiryDate = expiryDate;
        newDrug.batchNumber = batchNumber;
        newDrug.isActive = true;
        newDrug.createdAt = block.timestamp;
        newDrug.updatedAt = block.timestamp;
        newDrug.addedBy = msg.sender;

        drugExists[newDrugId] = true;

        emit DrugAdded(
            newDrugId,
            name,
            initialQuantity,
            msg.sender,
            block.timestamp
        );

        // Check for low stock
        if (initialQuantity <= minimumStockLevel) {
            emit LowStockAlert(
                newDrugId,
                name,
                initialQuantity,
                minimumStockLevel,
                block.timestamp
            );
        }

        return newDrugId;
    }

    /**
     * @dev Update drug stock
     * @param drugId ID of the drug
     * @param quantityChange Change in quantity (positive for increase, negative for decrease)
     * @param transactionType Type of transaction
     * @param blockchainHash Off-chain blockchain hash
     */
    function updateStock(
        uint256 drugId,
        int256 quantityChange,
        string memory transactionType,
        bytes32 blockchainHash
    ) external onlyRole(PHARMACIST_ROLE) nonReentrant returns (bool) {
        require(drugExists[drugId], "Drug does not exist");
        
        Drug storage drug = drugs[drugId];
        require(drug.isActive, "Drug is not active");

        uint256 previousQuantity = drug.currentQuantity;
        
        // Calculate new quantity
        uint256 newQuantity;
        if (quantityChange >= 0) {
            newQuantity = previousQuantity + uint256(quantityChange);
        } else {
            uint256 decrease = uint256(-quantityChange);
            require(previousQuantity >= decrease, "Insufficient stock");
            newQuantity = previousQuantity - decrease;
        }

        // Update drug quantity
        drug.currentQuantity = newQuantity;
        drug.updatedAt = block.timestamp;

        // Record transaction
        _transactionIdCounter++;
        uint256 transactionId = _transactionIdCounter;

        StockTransaction memory transaction = StockTransaction({
            id: transactionId,
            drugId: drugId,
            quantityChange: quantityChange,
            previousQuantity: previousQuantity,
            newQuantity: newQuantity,
            transactionType: transactionType,
            performedBy: msg.sender,
            timestamp: block.timestamp,
            blockchainHash: blockchainHash
        });

        drugTransactions[drugId].push(transaction);

        emit DrugStockUpdated(
            drugId,
            previousQuantity,
            newQuantity,
            transactionType,
            msg.sender,
            block.timestamp,
            blockchainHash
        );

        // Check for low stock
        if (newQuantity <= drug.minimumStockLevel) {
            emit LowStockAlert(
                drugId,
                drug.name,
                newQuantity,
                drug.minimumStockLevel,
                block.timestamp
            );
        }

        return true;
    }

    /**
     * @dev Mark drug as expired
     * @param drugId ID of the drug
     */
    function markDrugExpired(uint256 drugId)
        external
        onlyRole(MANAGER_ROLE)
    {
        require(drugExists[drugId], "Drug does not exist");
        
        Drug storage drug = drugs[drugId];
        require(block.timestamp >= drug.expiryDate, "Drug has not expired yet");

        emit DrugExpired(
            drugId,
            drug.currentQuantity,
            drug.expiryDate,
            block.timestamp
        );
    }

    /**
     * @dev Deactivate a drug
     * @param drugId ID of the drug
     */
    function deactivateDrug(uint256 drugId)
        external
        onlyRole(MANAGER_ROLE)
    {
        require(drugExists[drugId], "Drug does not exist");
        
        Drug storage drug = drugs[drugId];
        require(drug.isActive, "Drug already deactivated");

        drug.isActive = false;
        drug.updatedAt = block.timestamp;

        emit DrugDeactivated(drugId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get drug details
     * @param drugId ID of the drug
     * @return Drug struct
     */
    function getDrug(uint256 drugId)
        external
        view
        returns (Drug memory)
    {
        require(drugExists[drugId], "Drug does not exist");
        return drugs[drugId];
    }

    /**
     * @dev Get current stock level
     * @param drugId ID of the drug
     * @return Current quantity
     */
    function getStockLevel(uint256 drugId)
        external
        view
        returns (uint256)
    {
        require(drugExists[drugId], "Drug does not exist");
        return drugs[drugId].currentQuantity;
    }

    /**
     * @dev Get all transactions for a drug
     * @param drugId ID of the drug
     * @return Array of stock transactions
     */
    function getDrugTransactions(uint256 drugId)
        external
        view
        returns (StockTransaction[] memory)
    {
        require(drugExists[drugId], "Drug does not exist");
        return drugTransactions[drugId];
    }

    /**
     * @dev Check if drug is low on stock
     * @param drugId ID of the drug
     * @return True if stock is low
     */
    function isLowStock(uint256 drugId)
        external
        view
        returns (bool)
    {
        require(drugExists[drugId], "Drug does not exist");
        Drug memory drug = drugs[drugId];
        return drug.currentQuantity <= drug.minimumStockLevel;
    }

    /**
     * @dev Check if drug is expired
     * @param drugId ID of the drug
     * @return True if expired
     */
    function isExpired(uint256 drugId)
        external
        view
        returns (bool)
    {
        require(drugExists[drugId], "Drug does not exist");
        return block.timestamp >= drugs[drugId].expiryDate;
    }

    /**
     * @dev Get all active drugs
     * @return Array of active drug IDs
     */
    function getActiveDrugs()
        external
        view
        returns (uint256[] memory)
    {
        uint256 totalDrugs = _drugIdCounter;
        uint256 activeCount = 0;
        
        // Count active drugs
        for (uint256 i = 1; i <= totalDrugs; i++) {
            if (drugExists[i] && drugs[i].isActive) {
                activeCount++;
            }
        }
        
        // Build array
        uint256[] memory activeDrugs = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalDrugs; i++) {
            if (drugExists[i] && drugs[i].isActive) {
                activeDrugs[index] = i;
                index++;
            }
        }
        
        return activeDrugs;
    }

    /**
     * @dev Get all low stock drugs
     * @return Array of low stock drug IDs
     */
    function getLowStockDrugs()
        external
        view
        returns (uint256[] memory)
    {
        uint256 totalDrugs = _drugIdCounter;
        uint256 lowStockCount = 0;
        
        // Count low stock drugs
        for (uint256 i = 1; i <= totalDrugs; i++) {
            if (drugExists[i] && drugs[i].currentQuantity <= drugs[i].minimumStockLevel) {
                lowStockCount++;
            }
        }
        
        // Build array
        uint256[] memory lowStockDrugs = new uint256[](lowStockCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalDrugs; i++) {
            if (drugExists[i] && drugs[i].currentQuantity <= drugs[i].minimumStockLevel) {
                lowStockDrugs[index] = i;
                index++;
            }
        }
        
        return lowStockDrugs;
    }

    /**
     * @dev Grant pharmacist role
     * @param account Address to grant role to
     */
    function grantPharmacistRole(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        grantRole(PHARMACIST_ROLE, account);
    }

    /**
     * @dev Grant manager role
     * @param account Address to grant role to
     */
    function grantManagerRole(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        grantRole(MANAGER_ROLE, account);
    }

    /**
     * @dev Get total number of drugs
     * @return Total count
     */
    function getTotalDrugs() external view returns (uint256) {
        return _drugIdCounter;
    }

    /**
     * @dev Get total number of transactions
     * @return Total count
     */
    function getTotalTransactions() external view returns (uint256) {
        return _transactionIdCounter;
    }
}
