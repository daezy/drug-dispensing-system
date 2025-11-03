// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PrescriptionContract
 * @dev Manages prescription lifecycle on Base blockchain
 * @notice This contract handles prescription creation, verification, and dispensing
 */
contract PrescriptionContract is AccessControl, ReentrancyGuard {

    // Role definitions
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PHARMACIST_ROLE = keccak256("PHARMACIST_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Prescription status enum
    enum PrescriptionStatus {
        Pending,
        Verified,
        Dispensed,
        Rejected,
        Expired
    }

    // Prescription structure
    struct Prescription {
        uint256 id;
        address patientAddress;
        address doctorAddress;
        uint256 drugId;
        uint256 quantity;
        string dosageInstructions;
        uint256 duration; // Duration in days
        PrescriptionStatus status;
        uint256 createdAt;
        uint256 verifiedAt;
        uint256 dispensedAt;
        address verifiedBy;
        address dispensedBy;
        bytes32 blockchainHash; // Link to off-chain hash
    }

    // State variables
    uint256 private _prescriptionIdCounter;
    mapping(uint256 => Prescription) public prescriptions;
    mapping(address => uint256[]) public patientPrescriptions;
    mapping(address => uint256[]) public doctorPrescriptions;

    // Events
    event PrescriptionCreated(
        uint256 indexed prescriptionId,
        address indexed patientAddress,
        address indexed doctorAddress,
        uint256 drugId,
        uint256 quantity,
        uint256 timestamp
    );

    event PrescriptionVerified(
        uint256 indexed prescriptionId,
        address indexed verifierAddress,
        bool isApproved,
        uint256 timestamp
    );

    event PrescriptionDispensed(
        uint256 indexed prescriptionId,
        address indexed pharmacistAddress,
        uint256 quantityDispensed,
        uint256 timestamp,
        bytes32 blockchainHash
    );

    event PrescriptionExpired(
        uint256 indexed prescriptionId,
        uint256 timestamp
    );

    event PrescriptionCancelled(
        uint256 indexed prescriptionId,
        address indexed cancelledBy,
        uint256 timestamp
    );

    // Constructor
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DOCTOR_ROLE, msg.sender);
        _grantRole(PHARMACIST_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @dev Create a new prescription
     * @param patientAddress Address of the patient
     * @param drugId ID of the prescribed drug
     * @param quantity Quantity prescribed
     * @param dosageInstructions Dosage instructions
     * @param duration Duration of the prescription in days
     * @return prescriptionId The ID of the created prescription
     */
    function createPrescription(
        address patientAddress,
        uint256 drugId,
        uint256 quantity,
        string memory dosageInstructions,
        uint256 duration
    ) external onlyRole(DOCTOR_ROLE) returns (uint256) {
        require(patientAddress != address(0), "Invalid patient address");
        require(quantity > 0, "Quantity must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");

        _prescriptionIdCounter++;
        uint256 newPrescriptionId = _prescriptionIdCounter;

        Prescription storage newPrescription = prescriptions[newPrescriptionId];
        newPrescription.id = newPrescriptionId;
        newPrescription.patientAddress = patientAddress;
        newPrescription.doctorAddress = msg.sender;
        newPrescription.drugId = drugId;
        newPrescription.quantity = quantity;
        newPrescription.dosageInstructions = dosageInstructions;
        newPrescription.duration = duration;
        newPrescription.status = PrescriptionStatus.Pending;
        newPrescription.createdAt = block.timestamp;

        patientPrescriptions[patientAddress].push(newPrescriptionId);
        doctorPrescriptions[msg.sender].push(newPrescriptionId);

        emit PrescriptionCreated(
            newPrescriptionId,
            patientAddress,
            msg.sender,
            drugId,
            quantity,
            block.timestamp
        );

        return newPrescriptionId;
    }

    /**
     * @dev Verify a prescription
     * @param prescriptionId ID of the prescription to verify
     * @param isApproved Whether the prescription is approved
     */
    function verifyPrescription(
        uint256 prescriptionId,
        bool isApproved
    ) external onlyRole(VERIFIER_ROLE) returns (bool) {
        Prescription storage prescription = prescriptions[prescriptionId];
        require(prescription.id != 0, "Prescription does not exist");
        require(
            prescription.status == PrescriptionStatus.Pending,
            "Prescription already processed"
        );

        if (isApproved) {
            prescription.status = PrescriptionStatus.Verified;
        } else {
            prescription.status = PrescriptionStatus.Rejected;
        }

        prescription.verifiedAt = block.timestamp;
        prescription.verifiedBy = msg.sender;

        emit PrescriptionVerified(
            prescriptionId,
            msg.sender,
            isApproved,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Dispense a prescription
     * @param prescriptionId ID of the prescription to dispense
     * @param quantityDispensed Quantity being dispensed
     * @param blockchainHash Off-chain blockchain hash for traceability
     */
    function dispensePrescription(
        uint256 prescriptionId,
        uint256 quantityDispensed,
        bytes32 blockchainHash
    ) external onlyRole(PHARMACIST_ROLE) nonReentrant returns (bool) {
        Prescription storage prescription = prescriptions[prescriptionId];
        require(prescription.id != 0, "Prescription does not exist");
        require(
            prescription.status == PrescriptionStatus.Verified,
            "Prescription not verified"
        );
        require(
            quantityDispensed <= prescription.quantity,
            "Quantity exceeds prescribed amount"
        );

        prescription.status = PrescriptionStatus.Dispensed;
        prescription.dispensedAt = block.timestamp;
        prescription.dispensedBy = msg.sender;
        prescription.blockchainHash = blockchainHash;

        emit PrescriptionDispensed(
            prescriptionId,
            msg.sender,
            quantityDispensed,
            block.timestamp,
            blockchainHash
        );

        return true;
    }

    /**
     * @dev Cancel a prescription (only by prescribing doctor)
     * @param prescriptionId ID of the prescription to cancel
     */
    function cancelPrescription(uint256 prescriptionId)
        external
        onlyRole(DOCTOR_ROLE)
    {
        Prescription storage prescription = prescriptions[prescriptionId];
        require(prescription.id != 0, "Prescription does not exist");
        require(prescription.doctorAddress == msg.sender, "Only prescribing doctor can cancel");
        require(
            prescription.status != PrescriptionStatus.Dispensed,
            "Cannot cancel dispensed prescription"
        );

        prescription.status = PrescriptionStatus.Rejected;

        emit PrescriptionCancelled(prescriptionId, msg.sender, block.timestamp);
    }

    /**
     * @dev Expire a prescription
     * @param prescriptionId ID of the prescription to expire
     */
    function expirePrescription(uint256 prescriptionId)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        Prescription storage prescription = prescriptions[prescriptionId];
        require(prescription.id != 0, "Prescription does not exist");
        require(
            prescription.status != PrescriptionStatus.Dispensed,
            "Cannot expire dispensed prescription"
        );

        prescription.status = PrescriptionStatus.Expired;

        emit PrescriptionExpired(prescriptionId, block.timestamp);
    }

    /**
     * @dev Check if prescription is valid (verified or dispensed)
     * @param prescriptionId ID of the prescription
     * @return bool True if valid
     */
    function isValidPrescription(uint256 prescriptionId)
        external
        view
        returns (bool)
    {
        if (prescriptions[prescriptionId].id == 0) return false;
        PrescriptionStatus status = prescriptions[prescriptionId].status;
        return status == PrescriptionStatus.Verified || status == PrescriptionStatus.Dispensed;
    }

    /**
     * @dev Get prescription details
     * @param prescriptionId ID of the prescription
     * @return Prescription struct
     */
    function getPrescription(uint256 prescriptionId)
        external
        view
        returns (Prescription memory)
    {
        require(prescriptions[prescriptionId].id != 0, "Prescription does not exist");
        return prescriptions[prescriptionId];
    }

    /**
     * @dev Get all prescriptions for a patient
     * @param patientAddress Address of the patient
     * @return Array of prescription IDs
     */
    function getPatientPrescriptions(address patientAddress)
        external
        view
        returns (uint256[] memory)
    {
        return patientPrescriptions[patientAddress];
    }

    /**
     * @dev Get all prescriptions by a doctor
     * @param doctorAddress Address of the doctor
     * @return Array of prescription IDs
     */
    function getDoctorPrescriptions(address doctorAddress)
        external
        view
        returns (uint256[] memory)
    {
        return doctorPrescriptions[doctorAddress];
    }

    /**
     * @dev Grant doctor role to an address
     * @param account Address to grant role to
     */
    function grantDoctorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DOCTOR_ROLE, account);
    }

    /**
     * @dev Grant pharmacist role to an address
     * @param account Address to grant role to
     */
    function grantPharmacistRole(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        grantRole(PHARMACIST_ROLE, account);
    }

    /**
     * @dev Grant verifier role to an address
     * @param account Address to grant role to
     */
    function grantVerifierRole(address account)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        grantRole(VERIFIER_ROLE, account);
    }

    /**
     * @dev Get total number of prescriptions
     * @return Total count
     */
    function getTotalPrescriptions() external view returns (uint256) {
        return _prescriptionIdCounter;
    }
}
