-- Migration: add_hidden_read_columns
-- Adds is_hidden to appointments and is_read to reminders.
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS.
-- Requirements: 1.1, 4.1, 5.1, 5.2

USE smile_dental_clinic;

-- Requirement 1.1, 5.1: Add is_hidden to appointments (defaults to 0, preserving existing rows)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_hidden TINYINT(1) NOT NULL DEFAULT 0;

-- Requirement 4.1, 5.2: Add is_read to reminders (defaults to 0, preserving existing rows)
ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS is_read TINYINT(1) NOT NULL DEFAULT 0;
