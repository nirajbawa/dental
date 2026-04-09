# Implementation Plan: Appointment Management & Reminders

## Overview

Additive implementation: two DB migrations, two new backend endpoints, two controller functions, one new React component, and targeted changes to AdminDashboard and UserDashboard. No existing behavior is altered.

## Tasks

- [x] 1. Run DB migrations to add new columns
  - Add `is_hidden TINYINT(1) NOT NULL DEFAULT 0` to `appointments` table using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
  - Add `is_read TINYINT(1) NOT NULL DEFAULT 0` to `reminders` table using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
  - Place migration SQL in a file (e.g. `backend/migrations/add_hidden_read_columns.sql`) so it can be run once against the DB
  - _Requirements: 1.1, 4.1, 5.1, 5.2_

- [x] 2. Backend — hide appointment endpoint
  - [x] 2.1 Implement `hideAppointment(req, res)` in `backend/controllers/appointmentController.js`
    - Query: `UPDATE appointments SET is_hidden = 1 WHERE id = ?`
    - Return 404 `{ success: false, message: 'Appointment not found.' }` when `affectedRows === 0`
    - Return 200 `{ success: true, message: 'Appointment hidden.' }` on success
    - _Requirements: 1.2, 1.10_

  - [ ]* 2.2 Write property test for `hideAppointment` — Property 1: Hide sets flag and preserves all other fields
    - **Property 1: Hide sets flag, preserves all other fields**
    - **Validates: Requirements 1.2, 1.8**
    - Use `fc.record(...)` to generate arbitrary appointment rows; assert `is_hidden === 1` and all other fields unchanged after call

  - [x] 2.3 Update admin `GET /api/appointments` query to filter `is_hidden = 0`
    - In `appointmentController.js`, add `AND a.is_hidden = 0` to the admin branch `WHERE` clause only
    - Patient branch query is unchanged
    - _Requirements: 1.3, 2.5, 5.3_

  - [ ]* 2.4 Write property test for admin appointment list — Property 2: Admin list excludes hidden records
    - **Property 2: Admin appointment list excludes hidden records**
    - **Validates: Requirements 1.3**
    - Use `fc.array(fc.record({ is_hidden: fc.boolean() }))` to generate mixed arrays; assert response contains only `is_hidden = 0` entries

  - [ ]* 2.5 Write unit tests for `hideAppointment`
    - Test 404 for non-existent appointment ID
    - Test 403 when called without admin token (Req 1.6, 1.7)
    - _Requirements: 1.6, 1.7_

  - [x] 2.6 Register `PATCH /api/appointments/:id/hide` route in `backend/routes/appointments.js`
    - Apply `verifyToken` and `requireAdmin` middleware
    - Wire to `hideAppointment` controller
    - _Requirements: 1.6, 1.10_

- [x] 3. Backend — mark reminders read endpoint
  - [x] 3.1 Implement `markRemindersRead(req, res)` in `backend/controllers/reminderController.js`
    - Validate `ids` is a non-empty array; return 400 `{ success: false, message: 'ids must be a non-empty array.' }` otherwise
    - Query: `UPDATE reminders SET is_read = 1 WHERE id IN (?) AND user_id = ?` using `req.user.id`
    - Return 200 `{ success: true, updated: affectedRows }`
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 3.2 Write property test for `markRemindersRead` — Property 11: mark-read only updates caller's own reminders
    - **Property 11: mark-read only updates the caller's own reminders**
    - **Validates: Requirements 4.3, 4.4**
    - Use `fc.array(fc.record({ id: fc.nat(), user_id: fc.nat() }))` with mixed ownership; assert only caller-owned reminders are updated

  - [x] 3.3 Update `GET /api/reminders` query to include `r.is_read` in the SELECT column list
    - Add `r.is_read` to both the patient and admin branch SELECT lists
    - _Requirements: 4.5, 5.4_

  - [ ]* 3.4 Write property test for GET reminders — Property 12: GET reminders response includes is_read field
    - **Property 12: GET reminders response includes is_read field**
    - **Validates: Requirements 4.5**
    - Use `fc.array(reminderArb)` to generate reminder rows; assert every returned object has an `is_read` field with value `0` or `1`

  - [ ]* 3.5 Write unit tests for `markRemindersRead`
    - Test 400 when `ids` is missing or empty array
    - Test 403 when called with non-patient token (Req 4.6)
    - _Requirements: 4.2, 4.6_

  - [x] 3.6 Register `PATCH /api/reminders/mark-read` route in `backend/routes/reminders.js`
    - Apply `verifyToken` and `requirePatient` middleware
    - Wire to `markRemindersRead` controller
    - _Requirements: 4.2, 4.6_

