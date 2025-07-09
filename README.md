# DoNexus Coding Challenge – Backend Working Student

Welcome to the (slightly adapted) challenge! The goal is to wire up a **mini ticketing system** end‑to‑end, secure it and follow best practices.

---

## 🗂️ Project overview

* **Frontend:** React 18 (Vite) showing a list of **tickets** and an input for **comments**.  
  The UI & component logic **already exist**. You only need to fill the request functions in `src/api.js`. No extra styling required.
* **Backend:** Node.js 18 + Express 5 (currently only a `/ping` endpoint).
* **Database:** PostgreSQL 16 with three empty tables: `tickets`, `users`, `organisation`. Not connected yet.

Everything starts locally right away – but nothing “talks” to each other yet. That’s where you come in. 😉

---

## 🚧 Your tasks

1. ### Connect Backend ↔ PostgreSQL  
   * Wire up a DB connection via `process.env.DATABASE_URL` (pick your favourite driver: `node‑postgres`, `Prisma`, `TypeORM`, …).  
   * **Create a small `db` service module** (`backend/db/index.js`) that exports a query helper.  
   * Provide migrations/scripts to create the three tables.

2. ### Connect Frontend ↔ Backend  
   * Replace the fake data with real requests in **`src/api.js`**.  
   * Implement CRUD endpoints for **tickets** (GET / POST / DELETE / PATCH) in the backend and call them from the frontend.

3. ### Security & Best Practices  
   * **Auth:** Build a token‑based flow (e.g. JWT). A static secret is fine.  
   * **Row‑Level Security (RLS):** Implement a policy that users can only see their organisation’s tickets.  
   * **Add one extra security measure you find important** Briefly explain your choice in the README.

---

## ▶️ Local setup

```bash
# 1) Clone
git clone <your‑fork>
cd donexus-coding-challenge

# 2) Install dependencies
npm i
cd backend && npm i
cd ../frontend && npm i

# 3) Postgres
createdb donexus_challenge
psql -d donexus_challenge -f ../db/schema.sql

# 4) Environment variables
cp backend/.env.example backend/.env
# DATABASE_URL=postgresql://user:pw@localhost:5432/donexus_challenge
# JWT_SECRET=super‑secret

# 5) Start (parallel)
npm run dev:all          # uses concurrently
```

---

## ✅ Submission

* Push your code in **one** public Git repo or share a private link.  
* In the PR description, write briefly (max. 150 words):  
  * What did you implement?  
  * What would you do next?  
* Deadline: 48 h after receiving this challenge.

Happy coding – we can’t wait to review your solution! ✨
