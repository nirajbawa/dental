# Design Document: Appointment Management & Reminders

## Overview

This feature adds two additive capabilities to the Smile Dental Clinic application:

1. **Admin Hide Appointments** — Admins can soft-remove completed appointments from the dashboard by setting `is_hidden = 1`. The record is preserved in the DB; only the admin list view filters it out.
2. **Patient Reminder Popup** — When a patient loads their dashboard and has unread, due reminders (`is_read = 0` AND `reminder_date <= CURRENT_DATE`), a modal popup is shown. Clicking "Got it" calls a new endpoint that marks all displayed reminders as read in one request.

Both changes are purely additive: two new columns, two new endpoints, one new React component. No existing endpoints, queries, or UI flows are modified.

---

## Architecture

```mermaid
flowchart TD
    subgraph Frontend
        AD[AdminDashboard.jsx]
        UD[UserDashboard.jsx]
        RP[ReminderPopup.jsx\n(new component)]
    end

    subgraph Backend
        AR[appointments router]
        RR[reminders router]
        AC[appointmentController\nhideAppointment()]
        RC[reminderController\nmarkRemindersRead()]
    end

    subgraph Database
        AT[(appointments\n+ is_hidden TINYINT)]
        RT[(reminders\n+ is_read TINYINT)]
    end

    AD -->|PATCH /api/appointments/:id/hide| AR --> AC --> AT
    AD -->|GET /api/appointments| AR --> AC --> AT
    UD -->|GET /api/reminders| RR --> RC --> RT
    UD --> RP
    RP -->|PATCH /api/reminders/mark-read| RR --> RC --> RT
```

The architecture follows the existing pattern: Express router → controller → `db` pool query. No new services, no new middleware, no new DB tables.

---

## Components and Interfaces

### Backend

#### `PATCH /api/appointments/:id/hide`
- Middleware: `verifyToken`, `requireAdmin`
- Controller: `hideAppointment(req, res)` (new function in `appointmentController.js`)
- Sets `is_hidden = 1` for the given appointment ID
- Returns `{ success: true, message: 'Appointment hidden.' }` on success
- Returns 404 if the appointment does not exist
- Returns 403 if the caller is not an admin (enforced by `requireAdmin`)

#### `GET /api/appointments` (admin path — modified query only)
- Existing endpoint; the admin branch query gains `WHERE a.is_hidden = 0` filter
- Patient branch is unchanged (no `is_hidden` filter)

#### `PATCH /api/reminders/mark-read`
- Middleware: `verifyToken`, `requirePatient`
- Controller: `markRemindersRead(req, res)` (new function in `reminderController.js`)
- Body: `{ ids: number[] }` — array of reminder IDs to mark as read
- Filters to only IDs belonging to `req.user.id` before updating (ownership check)
- Uses a single `UPDATE reminders SET is_read = 1 WHERE id IN (?) AND user_id = ?` query
- Returns `{ success: true, updated: number }` — count of rows actually updated
- Returns 400 if `ids` is missing or not a non-empty array

#### `GET /api/reminders` (patient path — query extended)
- Existing endpoint; the patient branch `SELECT` gains `r.is_read` in the column list
- Admin branch also gains `r.is_read` for completeness

### Frontend

#### `ReminderPopup` component (`frontend/src/components/ReminderPopup.jsx`)
Props:
```ts
{
  reminders: Array<{ id, message, reminder_date, treatment_type }>,
  onClose: () => void   // called after successful mark-read
}
```
Internal state: `loading: boolean`, `error: string`

Behaviour:
- Renders a modal overlay with a list of due reminders (message, follow-up date, treatment type)
- Single "Got it" button; disabled while `loading === true`
- On click: calls `PATCH /api/reminders/mark-read` with all reminder IDs
- On success: calls `onClose()`
- On failure: sets `error` string, keeps modal open

#### `AdminDashboard.jsx` changes
- New `hideAppointment(id)` handler: calls `PATCH /api/appointments/:id/hide`, on success filters the appointment out of local state, on failure sets a per-row error string
- Appointments table: for rows where `status === 'accepted' || status === 'rejected'`, render a "Remove" button alongside the existing status badge
- The existing `appointments` state array is filtered client-side after a successful hide (no full reload)