- [ ] 4. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Frontend — ReminderPopup component
  - [x] 5.1 Create `frontend/src/components/ReminderPopup.jsx`
    - Props: `reminders` (array of `{ id, message, reminder_date, treatment_type }`), `onClose` callback
    - Internal state: `loading` (boolean), `error` (string)
    - Render a modal overlay listing each reminder's message, follow-up date, and treatment type
    - Single "Got it" button; `disabled` when `loading === true`
    - On click: set `loading = true`, call `PATCH /api/reminders/mark-read` with all reminder IDs
    - On success: call `onClose()`
    - On failure: set `error` string, keep modal open, re-enable button
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 5.2 Write property test for ReminderPopup — Property 7: Popup shown iff unread due reminders exist
    - **Property 7: Reminder popup shown iff unread due reminders exist**
    - **Validates: Requirements 3.1, 5.6**
    - Use `fc.array(fc.record({ is_read: fc.boolean(), reminder_date: fc.string() }))` to generate mixed arrays; assert popup renders iff at least one entry satisfies `is_read === 0 && reminder_date <= today`

  - [ ]* 5.3 Write property test for ReminderPopup — Property 8: Popup displays all required fields
    - **Property 8: Popup displays all required fields for every due unread reminder**
    - **Validates: Requirements 3.2**
    - Use `fc.array(dueUnreadReminderArb, { minLength: 1 })`; assert rendered output contains `message`, `reminder_date`, and `treatment_type` for each entry

  - [ ]* 5.4 Write property test for ReminderPopup — Property 9: Acknowledgement sends all IDs in one request and closes popup
    - **Property 9: Acknowledgement sends all due-unread IDs in one request and closes popup**
    - **Validates: Requirements 3.5, 3.6**
    - Use `fc.array(dueUnreadReminderArb, { minLength: 1 })`; mock fetch; assert exactly one PATCH call is made containing all IDs, and `onClose` is called on success

  - [ ]* 5.5 Write property test for ReminderPopup — Property 10: Button disabled during loading
    - **Property 10: Acknowledgement button is disabled during in-flight request**
    - **Validates: Requirements 3.8**
    - Use `fc.boolean()` for loading state; assert button has `disabled` attribute when `loading === true`

  - [ ]* 5.6 Write unit test for ReminderPopup
    - Test that exactly one "Got it" button is rendered (Req 3.4)
    - _Requirements: 3.4_

- [x] 6. Frontend — AdminDashboard changes
  - [x] 6.1 Add `hideAppointment(id)` handler in `frontend/src/pages/AdminDashboard.jsx`
    - Call `PATCH /api/appointments/:id/hide` with admin auth token
    - On success: filter the appointment out of local `appointments` state (no full reload)
    - On failure: set a per-row error entry in a `hideErrors` state map, display inline error next to the "Remove" button
    - _Requirements: 1.2, 1.4, 1.5_

  - [x] 6.2 Render "Remove" button in the appointments table for accepted/rejected rows
    - For each row where `status === 'accepted' || status === 'rejected'`, render a "Remove" button alongside the existing status badge
    - Button calls `hideAppointment(appointment.id)` on click
    - Display inline error from `hideErrors[appointment.id]` when present
    - _Requirements: 1.4, 1.5, 1.9_

  - [ ]* 6.3 Write property test for AdminDashboard — Property 3: Remove button visibility follows appointment status
    - **Property 3: Remove button visibility follows appointment status**
    - **Validates: Requirements 1.9**
    - Use `fc.constantFrom('pending', 'accepted', 'rejected')` to generate rows; assert "Remove" button is present iff `status === 'accepted' || status === 'rejected'`

- [x] 7. Frontend — UserDashboard changes
  - [x] 7.1 Derive `dueUnreadReminders` and render `ReminderPopup` in `frontend/src/pages/UserDashboard.jsx`
    - After `refreshData()`, compute `dueUnreadReminders = reminders.filter(r => r.is_read === 0 && r.reminder_date <= today)`
    - Render `<ReminderPopup reminders={dueUnreadReminders} onClose={refreshData} />` when `dueUnreadReminders.length > 0`
    - `onClose` calls `refreshData()` so the reminders tab reflects updated `is_read` state
    - _Requirements: 3.1, 3.6, 5.6_

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check; each test runs a minimum of 100 iterations
- Every property test must include the comment: `// Feature: appointment-management-reminders, Property N: <property text>`
- The migration SQL uses `IF NOT EXISTS` so it is safe to re-run
