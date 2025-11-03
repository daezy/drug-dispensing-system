// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DrugTraceabilityContract
 * @dev Tracks complete drug movement from manufacturer → pharmacist → patient
 * @notice This contract provides end-to-end drug traceability and authenticity verification
 */
contract DrugTraceabilityContract is AccessControl, ReentrancyGuard {

    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant PHARMACIST_ROLE = keccak256("PHARMACIST_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    // Movement types
    enum MovementType {
        Manufactured,
        ReceivedByPharmacist,
        DispensedToPatient,
        Returned,
        Destroyed
    }

    // Drug batch structure
    struct DrugBatch {
        uint256 batchId;
        string drugName;
        string batchNumber;
        address manufacturer;
        uint256 manufacturedDate;
        uint256 expiryDate;
        uint256 initialQuantity;
        uint256 remainingQuantity;
        bool isActive;
        bytes32 metadataHash; // IPFS or other hash for additional data
    }

    // Movement record structure
    struct MovementRecord {
        uint256 movementId;
        uint256 batchId;
        MovementType movementType;
        address fromAddress;
        address toAddress;
        uint256 quantity;
        uint256 timestamp;
        bytes32 transactionHash;
        string notes;
        uint256 prescriptionId; // Link to prescription if applicable
    }

    // Dispensing record structure (patient-specific)
    struct DispensingRecord {
        uint256 dispensingId;
        uint256 batchId;
        uint256 prescriptionId;
        address patientAddress;
        address pharmacistAddress;
        uint256 quantity;
        uint256 timestamp;
        bytes32 verificationHash; // For patient to verify authenticity
        bool isVerified;
    }

    // State variables
    uint256 private _batchIdCounter;
    uint256 private _movementIdCounter;
    uint256 private _dispensingIdCounter;

    mapping(uint256 => DrugBatch) public batches;
    mapping(uint256 => MovementRecord[]) public batchMovements;
    mapping(bytes32 => bool) public usedVerificationHashes;
    mapping(uint256 => DispensingRecord) public dispensingRecords;
    mapping(address => uint256[]) public patientDispensings;
    mapping(uint256 => uint256[]) public batchDispensings; // batchId => dispensingIds

    // Events
    event DrugBatchCreated(
        uint256 indexed batchId,
        string drugName,
        string batchNumber,
        address indexed manufacturer,
        uint256 quantity,
        uint256 manufacturedDate,
        uint256 expiryDate,
        uint256 timestamp
    );

    event DrugMovementRecorded(
        uint256 indexed movementId,
        uint256 indexed batchId,
        MovementType movementType,
        address indexed fromAddress,
        address toAddress,
        uint256 quantity,
        uint256 timestamp,
        bytes32 transactionHash
    );

    event DrugDispensed(
        uint256 indexed dispensingId,
        uint256 indexed batchId,
        uint256 prescriptionId,
        address indexed patientAddress,
        address pharmacistAddress,
        uint256 quantity,
        bytes32 verificationHash,
        uint256 timestamp
    );

    event DrugVerified(
        uint256 indexed dispensingId,
        address indexed patientAddress,
        bytes32 verificationHash,
        uint256 timestamp
    );

    event BatchDeactivated(
        uint256 indexed batchId,
        address indexed deactivatedBy,
        uint256 timestamp
    );

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
        _grantRole(PHARMACIST_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }

    /**
     * @dev Create a new drug batch from manufacturer
     * @param drugName Name of the drug
     * @param batchNumber Unique batch number
     * @param quantity Initial quantity manufactured
     * @param manufacturedDate Manufacturing date (Unix timestamp)
     * @param expiryDate Expiry date (Unix timestamp)
     * @param metadataHash Hash of additional metadata (e.g., IPFS hash)
     * @return batchId The ID of the created batch
     */
    function createDrugBatch(
        string memory drugName,
        string memory batchNumber,
        uint256 quantity,
        uint256 manufacturedDate,
        uint256 expiryDate,
        bytes32 metadataHash
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(bytes(drugName).length > 0, "Drug name cannot be empty");
        require(bytes(batchNumber).length > 0, "Batch number cannot be empty");
        require(quantity > 0, "Quantity must be greater than 0");
        require(expiryDate > block.timestamp, "Expiry date must be in the future");
        require(manufacturedDate <= block.timestamp, "Manufactured date cannot be in the future");

        _batchIdCounter++;
        uint256 newBatchId = _batchIdCounter;

        DrugBatch storage newBatch = batches[newBatchId];
        newBatch.batchId = newBatchId;
        newBatch.drugName = drugName;
        newBatch.batchNumber = batchNumber;
        newBatch.manufacturer = msg.sender;
        newBatch.manufacturedDate = manufacturedDate;
        newBatch.expiryDate = expiryDate;
        newBatch.initialQuantity = quantity;
        newBatch.remainingQuantity = quantity;
        newBatch.isActive = true;
        newBatch.metadataHash = metadataHash;

        // Record initial manufacturing movement
        _recordMovement(
            newBatchId,
            MovementType.Manufactured,
            address(0),
            msg.sender,
            quantity,
            keccak256(abi.encodePacked(newBatchId, msg.sender, block.timestamp)),
            "Manufactured",
            0
        );

        emit DrugBatchCreated(
            newBatchId,
            drugName,
            batchNumber,
            msg.sender,
            quantity,
            manufacturedDate,
            expiryDate,
            block.timestamp
        );

        return newBatchId;
    }

    /**
     * @dev Record drug receipt by pharmacist
     * @param batchId ID of the batch
     * @param quantity Quantity received
     * @param notes Additional notes
     */
    function recordPharmacistReceipt(
        uint256 batchId,
        uint256 quantity,
        string memory notes
    ) external onlyRole(PHARMACIST_ROLE) returns (uint256) {
        DrugBatch storage batch = batches[batchId];
        require(batch.batchId != 0, "Batch does not exist");
        require(batch.isActive, "Batch is not active");
        require(quantity > 0, "Quantity must be greater than 0");

        bytes32 txHash = keccak256(abi.encodePacked(batchId, msg.sender, quantity, block.timestamp));

        uint256 movementId = _recordMovement(
            batchId,
            MovementType.ReceivedByPharmacist,
            batch.manufacturer,
            msg.sender,
            quantity,
            txHash,
            notes,
            0
        );

        return movementId;
    }

    /**
     * @dev Record drug dispensing to patient
     * @param batchId ID of the batch
     * @param prescriptionId ID of the prescription
     * @param patientAddress Address of the patient
     * @param quantity Quantity dispensed
     * @return dispensingId The ID of the dispensing record
     */
    function recordPatientDispensing(
        uint256 batchId,
        uint256 prescriptionId,
        address patientAddress,
        uint256 quantity
    ) external onlyRole(PHARMACIST_ROLE) nonReentrant returns (uint256) {
        DrugBatch storage batch = batches[batchId];
        require(batch.batchId != 0, "Batch does not exist");
        require(batch.isActive, "Batch is not active");
        require(batch.remainingQuantity >= quantity, "Insufficient quantity in batch");
        require(patientAddress != address(0), "Invalid patient address");
        require(quantity > 0, "Quantity must be greater than 0");

        // Update batch quantity
        batch.remainingQuantity -= quantity;

        // Generate unique verification hash for patient
        bytes32 verificationHash = keccak256(
            abi.encodePacked(
                batchId,
                prescriptionId,
                patientAddress,
                msg.sender,
                quantity,
                block.timestamp
            )
        );
        require(!usedVerificationHashes[verificationHash], "Verification hash collision");
        usedVerificationHashes[verificationHash] = true;

        // Create dispensing record
        _dispensingIdCounter++;
        uint256 newDispensingId = _dispensingIdCounter;

        DispensingRecord storage newDispensing = dispensingRecords[newDispensingId];
        newDispensing.dispensingId = newDispensingId;
        newDispensing.batchId = batchId;
        newDispensing.prescriptionId = prescriptionId;
        newDispensing.patientAddress = patientAddress;
        newDispensing.pharmacistAddress = msg.sender;
        newDispensing.quantity = quantity;
        newDispensing.timestamp = block.timestamp;
        newDispensing.verificationHash = verificationHash;
        newDispensing.isVerified = false;

        // Update mappings
        patientDispensings[patientAddress].push(newDispensingId);
        batchDispensings[batchId].push(newDispensingId);

        // Record movement
        _recordMovement(
            batchId,
            MovementType.DispensedToPatient,
            msg.sender,
            patientAddress,
            quantity,
            verificationHash,
            "Dispensed to patient",
            prescriptionId
        );

        emit DrugDispensed(
            newDispensingId,
            batchId,
            prescriptionId,
            patientAddress,
            msg.sender,
            quantity,
            verificationHash,
            block.timestamp
        );

        return newDispensingId;
    }

    /**
     * @dev Verify drug authenticity using verification hash
     * @param verificationHash The verification hash provided to patient
     * @return DispensingRecord The dispensing record details
     */
    function verifyDrugAuthenticity(bytes32 verificationHash)
        external
        returns (DispensingRecord memory)
    {
        require(usedVerificationHashes[verificationHash], "Invalid verification hash");

        // Find the dispensing record with this hash
        for (uint256 i = 1; i <= _dispensingIdCounter; i++) {
            if (dispensingRecords[i].verificationHash == verificationHash) {
                DispensingRecord storage record = dispensingRecords[i];
                
                // Mark as verified
                if (!record.isVerified) {
                    record.isVerified = true;
                    emit DrugVerified(
                        record.dispensingId,
                        record.patientAddress,
                        verificationHash,
                        block.timestamp
                    );
                }
                
                return record;
            }
        }

        revert("Dispensing record not found");
    }

    /**
     * @dev Get complete movement history for a batch (for auditing)
     * @param batchId ID of the batch
     * @return Array of movement records
     */
    function getBatchMovementHistory(uint256 batchId)
        external
        view
        onlyRole(AUDITOR_ROLE)
        returns (MovementRecord[] memory)
    {
        require(batches[batchId].batchId != 0, "Batch does not exist");
        return batchMovements[batchId];
    }

    /**
     * @dev Get batch details
     * @param batchId ID of the batch
     * @return DrugBatch The batch details
     */
    function getBatchDetails(uint256 batchId)
        external
        view
        returns (DrugBatch memory)
    {
        require(batches[batchId].batchId != 0, "Batch does not exist");
        return batches[batchId];
    }

    /**
     * @dev Get all dispensings for a patient
     * @param patientAddress Address of the patient
     * @return Array of dispensing IDs
     */
    function getPatientDispensings(address patientAddress)
        external
        view
        returns (uint256[] memory)
    {
        return patientDispensings[patientAddress];
    }

    /**
     * @dev Get dispensing details
     * @param dispensingId ID of the dispensing record
     * @return DispensingRecord The dispensing details
     */
    function getDispensingDetails(uint256 dispensingId)
        external
        view
        returns (DispensingRecord memory)
    {
        require(dispensingRecords[dispensingId].dispensingId != 0, "Dispensing record does not exist");
        return dispensingRecords[dispensingId];
    }

    /**
     * @dev Get all dispensings from a batch
     * @param batchId ID of the batch
     * @return Array of dispensing IDs
     */
    function getBatchDispensings(uint256 batchId)
        external
        view
        onlyRole(AUDITOR_ROLE)
        returns (uint256[] memory)
    {
        require(batches[batchId].batchId != 0, "Batch does not exist");
        return batchDispensings[batchId];
    }

    /**
     * @dev Deactivate a batch (e.g., for recall)
     * @param batchId ID of the batch
     */
    function deactivateBatch(uint256 batchId)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        DrugBatch storage batch = batches[batchId];
        require(batch.batchId != 0, "Batch does not exist");
        require(batch.isActive, "Batch already deactivated");

        batch.isActive = false;

        emit BatchDeactivated(batchId, msg.sender, block.timestamp);
    }

    /**
     * @dev Internal function to record movement
     */
    function _recordMovement(
        uint256 batchId,
        MovementType movementType,
        address fromAddress,
        address toAddress,
        uint256 quantity,
        bytes32 transactionHash,
        string memory notes,
        uint256 prescriptionId
    ) internal returns (uint256) {
        _movementIdCounter++;
        uint256 newMovementId = _movementIdCounter;

        MovementRecord memory newMovement = MovementRecord({
            movementId: newMovementId,
            batchId: batchId,
            movementType: movementType,
            fromAddress: fromAddress,
            toAddress: toAddress,
            quantity: quantity,
            timestamp: block.timestamp,
            transactionHash: transactionHash,
            notes: notes,
            prescriptionId: prescriptionId
        });

        batchMovements[batchId].push(newMovement);

        emit DrugMovementRecorded(
            newMovementId,
            batchId,
            movementType,
            fromAddress,
            toAddress,
            quantity,
            block.timestamp,
            transactionHash
        );

        return newMovementId;
    }

    /**
     * @dev Grant manufacturer role
     * @param account Address to grant role to
     */
    function grantManufacturerRole(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        grantRole(MANUFACTURER_ROLE, account);
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
     * @dev Grant auditor role
     * @param account Address to grant role to
     */
    function grantAuditorRole(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        grantRole(AUDITOR_ROLE, account);
    }

    /**
     * @dev Get total number of batches
     * @return Total count
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchIdCounter;
    }

    /**
     * @dev Get total number of movements
     * @return Total count
     */
    function getTotalMovements() external view returns (uint256) {
        return _movementIdCounter;
    }

    /**
     * @dev Get total number of dispensings
     * @return Total count
     */
    function getTotalDispensings() external view returns (uint256) {
        return _dispensingIdCounter;
    }
}
