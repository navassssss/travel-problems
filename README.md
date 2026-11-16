# Full-Stack Monorepo: React + NestJS + Supabase + Render + Vercel

A production-ready monorepo with automated deployment for frontend and backend.

## Project Structure

```text
├── frontend/               # React + Vite + TypeScript (Deployed to Vercel)
│   ├── src/
│   ├── vercel.json         # Vercel SPA routing configuration
│   └── .env.example
├── backend/                # NestJS Application (Deployed to Render)
│   ├── src/
│   ├── prisma/             # Prisma ORM schema configured for Supabase PostgreSQL
│   └── .env.example
├── .github/
│   └── workflows/
│       ├── frontend.yml    # Auto-deploys frontend to Vercel on push to frontend/**
│       └── backend.yml     # Auto-deploys backend to Render on push to backend/**
├── render.yaml             # Render Blueprint (Infrastructure-as-Code)
└── README.md
```

---

## 🚀 Auto-Deployment Architecture

### 1. Frontend Auto-Deployment (Vercel)
When changes are pushed to `frontend/**` on the `main` branch, `.github/workflows/frontend.yml` executes:
1. Installs dependencies using `npm ci`.
2. Validates type checking and builds the production bundle (`npm run build`).
3. Deploys to Vercel using the official Vercel CLI.

**Required GitHub Secrets:**
- `VERCEL_TOKEN`: Your Vercel API access token (generate in Vercel Account Settings > Tokens).
- `VERCEL_ORG_ID`: Found in your Vercel project `.vercel/project.json` or team settings.
- `VERCEL_PROJECT_ID`: Found in your Vercel project settings.
- `VITE_API_URL`: Your backend URL on Render (e.g., `https://api-zakath.onrender.com`).

*(Alternatively, connecting the GitHub repository directly in the Vercel dashboard with Root Directory set to `frontend` will auto-deploy on every push zero-config).*

---

### 2. Backend Auto-Deployment (Render)
When changes are pushed to `backend/**` on the `main` branch:
1. `.github/workflows/backend.yml` validates dependencies, generates the Prisma client, runs unit tests, and builds NestJS.
2. If tests pass, it triggers the Render Deploy Hook via POST request.
3. Render pulls the latest commit, builds via `npm install && npx prisma generate && npm run build`, and starts with `npm run start:prod`.

**Option A (Render Blueprint - Easiest):**
1. Push this repo to GitHub.
2. In Render, select **New +** -> **Blueprint**.
3. Connect your repository. Render automatically reads `render.yaml` and provisions your web service!

**Option B (GitHub Actions Hook):**
- In your Render Web Service dashboard, copy the **Deploy Hook** URL.
- Add it to GitHub repository secrets as `RENDER_DEPLOY_HOOK_URL`.

---

## 🗄️ Database & Auth Setup (Supabase & Google OAuth)

### Supabase + Prisma:
1. In Supabase Dashboard: **Project Settings** -> **Database**.
2. Copy the **Connection String (Transaction Pooler - port 6543)** into `DATABASE_URL`.
3. Copy the **Direct Connection String (port 5432)** into `DIRECT_URL`.
4. Run migrations:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

### Google OAuth2:
1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Setup OAuth Consent Screen and create OAuth 2.0 Client Credentials:
   - Authorized redirect URIs (Local): `http://localhost:3000/auth/google/callback`
   - Authorized redirect URIs (Production): `https://your-backend.onrender.com/auth/google/callback`
3. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `backend/.env`.