#### `UserDashboard.jsx` changes
- After `refreshData()`, derive `dueUnreadReminders` = reminders where `is_read === 0` and `reminder_date <= today`
- Render `<ReminderPopup>` when `dueUnreadReminders.length > 0`
- `onClose` callback: re-runs `refreshData()` so the reminders tab also reflects the updated `is_read` state

---

## Data Models

### Schema migrations (additive `ALTER TABLE`)

```sql
-- Run once; safe to re-run due to IF NOT EXISTS / DEFAULT
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_hidden TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS is_read TINYINT(1) NOT NULL DEFAULT 0;
```

Both columns default to `0`, so all existing rows remain unaffected.

### Updated `appointments` row shape (admin GET response)

```json
{
  "id": 42,
  "user_id": 7,
  "name": "...",
  "status": "accepted",
  "is_hidden": 0,
  "payment_status": "completed",
  ...
}
```

`is_hidden` is not exposed in the patient GET response (the patient query does not select it and has no filter on it).

### Updated `reminders` row shape (patient GET response)

```json
{
  "id": 15,
  "user_id": 7,
  "appointment_id": 42,
  "message": "Follow-up reminder...",
  "reminder_date": "2025-07-01",
  "status": "pending",
  "is_read": 0,
  "treatment_type": "Root Canal",
  "appointment_date": "2025-06-24"
}
```

### `PATCH /api/reminders/mark-read` request body

```json
{ "ids": [15, 16] }
```

### `PATCH /api/reminders/mark-read` response body

```json
{ "success": true, "updated": 2 }
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Hide sets flag and preserves all other fields

*For any* appointment record, after calling `PATCH /api/appointments/:id/hide`, the `is_hidden` column SHALL be `1` and every other column (name, phone, email, date, time, treatment_type, status, user_id, etc.) SHALL remain identical to its pre-hide value.

**Validates: Requirements 1.2, 1.8**

---

### Property 2: Admin appointment list excludes hidden records

*For any* collection of appointments with mixed `is_hidden` values, the response from `GET /api/appointments` when called with an admin token SHALL contain only appointments where `is_hidden = 0`.

**Validates: Requirements 1.3**

---

### Property 3: Remove button visibility follows appointment status

*For any* appointment row rendered in the admin appointments table, the "Remove" button SHALL be present if and only if `status === 'accepted' || status === 'rejected'`.

**Validates: Requirements 1.9**

---

### Property 4: Hiding an appointment does not affect linked payments or reminders

*For any* appointment that is hidden, the linked payment record SHALL still appear in `GET /api/payments` and the linked reminder record SHALL still appear in `GET /api/reminders` (admin), with all fields unchanged.

**Validates: Requirements 2.1, 2.2**

---

### Property 5: Analytics totals are unaffected by hiding

*For any* appointment, hiding it SHALL NOT change the values returned by `GET /api/analytics` (total_appointments, total_revenue, pending_appointments).

**Validates: Requirements 2.4**

---

### Property 6: Patient appointment list ignores is_hidden

*For any* patient who has appointments with `is_hidden = 1`, calling `GET /api/appointments` with that patient's token SHALL return those appointments (i.e., the patient view is not filtered by `is_hidden`).

**Validates: Requirements 2.5**

---

### Property 7: Reminder popup shown iff unread due reminders exist

*For any* reminders array passed to the UserDashboard, the `ReminderPopup` SHALL be rendered if and only if at least one reminder satisfies `is_read === 0` AND `reminder_date <= CURRENT_DATE`. When no such reminder exists, the popup SHALL NOT be rendered.

**Validates: Requirements 3.1, 5.6**

---

### Property 8: Popup displays all required fields for every due unread reminder

*For any* set of due unread reminders, the rendered `ReminderPopup` SHALL contain the `message`, `reminder_date`, and `treatment_type` for each reminder in the set.

**Validates: Requirements 3.2**

---

### Property 9: Acknowledgement sends all due-unread IDs in one request and closes popup

*For any* set of due unread reminders displayed in the popup, clicking "Got it" SHALL issue exactly one `PATCH /api/reminders/mark-read` request containing all their IDs, and on success the popup SHALL no longer be rendered.

**Validates: Requirements 3.5, 3.6**

---

### Property 10: Acknowledgement button is disabled during in-flight request

*For any* `ReminderPopup` in the `loading === true` state, the "Got it" button SHALL have the `disabled` attribute set.

**Validates: Requirements 3.8**

---

### Property 11: mark-read only updates the caller's own reminders

*For any* `PATCH /api/reminders/mark-read` request containing a mix of reminder IDs — some belonging to the authenticated patient and some belonging to other patients — only the reminders owned by the authenticated patient SHALL have `is_read` set to `1`; all other reminders SHALL remain unchanged.

**Validates: Requirements 4.3, 4.4**

---

### Property 12: GET reminders response includes is_read field

*For any* reminder returned by `GET /api/reminders` (patient token), the response object SHALL include an `is_read` field with a value of `0` or `1`.

**Validates: Requirements 4.5**

---

## Error Handling

| Scenario | Backend response | Frontend behaviour |
|---|---|---|
| `PATCH /api/appointments/:id/hide` — appointment not found | `404 { success: false, message: 'Appointment not found.' }` | Inline error shown in the appointments table row; row stays visible |
| `PATCH /api/appointments/:id/hide` — non-admin token | `403 { success: false, message: 'Access denied. Admin only.' }` | Same inline error handling |
| `PATCH /api/appointments/:id/hide` — DB error | `500 { success: false, message: 'Server error.' }` | Same inline error handling |
| `PATCH /api/reminders/mark-read` — missing/invalid `ids` | `400 { success: false, message: 'ids must be a non-empty array.' }` | Error shown inside popup; popup stays open; button re-enabled |
| `PATCH /api/reminders/mark-read` — non-patient token | `403` | Same popup error handling |
| `PATCH /api/reminders/mark-read` — DB error | `500` | Same popup error handling |
| `GET /api/appointments` — DB error | `500` | Existing dashboard error banner (unchanged) |
| `GET /api/reminders` — DB error | `500` | Existing dashboard error banner (unchanged) |

The hide-appointment handler uses optimistic UI: the row is removed from React state immediately on success. On failure, the row is kept and a per-row `hideError` map entry is set, rendering an inline error message next to the "Remove" button.

---

## Testing Strategy

### Dual approach

Both unit tests and property-based tests are required. They are complementary:
- Unit tests cover specific examples, integration points, and error conditions.
- Property-based tests verify universal correctness across randomised inputs.

### Property-based testing library

**[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript/TypeScript) — used for both backend controller tests and frontend component tests.

Each property test runs a minimum of **100 iterations**.

Every property test is tagged with a comment in the format:
`// Feature: appointment-management-reminders, Property N: <property text>`

