# Master DSA — multi-user dashboard (Node + Express + MongoDB)

A small full-stack app: anyone can sign up with their email and password,
log in, and track their own solved/unsolved status and remarks for all
107 DSA problems. Data is stored in MongoDB, per user.

## What's inside

- `server.js` — Express app: serves the frontend and the API, connects to MongoDB
- `models/User.js` — user schema (name, email, hashed password, per-problem progress)
- `routes/auth.js` — `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `routes/progress.js` — `GET /api/progress`, `PUT /api/progress`
- `middleware/auth.js` — verifies the login session (JWT) on protected routes
- `public/index.html` — the frontend (React via CDN, no build step needed)
- `public/data/problems.json` — all 107 problems, links and solutions

Passwords are hashed with bcrypt before they're stored — the plain password is
never saved anywhere.

## 1. Create a free MongoDB database

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free (M0) cluster.
3. Under **Database Access**, add a database user with a username and password.
4. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere) to get started quickly —
   tighten this later to your server's IP once deployed.
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/`

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/masterdsa
JWT_SECRET=<any long random string>
PORT=5000
```

You can generate a random `JWT_SECRET` with:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Run it locally

```bash
npm install
npm start
```

Then open http://localhost:5000 — you'll see a sign-up screen. Create an
account, log in, and your progress is saved to MongoDB.

## 4. Deploy it so anyone can use it

Any Node host works. The quickest free option:

**Render**
1. Push this folder to a GitHub repo.
2. On https://render.com, create a new **Web Service** from that repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add the environment variables from `.env` (MONGODB_URI, JWT_SECRET) in Render's dashboard.
5. Deploy — Render gives you a public URL anyone can sign up and log in from.

**Railway** and **Fly.io** work the same way: connect the repo, set the same
two environment variables, deploy.

## Notes

- Each user only ever sees and edits their own progress — there's no shared/admin view.
- To add more problems later, edit `public/data/problems.json` — no server changes needed.
- If you want password reset, email verification, or an admin view of everyone's
  progress, those aren't included here — let me know and I can add them.
