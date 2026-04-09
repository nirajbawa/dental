-- ============================================================
-- THE SMILE DENTAL CLINIC - Complete MySQL Schema
-- Dr. Manjiri Salkar | Nashik, Maharashtra
-- ============================================================

CREATE DATABASE IF NOT EXISTS smile_dental_clinic;
USE smile_dental_clinic;

-- ============================================================
-- TABLE 1: users
-- Purpose: Stores all patient accounts
-- Relationships: One user → many appointments, payments, reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone CHAR(10) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('patient') DEFAULT 'patient',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone)
);

-- ============================================================
-- TABLE 2: admin
-- Purpose: Stores admin/doctor login credentials
-- Max 2 entries enforced at application level
-- ============================================================
CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 3: treatments
-- Purpose: Master list of available treatment types
-- Relationships: One treatment → many treatment_progress records
-- ============================================================
CREATE TABLE IF NOT EXISTS treatments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  estimated_days INT NOT NULL COMMENT 'Days until follow-up reminder',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 4: appointments
-- Purpose: All appointment bookings
-- Relationships: Belongs to user; has one payment, one reminder
-- UNIQUE(date, time) prevents double booking
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone CHAR(10) NOT NULL,
  email VARCHAR(150) NOT NULL,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  treatment_type VARCHAR(100) NOT NULL,
  payment_option ENUM('pay_now', 'pay_later') NOT NULL DEFAULT 'pay_later',
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_slot (date, time),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_appointments_user (user_id),
  INDEX idx_appointments_date (date),
  INDEX idx_appointments_status (status)
);

-- ============================================================
-- TABLE 5: payments
-- Purpose: Payment records linked to appointments
-- Relationships: Belongs to user and appointment
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  appointment_id INT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 400.00,
  payment_mode ENUM('online', 'clinic') NOT NULL,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_payments_user (user_id),
  INDEX idx_payments_status (status)
);

-- ============================================================
-- TABLE 6: reminders
-- Purpose: Auto-generated follow-up reminders per treatment
-- Relationships: Linked to user and appointment
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  appointment_id INT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  reminder_date DATE NOT NULL,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_reminders_user (user_id),
  INDEX idx_reminders_date (reminder_date)
);

-- ============================================================
-- TABLE 7: treatment_progress
-- Purpose: Tracks ongoing treatment progress per patient
-- Relationships: Links user + appointment + treatment
-- ============================================================
CREATE TABLE IF NOT EXISTS treatment_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  appointment_id INT NOT NULL,
  treatment_id INT NOT NULL,
  progress_notes TEXT,
  status ENUM('ongoing', 'completed') DEFAULT 'ongoing',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE CASCADE,
  INDEX idx_progress_user (user_id)
);

-- ============================================================
-- TABLE 8: analytics
-- Purpose: Aggregated dashboard metrics for admin
-- Updated whenever appointments/payments change
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  total_patients INT DEFAULT 0,
  total_appointments INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add Razorpay tracking columns to payments (run once)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100) DEFAULT NULL;
INSERT INTO analytics (total_patients, total_appointments, total_revenue)
SELECT 0, 0, 0.00
WHERE NOT EXISTS (SELECT 1 FROM analytics LIMIT 1);

-- Seed treatments master data
INSERT IGNORE INTO treatments (name, description, estimated_days) VALUES
('Implants', 'Dental implant placement and restoration', 7),
('Root Canal', 'Root canal treatment and crown placement', 3),
('Whitening', 'Professional teeth whitening procedure', 30),
('Braces', 'Orthodontic braces fitting and adjustment', 30),
('Extraction', 'Tooth extraction procedure', 2),
('Gum Surgery', 'Periodontal gum surgery', 5),
('General', 'General dental consultation and checkup', 180);

-- ============================================================
-- TABLE 9: reviews
-- Purpose: Patient ratings and reviews after appointments
-- One review per user per appointment (UNIQUE constraint)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  appointment_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  is_visible TINYINT(1) DEFAULT 1 COMMENT '0 = hidden by admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (user_id, appointment_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  INDEX idx_reviews_visible (is_visible),
  INDEX idx_reviews_user (user_id)
);
