-- Blockchain-Based Drug Dispensing System Database Schema
-- Based on ERD specifications from Chapter 3

-- Users table (base table for all user types)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    passport_photo VARCHAR(500), -- URL/path to uploaded passport photo
    role ENUM('doctor', 'pharmacist', 'patient', 'admin') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctors table
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    specialization VARCHAR(100),
    contact_info JSON, -- Phone, emergency contact, etc.
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Pharmacists table
CREATE TABLE pharmacists (
    pharmacist_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    pharmacy_name VARCHAR(200),
    contact_info JSON,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Patients table
CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    date_of_birth DATE,
    medical_record_number VARCHAR(50) UNIQUE,
    contact_info JSON,
    emergency_contact JSON,
    allergies TEXT,
    medical_history TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Drugs table
CREATE TABLE drugs (
    drug_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    dosage_form ENUM('tablet', 'capsule', 'liquid', 'injection', 'cream', 'drops', 'inhaler') NOT NULL,
    strength VARCHAR(50) NOT NULL, -- e.g., "500mg", "10ml"
    manufacturer VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    minimum_stock_level INT DEFAULT 10,
    unit_price DECIMAL(10,2),
    description TEXT,
    storage_requirements TEXT,
    side_effects TEXT,
    contraindications TEXT,
    blockchain_hash VARCHAR(66), -- For blockchain traceability
    onchain_tx_hash VARCHAR(66), -- Transaction hash from on-chain creation
    onchain_block_number INT, -- Block number where drug was added
    onchain_drug_id INT, -- Drug ID from blockchain contract
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Prescriptions table
CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    drug_id INT NOT NULL,
    pharmacist_id INT, -- Assigned when dispensing
    quantity_prescribed INT NOT NULL,
    quantity_dispensed INT DEFAULT 0,
    dosage_instructions TEXT NOT NULL,
    frequency VARCHAR(100), -- e.g., "3 times a day"
    duration VARCHAR(100), -- e.g., "7 days"
    date_issued TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_dispensed TIMESTAMP NULL,
    status ENUM('pending', 'verified', 'dispensed', 'rejected', 'expired') DEFAULT 'pending',
    notes TEXT,
    blockchain_hash VARCHAR(66), -- Immutable record on blockchain
    onchain_tx_hash VARCHAR(66), -- Transaction hash from on-chain creation
    onchain_block_number INT, -- Block number where prescription was created
    onchain_prescription_id INT, -- Prescription ID from blockchain contract
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(drug_id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacist_id) REFERENCES pharmacists(pharmacist_id) ON DELETE SET NULL
);

-- Prescription audit trail for blockchain integration
CREATE TABLE prescription_audit (
    audit_id SERIAL PRIMARY KEY,
    prescription_id INT NOT NULL,
    action ENUM('created', 'verified', 'dispensed', 'rejected', 'modified') NOT NULL,
    performed_by INT NOT NULL, -- user_id
    blockchain_transaction_hash VARCHAR(66),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSON, -- Additional audit information
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Drug inventory transactions for traceability
CREATE TABLE inventory_transactions (
    transaction_id SERIAL PRIMARY KEY,
    drug_id INT NOT NULL,
    transaction_type ENUM('stock_in', 'dispensed', 'expired', 'damaged', 'returned') NOT NULL,
    quantity INT NOT NULL,
    prescription_id INT, -- If related to dispensing
    performed_by INT NOT NULL, -- user_id
    blockchain_transaction_hash VARCHAR(66),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (drug_id) REFERENCES drugs(drug_id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- System notifications
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('prescription_ready', 'low_stock', 'drug_expired', 'prescription_expired', 'system_alert') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- System settings and configuration
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Blockchain configuration
CREATE TABLE blockchain_config (
    config_id SERIAL PRIMARY KEY,
    network_name VARCHAR(50) DEFAULT 'Base',
    rpc_endpoint VARCHAR(500) DEFAULT 'https://mainnet.helius-rpc.com/?api-key=c56adc77-a357-46ba-9057-b75652c873c4',
    contract_address VARCHAR(42),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drug Traceability Tables
-- Drug batches for tracking from manufacturer to patient
CREATE TABLE drug_batches (
    batch_id SERIAL PRIMARY KEY,
    drug_id INT, -- Link to drugs table (optional)
    drug_name VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    manufacturer_address VARCHAR(42) NOT NULL, -- Blockchain address of manufacturer
    manufactured_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    initial_quantity INT NOT NULL,
    remaining_quantity INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata_hash VARCHAR(66), -- IPFS or additional metadata hash
    onchain_batch_id INT, -- ID from blockchain
    onchain_tx_hash VARCHAR(66), -- Transaction hash from creation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (drug_id) REFERENCES drugs(drug_id) ON DELETE SET NULL
);

-- Movement records to track drug journey
CREATE TABLE movement_records (
    movement_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL,
    movement_type ENUM('manufactured', 'received_by_pharmacist', 'dispensed_to_patient', 'returned', 'destroyed') NOT NULL,
    from_address VARCHAR(42), -- Blockchain address (null for manufacturing)
    to_address VARCHAR(42) NOT NULL, -- Blockchain address
    quantity INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_hash VARCHAR(66), -- Blockchain transaction hash
    notes TEXT,
    prescription_id INT, -- Link to prescription if dispensing
    onchain_movement_id INT, -- ID from blockchain
    onchain_tx_hash VARCHAR(66), -- Transaction hash from recording
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES drug_batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE SET NULL
);

-- Dispensing records with verification hashes for patients
CREATE TABLE dispensing_records (
    dispensing_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL,
    prescription_id INT NOT NULL,
    patient_address VARCHAR(42) NOT NULL, -- Patient's blockchain address
    pharmacist_address VARCHAR(42) NOT NULL, -- Pharmacist's blockchain address
    quantity INT NOT NULL,
    verification_hash VARCHAR(66) NOT NULL UNIQUE, -- For patient to verify authenticity
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP NULL,
    onchain_dispensing_id INT, -- ID from blockchain
    onchain_tx_hash VARCHAR(66), -- Transaction hash from dispensing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES drug_batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE
);

-- Traceability audit trail
CREATE TABLE traceability_audit (
    audit_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL,
    action ENUM('batch_created', 'movement_recorded', 'dispensing_recorded', 'verification_performed') NOT NULL,
    performed_by INT NOT NULL, -- user_id
    blockchain_tx_hash VARCHAR(66),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSON, -- Additional audit information
    FOREIGN KEY (batch_id) REFERENCES drug_batches(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_drugs_name ON drugs(name);
CREATE INDEX idx_drugs_expiry ON drugs(expiry_date);
CREATE INDEX idx_inventory_drug ON inventory_transactions(drug_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_drug_batches_batch_number ON drug_batches(batch_number);
CREATE INDEX idx_movement_records_batch ON movement_records(batch_id);
CREATE INDEX idx_dispensing_records_verification_hash ON dispensing_records(verification_hash);
CREATE INDEX idx_dispensing_records_patient ON dispensing_records(patient_address);
CREATE INDEX idx_traceability_audit_batch ON traceability_audit(batch_id);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('prescription_expiry_days', '30', 'Number of days before a prescription expires'),
('low_stock_threshold', '10', 'Minimum stock level to trigger alerts'),
('max_upload_size', '5242880', 'Maximum file upload size in bytes (5MB)'),
('allowed_file_types', 'jpg,jpeg,png,pdf', 'Allowed file types for uploads');

-- Insert blockchain configuration
INSERT INTO blockchain_config (network_name, rpc_endpoint) VALUES
('Base', 'https://mainnet.helius-rpc.com/?api-key=c56adc77-a357-46ba-9057-b75652c873c4');