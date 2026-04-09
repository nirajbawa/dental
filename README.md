# The Smile Dental Clinic — Management Platform

**Dr. Manjiri Salkar** | Dentist | Prosthodontist | Implantologist | Smile Designer  
Gaurav Accident Clinic, Nashik, Maharashtra, India

---

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Auth: JWT + bcrypt
- Roles: admin, patient

---

## Project Structure

```
dental-clinic/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
└── database/
    └── schema.sql
```

---

## Setup Instructions

### 1. MySQL Setup

```sql
-- In MySQL Workbench or terminal:
mysql -u root -p
source /path/to/dental-clinic/database/schema.sql
```

Or run the SQL file directly:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend Setup

```bash
cd dental-clinic/backend
npm install
```

Edit `.env` and set your MySQL password:
```
DB_PASSWORD=your_actual_mysql_password
```

Start backend:
```bash
npm run dev
```

The server runs on **http://localhost:5000**  
On startup, it auto-seeds 2 admins if they don't exist.

### 3. Frontend Setup

```bash
cd dental-clinic/frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Default Admin Credentials

| Role   | Username | Password   |
|--------|----------|------------|
| Admin  | admin1   | admin123   |
| Doctor | doctor   | doctor123  |

Admin login: http://localhost:5173/admin/login

---

## Features

- Patient signup/login with JWT
- Admin login (2 fixed admins, no signup)
- Book appointments with dynamic slot management
- Consultation fee: Rs. 400 (Pay Now or Pay Later)
- Auto-generated treatment reminders
- Admin dashboard: manage appointments, payments, reminders, patients
- Analytics overview
- WhatsApp integration
- Fully database-driven (MySQL)

---

## API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/signup | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/admin/login | Public |
| GET | /api/appointments/slots?date= | Public |
| POST | /api/appointments | Patient |
| GET | /api/appointments | Patient/Admin |
| PUT | /api/appointments/:id/status | Admin |
| GET | /api/payments | Patient/Admin |
| PUT | /api/payments/:id | Admin |
| GET | /api/reminders | Patient/Admin |
| PUT | /api/reminders/:id | Admin |
| GET | /api/patients | Admin |
| GET | /api/patients/profile | Patient |
| GET | /api/analytics | Admin |
