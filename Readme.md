# LoanSync

Multi-shop loan management platform for Kenyan shop owners. Each shop tracks
its own borrower loans; an Admin Console oversees the whole network.

## Structure

```
loansync/
├── frontend/    React + Vite + Tailwind CSS + Supabase
└── backend/     Node.js + Express — admin aggregates + M-Pesa
```

## Stack

- **Frontend:** React, Vite, Tailwind CSS v4, Supabase Auth + Postgres
- **Backend:** Node.js, Express, Supabase (service role), M-Pesa Daraja API

The frontend talks directly to Supabase for shop-level loan CRUD (protected
by Row Level Security). The backend only handles things that need a secret
key: cross-shop admin aggregates and M-Pesa STK push.

## Local development

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in Supabase service role key
npm run dev             # http://localhost:4000

# Frontend
cd frontend
npm install
cp .env.example .env   # fill in Supabase URL + anon key
npm run dev             # http://localhost:5173
```

Run `backend/supabase_schema.sql` once in Supabase SQL Editor before testing.

## Promoting a user to admin

```sql
update shops set role = 'admin' where email = 'someone@example.com';
```

Sign out and back in for it to take effect.

## Deployment

Both Vercel and Render support deploying a subfolder of a monorepo:

- **Vercel:** Root Directory → `frontend`. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
- **Render:** Root Directory → `backend`. Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`

Deploy the backend first, then point `VITE_API_URL` at its live URL.

M-Pesa env vars are optional — the backend runs fine without them; only
`/api/mpesa/*` routes need them, and can be added later.