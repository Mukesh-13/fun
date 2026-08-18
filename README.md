# 🛡️ Secure Gateway & Authentication Portal

Production-grade authentication gateway backed by Supabase PostgreSQL, featuring in-memory sliding-window rate limiting with TTL, salted bcrypt password hashing, attack sanitization, and a modern glassmorphic interface.

---

## 📁 Repository Structure

```
├── Audio Fun Website/     # Archived legacy audio prank site
├── public/                # Frontend client assets (Login & Placeholder Dashboard)
│   ├── css/               # Dark glassmorphism stylesheets
│   ├── js/                # Device fingerprint generator & client logic
│   ├── login.html         # Login page gateway (Username + Password)
│   └── index.html         # Authenticated placeholder dashboard
├── src/                   # Production modular backend
│   ├── config/            # PostgreSQL / Supabase parameterized pool
│   ├── controllers/       # Auth controller (login, logout, me, status)
│   ├── middleware/        # Rate limiter (TTL cache), Auth guard, Input validator
│   ├── services/          # Bcrypt hashing & JWT session management
│   ├── utils/             # IP & Device fingerprint generator
│   └── server.js          # Express server with Helmet security headers
├── scripts/
│   └── seed-user.js       # Interactive CLI tool to generate salted bcrypt SQL
├── schema.sql             # PostgreSQL schema with least-privilege role setup
├── .env.example           # Environment template
└── test-auth.js           # Automated security and rate-limiting test suite
```

---

## 🚀 Quick Setup & Configuration

### 1. Run Schema in Supabase (Manual Migration)
1. Open your **Supabase Dashboard** &rarr; **SQL Editor**.
2. Copy and execute the contents of [`schema.sql`](./schema.sql).
3. *(Optional)* Execute the least-privilege role block to create a scoped DB user (`web_auth_user`) with only `SELECT` and `UPDATE (login metadata)` permissions.

### 2. Configure Environment Variables
Open [`.env`](./.env) and paste your Supabase PostgreSQL connection string:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secure_jwt_secret_key_here
DATABASE_URL=postgresql://web_auth_user:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
IP_BURST_MAX_ATTEMPTS=15
```

### 3. Generate User Credentials (Interactive Seeding)
Run the interactive user seeding utility:

```bash
npm run seed
```
It will prompt you interactively:
- **Username**: e.g. `admin`
- **Password**: e.g. `MySecurePassword123!`
- **Role**: `admin` or `user`

It computes a 12-round salted bcrypt hash and prints the exact SQL statement for you to paste into Supabase SQL Editor.

### 4. Start the Application
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**:
- Unauthenticated visitors are automatically redirected to `http://localhost:3000/login`.
- After signing in, users land on the protected placeholder dashboard.

### 5. Run Security & Rate Limit Test Suite
```bash
npm test
```

---

## 🔒 Security Architecture

- **Zero Service Role Key Exposure**: Operates strictly via scoped database user privileges (`SELECT`, `UPDATE` on `users` table only).
- **Pure Unique Username Flow**: Authentication is based solely on `username` and `password`. Email is completely removed.
- **No Plaintext Passwords**: Passwords hashed and salted using `bcrypt` (work factor 12).
- **Anti-SQL Injection**: 100% parameterized queries (`$1`, `$2`) throughout all database interactions.
- **Memory-First Rate Limiting**: In-memory sliding window cache rejects brute-force spikes before any database connection is created.
- **Tamper-Proof Sessions**: HTTP-only, SameSite=Strict signed JWT session cookies.
- **Hardened HTTP Headers**: Helmet Content-Security-Policy, HSTS, X-Frame-Options, and X-Content-Type-Options.
