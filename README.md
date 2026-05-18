# SHA — Social Health Authority Management System

Kenya's national health insurance management platform, built to replace NHIF with a modern, digitally-integrated system connecting citizens, hospitals, employers, and government databases.

---

## Project Overview

SHA is a full-stack web application for managing national health insurance operations. It handles member registration, contribution tracking, hospital provider management, claims processing, fraud detection, and automated notifications — all accessible through a clean React dashboard backed by a Django REST API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.x + Django REST Framework |
| Database | PostgreSQL (SQLite for development) |
| Frontend | React 18 + Vite |
| Styling | Bootstrap 5 + Bootstrap Icons + Custom CSS |
| HTTP Client | Axios |
| Auth | Django session / token auth (extensible) |

---

## Project Structure

```
sha-system/
├── backend/
│   ├── sha/                        # Django project root
│   │   ├── settings.py             # Project settings
│   │   └── urls.py                 # Main URL configuration
│   └── core/                       # Single core application
│       ├── models.py               # All data models
│       ├── serializers.py          # DRF serializers
│       ├── views.py                # ViewSets + dashboard endpoint
│       └── urls.py                 # App-level URL routing
│
└── frontend/
    ├── index.html                  # Entry point (Bootstrap Icons CDN)
    ├── main.jsx                    # React root mount
    ├── app.jsx                     # Router + layout shell
    ├── utils/
    │   └── api.js                  # Axios instance + API helpers
    ├── components/
    │   ├── Sidebar.jsx             # Navigation sidebar
    │   └── Navbar.jsx              # Top navbar
    ├── pages/                      # One file per module
    │   ├── Dashboard.jsx
    │   ├── Members.jsx
    │   ├── Contributions.jsx
    │   ├── Providers.jsx
    │   ├── Claims.jsx
    │   ├── FraudAlerts.jsx
    │   └── Notifications.jsx
    └── styles/
        └── main.css                # Global styles + CSS variables
```

---

## Data Models

### Member
Core citizen record. Stores SHA number (auto-generated), national ID, KRA PIN, county, status (`active`, `inactive`, `suspended`, `pending`), and links to a Django `User` for portal login.

### Dependant
Family members covered under a member's policy (spouse, child, parent, sibling).

### Contribution
Monthly payment records per member. Tracks payment method (M-Pesa, bank, payroll, cash), transaction reference, payment period, and confirmation status.

### Provider
Accredited health facilities — hospitals, clinics, pharmacies, laboratories. Classified by facility type and government level (Level 1–6).

### Claim
Hospital reimbursement requests. Linked to both a member and a provider. Tracks admission/discharge dates, diagnosis, treatment, claimed vs approved amounts, and fraud flags.

### FraudAlert
Raised automatically or manually when suspicious activity is detected on a claim, member, or provider. Severity levels: low → medium → high → critical.

### Notification
SMS, email, or system alerts dispatched to members. Tracks delivery status.

---

## API Endpoints

### Dashboard
```
GET  /api/dashboard/          Aggregate stats for the admin dashboard
```

### Members
```
GET    /api/members/                List members (search, status, county filters)
POST   /api/members/                Register new member
GET    /api/members/{id}/           Member detail
PUT    /api/members/{id}/           Update member
DELETE /api/members/{id}/           Remove member
POST   /api/members/{id}/verify/    Activate a pending member
POST   /api/members/{id}/suspend/   Suspend a member account
GET    /api/members/{id}/eligibility/  Check benefit eligibility
```

### Dependants
```
GET    /api/dependants/?member={id}   List dependants for a member
POST   /api/dependants/               Add dependant
PUT    /api/dependants/{id}/          Update dependant
DELETE /api/dependants/{id}/          Remove dependant
```

### Contributions
```
GET    /api/contributions/             List (filter by member, status, method)
POST   /api/contributions/             Record new contribution
POST   /api/contributions/{id}/confirm/   Confirm a pending contribution
```

### Providers
```
GET    /api/providers/                List (search, county, accredited, level)
POST   /api/providers/                Register new provider
GET    /api/providers/{id}/           Provider detail
PUT    /api/providers/{id}/           Update provider
POST   /api/providers/{id}/accredit/  Accredit a provider
```

### Claims
```
GET    /api/claims/                   List (filter by member, provider, status, flagged)
POST   /api/claims/                   Submit new claim
GET    /api/claims/{id}/              Claim detail
POST   /api/claims/{id}/approve/      Approve with optional approved_amount and notes
POST   /api/claims/{id}/reject/       Reject with reason notes
POST   /api/claims/{id}/flag/         Flag for fraud investigation
```

### Fraud Alerts
```
GET    /api/fraud-alerts/             List (filter by severity, status)
POST   /api/fraud-alerts/{id}/resolve/   Resolve or mark false positive
```

### Notifications
```
GET    /api/notifications/            List (filter by member, status)
POST   /api/notifications/            Create notification
```

---

## Getting Started

### Backend

```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install django djangorestframework django-cors-headers psycopg2-binary

# 3. Configure database in sha/settings.py
# SQLite works out of the box for development

# 4. Run migrations
python manage.py makemigrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser

# 6. Start server
python manage.py runserver
```

### Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The frontend expects the Django API at `http://localhost:8000`. Update `utils/api.js` to change the base URL.

---

## Key Business Rules

- **SHA Number** auto-generated on member registration (`SHA` + 10-digit UUID fragment).
- **Transaction Reference** auto-generated per contribution (`TXN` + 12-digit UUID fragment).
- **Provider Code** auto-generated on provider creation (`PRV` + 8-digit UUID fragment).
- **Claim Number** auto-generated on submission (`CLM` + 10-digit UUID fragment).
- A member is **eligible** for benefits if their status is `active` and they have at least one confirmed contribution in recent months.
- Flagging a claim automatically creates a linked `FraudAlert` with the specified severity.
- Only `pending` contributions can be confirmed; confirmed contributions update `paid_at` timestamp.

---

## SHA Context

SHA (Social Health Authority) is Kenya's national health insurance scheme, replacing NHIF. This system models the core digital infrastructure required to operate SHA at scale:

- Citizens register and pay monthly contributions via M-Pesa, bank, or payroll deduction.
- Hospitals (providers) connect electronically to verify member eligibility before treatment.
- After treatment, hospitals submit digital claims for reimbursement.
- The system validates claims against member status, contribution history, and fraud patterns.
- Administrators monitor the system through a real-time dashboard.

---

## Development Notes

- CORS is handled via `django-cors-headers` — configure allowed origins in `settings.py`.
- All list endpoints support query parameter filtering; see individual viewsets for supported params.
- The `DashboardStatsSerializer` is a plain `Serializer` (not `ModelSerializer`) — it serializes a plain Python dict.
- Frontend API calls are centralised in `utils/api.js` using an Axios instance with the base URL set once.
- Bootstrap Icons are loaded via CDN in `index.html` — no npm install needed for icons.

---

## License

Internal system — Kenya Ministry of Health / SHA Administration.