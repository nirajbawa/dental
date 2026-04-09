# Requirements Document

## Introduction

This feature extends the Smile Dental Clinic web application with two complementary capabilities:

1. **Admin: Hide Completed Appointments** — Admins can remove completed appointments from the dashboard view without deleting them from the database. This keeps the admin UI clean while preserving all historical records for auditing and analytics.

2. **Patient: Appointment Reminder Popups** — Patients see a popup notification when they have a due or upcoming reminder. Once the patient acknowledges the popup, the reminder is marked as read and the popup no longer appears. This improves patient engagement without disrupting the existing dashboard experience.

Both capabilities are additive — they extend existing tables and endpoints with new columns/flags and do not alter any existing behavior.

---

## Glossary

- **Admin_Dashboard**: The React page at `/admin` used by clinic staff to manage appointments, payments, reminders, patients, and reviews.
- **User_Dashboard**: The React page at `/dashboard` used by patients to view their appointments, payments, and reminders.
- **Appointment**: A record in the `appointments` table representing a booked clinic visit.
- **Reminder**: A record in the `reminders` table representing a follow-up notification linked to an appointment.
- **Hidden_Flag**: A boolean column (`is_hidden`) added to the `appointments` table. When `1`, the appointment is excluded from the Admin_Dashboard view but remains in the database.
- **Read_Flag**: A boolean column (`is_read`) added to the `reminders` table. When `1`, the reminder popup is suppressed for the patient.
- **Reminder_Popup**: A modal overlay rendered on the User_Dashboard that displays due or upcoming reminders with `is_read = 0`.
- **API_Server**: The Node.js/Express backend serving the `/api` routes.
- **DB**: The MySQL database (`smile_dental_clinic`) managed via the `db` connection pool.

---

## Requirements

### Requirement 1: Admin Can Hide Completed Appointments

**User Story:** As an admin, I want to hide completed appointments from the dashboard view, so that the appointments list stays focused on actionable items without losing historical data.

#### Acceptance Criteria

1. THE DB SHALL contain an `is_hidden` column of type `TINYINT(1) DEFAULT 0` on the `appointments` table.
2. WHEN an admin clicks "Remove" on an appointment, THE API_Server SHALL set `is_hidden = 1` for that appointment record.
3. WHEN the Admin_Dashboard fetches appointments, THE API_Server SHALL return only appointments where `is_hidden = 0`.
4. WHEN an appointment is hidden, THE Admin_Dashboard SHALL remove that appointment row from the displayed list without a full page reload.
5. IF the "Remove" API call fails, THEN THE Admin_Dashboard SHALL display an inline error message and leave the appointment row visible.
6. THE API_Server SHALL restrict the hide-appointment endpoint to requests authenticated with the `admin` role.
7. IF a non-admin token is used on the hide-appointment endpoint, THEN THE API_Server SHALL return HTTP 403.
8. THE DB SHALL preserve the appointment record with all original fields intact when `is_hidden = 1`.
9. WHEN an appointment has `status = 'accepted'` or `status = 'rejected'`, THE Admin_Dashboard SHALL display the "Remove" button alongside the existing status badge.
10. THE API_Server SHALL expose a `PATCH /api/appointments/:id/hide` endpoint that sets `is_hidden = 1` for the specified appointment.

---

### Requirement 2: Hidden Appointments Do Not Affect Other Data

**User Story:** As an admin, I want hidden appointments to remain linked to payments, reminders, and analytics, so that financial records and statistics stay accurate.

#### Acceptance Criteria

1. WHEN an appointment is hidden, THE API_Server SHALL continue to return its linked payment record in the payments list.
2. WHEN an appointment is hidden, THE API_Server SHALL continue to return its linked reminder record in the reminders list.
3. THE DB SHALL maintain all foreign key relationships for hidden appointments (payments, reminders, treatment_progress, reviews).
4. WHEN the analytics endpoint is called, THE API_Server SHALL include hidden appointments in all aggregate counts and revenue totals.
5. WHEN a patient fetches their own appointments, THE API_Server SHALL return all appointments regardless of `is_hidden` value.

---

### Requirement 3: Patient Sees Reminder Popup for Due Reminders

**User Story:** As a patient, I want to see a popup when I have a due follow-up reminder, so that I am notified to schedule my next visit.

#### Acceptance Criteria

1. WHEN a patient loads the User_Dashboard and has at least one reminder where `reminder_date <= CURRENT_DATE` and `is_read = 0`, THE User_Dashboard SHALL display the Reminder_Popup.
2. THE Reminder_Popup SHALL display the reminder message, the follow-up date, and the associated treatment type for each unread due reminder.
3. WHEN the Reminder_Popup is displayed, THE User_Dashboard SHALL render it as a modal overlay above all other page content.
4. THE Reminder_Popup SHALL contain a single "Got it" (or equivalent acknowledgement) button.
5. WHEN a patient clicks the acknowledgement button on the Reminder_Popup, THE API_Server SHALL set `is_read = 1` for all displayed reminder IDs in a single request.
6. WHEN `is_read` is set to `1` for a reminder, THE User_Dashboard SHALL close the Reminder_Popup and not display it again for those reminders.
7. IF the mark-as-read API call fails, THEN THE User_Dashboard SHALL display an error message inside the Reminder_Popup and keep it open.
8. WHILE the mark-as-read API call is in progress, THE Reminder_Popup SHALL disable the acknowledgement button to prevent duplicate submissions.

---

### Requirement 4: Reminder Read State is Persisted Server-Side

**User Story:** As a patient, I want my reminder acknowledgement to be saved, so that the popup does not reappear after I dismiss it.

#### Acceptance Criteria

1. THE DB SHALL contain an `is_read` column of type `TINYINT(1) DEFAULT 0` on the `reminders` table.
2. THE API_Server SHALL expose a `PATCH /api/reminders/mark-read` endpoint that accepts an array of reminder IDs and sets `is_read = 1` for each.
3. WHEN the mark-read endpoint is called, THE API_Server SHALL only update reminders that belong to the authenticated patient's `user_id`.
4. IF the mark-read request contains reminder IDs that do not belong to the authenticated patient, THEN THE API_Server SHALL ignore those IDs and return HTTP 200 for the valid ones.
5. WHEN a patient fetches reminders, THE API_Server SHALL include the `is_read` field in each reminder record.
6. THE API_Server SHALL restrict the mark-read endpoint to requests authenticated with the `patient` role.

---

### Requirement 5: Existing Functionality Is Preserved

**User Story:** As a developer, I want the new columns and endpoints to be purely additive, so that no existing feature breaks after deployment.

#### Acceptance Criteria

1. WHEN the `is_hidden` column is added to `appointments`, THE DB SHALL default all existing rows to `is_hidden = 0`, preserving current visibility.
2. WHEN the `is_read` column is added to `reminders`, THE DB SHALL default all existing rows to `is_read = 0`, preserving current reminder state.
3. THE API_Server SHALL continue to serve all existing appointment endpoints (`GET /api/appointments`, `POST /api/appointments`, `PUT /api/appointments/:id/status`, `GET /api/appointments/slots`) with unchanged behavior.
4. THE API_Server SHALL continue to serve all existing reminder endpoints (`GET /api/reminders`, `PUT /api/reminders/:id`) with unchanged behavior.
5. WHEN the Admin_Dashboard loads, THE Admin_Dashboard SHALL display all tabs (appointments, payments, reminders, patients, reviews, overview) and their existing functionality without regression.
6. WHEN the User_Dashboard loads without any unread due reminders, THE User_Dashboard SHALL not display the Reminder_Popup and SHALL render identically to the current behavior.