Each correctness property above is implemented by exactly one property-based test.

### Unit tests (specific examples and edge cases)

- `hideAppointment` returns 404 for a non-existent appointment ID
- `hideAppointment` returns 403 when called without an admin token (Req 1.6)
- `markRemindersRead` returns 400 when `ids` is missing or empty
- `markRemindersRead` returns 403 when called with a non-patient token (Req 4.6)
- `ReminderPopup` renders exactly one "Got it" button (Req 3.4)
- Schema defaults: inserting a new appointment yields `is_hidden = 0`; inserting a new reminder yields `is_read = 0` (Req 1.1, 4.1)

### Property-based tests (one per correctness property)

| Test | Property | fast-check arbitraries |
|---|---|---|
| Hide sets flag, preserves fields | P1 | `fc.record({ id, name, phone, ... })` |
| Admin list excludes hidden | P2 | `fc.array(fc.record({ is_hidden: fc.boolean() }))` |
| Remove button visibility | P3 | `fc.constantFrom('pending','accepted','rejected')` |
| Hiding doesn't affect payments/reminders | P4 | `fc.record(appointment + linked records)` |
| Analytics unchanged after hide | P5 | `fc.record(analytics snapshot)` |
| Patient list ignores is_hidden | P6 | `fc.array(fc.record({ is_hidden: fc.boolean() }))` |
| Popup shown iff unread due reminders | P7 | `fc.array(fc.record({ is_read, reminder_date }))` |
| Popup displays all required fields | P8 | `fc.array(dueUnreadReminderArb)` |
| Acknowledgement sends all IDs, closes popup | P9 | `fc.array(dueUnreadReminderArb, { minLength: 1 })` |
| Button disabled during loading | P10 | `fc.boolean()` (loading state) |
| mark-read only updates caller's reminders | P11 | `fc.array(fc.record({ id, user_id }))` |
| GET reminders includes is_read | P12 | `fc.array(reminderArb)` |
