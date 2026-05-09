# SmartCare Hospital Management System

A full-stack Hospital Management System designed to digitize and streamline hospital operations — managing patients, doctors, appointments, prescriptions, billing, and more — all from a single web interface.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Running with Docker (Recommended)](#running-with-docker-recommended)
- [Running Manually (Without Docker)](#running-manually-without-docker)
- [Default Login](#default-login)
- [API Overview](#api-overview)
- [Database](#database)
- [Environment Variables](#environment-variables)

---

## Overview

SmartCare HMS is a multi-role hospital management platform. It supports admin, doctor, and staff roles with a React frontend communicating to a Java Spring Boot REST API, backed by a PostgreSQL database.

The entire stack is containerized with Docker and can be started with a single command:

```bash
docker compose up -d
```

---

## Features

| Module | Description |
|---|---|
| Authentication | JWT-based login with role-based access control |
| Dashboard | Summary statistics and system overview |
| Patients | Register, view, and manage patient records |
| Doctors | Manage doctor profiles and specializations |
| Appointments | Schedule and track patient appointments |
| Clinics | Manage clinic departments and reservations |
| Medical Records | View and update patient medical history |
| Prescriptions | Issue prescriptions with drug details |
| Drugs | Manage the hospital drug inventory |
| Billing & Invoices | Generate and track invoices and payments |
| Notifications | In-system notifications for staff |
| Schedule | Doctor schedule and availability management |

---

## Technologies

### Frontend

| Technology | Purpose |
|---|---|
| **React 18** | UI framework — component-based user interface |
| **TypeScript** | Type-safe JavaScript across the entire frontend |
| **Vite** | Fast build tool and development server |
| **Tailwind CSS** | Utility-first CSS framework for styling |
| **Radix UI** | Accessible, unstyled UI primitives (modals, dropdowns, tooltips, etc.) |
| **shadcn/ui** | Pre-built component library built on top of Radix UI |
| **TanStack Query** | Server state management — fetching, caching, and syncing API data |
| **React Hook Form** | Performant form management with validation |
| **Zod** | Schema-based validation for forms and API responses |
| **Wouter** | Lightweight client-side routing |
| **Recharts** | Charts and data visualization for the dashboard |
| **Framer Motion** | Smooth animations and page transitions |
| **Lucide React** | Icon library |
| **date-fns** | Date formatting and manipulation |
| **Nginx** | Serves the built frontend in Docker and proxies `/api/` to the backend |

### Backend

| Technology | Purpose |
|---|---|
| **Java 19** | Programming language |
| **Spring Boot 3.1.5** | Application framework — REST API, dependency injection, auto-configuration |
| **Spring Security** | Authentication and authorization |
| **Spring Data JPA** | Database access layer using the repository pattern |
| **Hibernate** | ORM — maps Java entities to PostgreSQL tables, auto-creates schema |
| **JWT (JJWT 0.11.5)** | Stateless token-based authentication |
| **Lombok** | Reduces boilerplate (getters, setters, constructors via annotations) |
| **Maven** | Build tool and dependency management |
| **PostgreSQL Driver** | JDBC connector for PostgreSQL |

### Database

| Technology | Purpose |
|---|---|
| **PostgreSQL 14** | Relational database storing all hospital data |
| **pgAdmin 4** | Web-based database GUI at http://localhost:5050 |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker** | Containerizes each service into isolated, portable units |
| **Docker Compose** | Orchestrates all 4 containers with a single command |
| **pnpm** | Fast, disk-efficient Node.js package manager (monorepo workspace) |

---

## Project Structure

```
smartcare-hospital/
├── artifacts/
│   ├── api-server/                 # Java Spring Boot backend
│   │   ├── src/main/java/com/smartcare/
│   │   │   ├── controller/         # REST API endpoints
│   │   │   ├── model/entity/       # JPA database entities
│   │   │   ├── model/enums/        # Enums (roles, statuses, etc.)
│   │   │   ├── repository/         # Spring Data JPA repositories
│   │   │   ├── service/            # Business logic layer
│   │   │   ├── security/           # JWT filter, UserDetailsService
│   │   │   └── config/             # Security and app configuration
│   │   ├── src/main/resources/
│   │   │   └── application.properties
│   │   ├── pom.xml
│   │   └── Dockerfile
│   └── smartcare/                  # React + Vite frontend
│       ├── src/
│       │   ├── pages/              # One file per page/route
│       │   ├── components/         # Reusable UI components
│       │   ├── hooks/              # Custom React hooks
│       │   └── lib/                # Utilities and API client
│       ├── nginx.conf              # Nginx config for Docker
│       └── Dockerfile
├── docker-compose.yaml             # All 4 services wired together
├── smartcare_dummy_data.sql        # Sample data for testing
├── .env.example                    # Environment variable template
└── SETUP.md                        # Manual setup guide (no Docker)
```

---

## Running with Docker (Recommended)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

**1. Clone the repository:**
```bash
git clone https://github.com/kindahard/smartcare-hospital.git
cd smartcare-hospital
```

**2. Create your environment file:**
```bash
cp .env.example .env
```
Edit `.env` if you want custom passwords (defaults work fine for local use).

**3. Start all services:**
```bash
docker compose up -d
```

First run takes a few minutes as Docker downloads and builds images. Subsequent runs are fast (cached).

**4. Load sample data (optional):**

On Linux/macOS:
```bash
docker exec -i smartcare_db psql -U smartcare -d smartcare < smartcare_dummy_data.sql
```

On Windows PowerShell (run from the project folder):
```powershell
Get-Content smartcare_dummy_data.sql | docker exec -i smartcare_db psql -U smartcare_user -d smartcare
```

> Note: The standard `<` redirect does not work in PowerShell. Always use `Get-Content ... |` instead.

**5. Open the app:**

| Service | URL |
|---|---|
| Application | http://localhost:80 |
| API Health Check | http://localhost:8080/api/healthz |
| pgAdmin (DB GUI) | http://localhost:5050 |

**Stopping the stack:**
```bash
docker compose down
```

**Stopping and wiping the database:**
```bash
docker compose down -v
```

---

## Running Manually (Without Docker)

See [SETUP.md](SETUP.md) for step-by-step instructions to run the frontend and backend directly on your machine without Docker.

---

## Default Login

| Field | Value |
|---|---|
| Email | `admin@smartcare.com` |
| Password | `admin123` |

The default admin account is created automatically on first startup.

---

## API Overview

All API routes are prefixed with `/api`. The backend runs on port `8080`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login and receive a JWT token |
| POST | `/api/auth/register` | Register a new user |
| GET | `/api/patients` | List all patients |
| GET | `/api/doctors` | List all doctors |
| GET | `/api/appointments` | List all appointments |
| GET | `/api/clinics` | List all clinics |
| GET | `/api/medical-records` | List all medical records |
| GET | `/api/prescriptions` | List all prescriptions |
| GET | `/api/drugs` | List all drugs |
| GET | `/api/invoices` | List all invoices |
| GET | `/api/notifications` | List notifications |
| GET | `/api/dashboard` | Dashboard summary statistics |
| GET | `/api/healthz` | Health check |

All protected endpoints require the header:
```
Authorization: Bearer <token>
```

---

## Database

PostgreSQL 14 is used as the database. Hibernate automatically creates and updates all tables on startup — **no manual SQL schema setup is needed.**

### Entities

| Table | Description |
|---|---|
| `app_user` | System users with roles (admin, doctor, staff) |
| `patient` | Patient personal and medical info |
| `doctor` | Doctor profiles and specializations |
| `appointment` | Scheduled appointments between patients and doctors |
| `clinic` | Hospital departments/clinics |
| `clinic_reservation` | Clinic booking records |
| `medical_record` | Patient medical history entries |
| `prescription` | Issued prescriptions |
| `prescription_detail` | Individual drugs per prescription |
| `drug` | Hospital drug inventory |
| `invoice` | Patient billing records |
| `payment` | Payment transactions |
| `notification` | Staff notifications |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# PostgreSQL
POSTGRES_DB=smartcare
POSTGRES_USER=smartcare
POSTGRES_PASSWORD=smartcare123

# pgAdmin
PGADMIN_EMAIL=admin@smartcare.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050

# Ports
BACKEND_PORT=8080
FRONTEND_PORT=80

# JWT
JWT_SECRET=smartcare-super-secret-jwt-key-2026-helwan-university

All values have defaults in `docker-compose.yaml` so the `.env` file is optional for local development.
