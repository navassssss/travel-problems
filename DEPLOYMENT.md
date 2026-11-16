# Create a new Render and Vercel app

This starter uses Vercel for the frontend, Render for the API, and one PostgreSQL database per app. GitHub Actions builds and tests the code. Both hosts deploy directly from GitHub.

## Set up your accounts once

1. Publish the starter's `main` branch and enable **Template repository** under **GitHub → Settings → General**. Connect Render and Vercel to GitHub and grant their integrations access to the private repos you create. Select **All repositories**, or grant access to each new repo before retrying setup.
2. Install Node.js 24. Copy `.env.deploy.example` to `.env.deploy.local`. Set `GITHUB_TEMPLATE` to the starter's `owner/repo`, and `GITHUB_OWNER` to the account or organization that should own new apps.
3. Fill in `GITHUB_TOKEN`, `RENDER_API_KEY`, `RENDER_OWNER_ID`, and `VERCEL_TOKEN`. The GitHub token needs permission to read the template and create repos in the destination account. Use the Render workspace ID from your workspace settings. Set `VERCEL_TEAM_ID` if you use a Vercel team. Keep this file local. These credentials are used by the setup command and stay out of the new repository and its GitHub Actions settings.

## Create each app

Create a fresh PostgreSQL database and a Google OAuth **Web application** client for this app. Enter `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `.env.deploy.local`. `DIRECT_URL` must support Prisma migrations. Google lets you register the callback after the new Render URL is assigned.

From your starter checkout, choose an unused project name and run:

```sh
node --env-file=.env.deploy.local scripts/deploy.mjs create community-fund
```

The command creates a private GitHub repo, a free Render Node service rooted at `backend`, and a Vercel Vite project rooted at `frontend`. It sets `VITE_API_URL`, `FRONTEND_URL`, and `GOOGLE_CALLBACK_URL` from the deployment URLs, sets the app's display name, generates a unique `JWT_SECRET`, and starts production deployments. Render applies the checked-in Prisma migrations before the API starts. The command uses `<project-name>.vercel.app` as the production domain, so choose a globally available name.

Add the printed callback to the Google client's **Authorized redirect URIs**. For a Google OAuth app in testing mode, add the Google accounts you use to test it under **Audience**. After Render and Vercel finish, run the printed verification command. For example:

```sh
node scripts/deploy.mjs check https://community-fund.vercel.app https://community-fund-api.onrender.com
```

The check verifies that the frontend contains its own API URL, the database is ready, Google gets the right callback, and the callback returns to the correct frontend. Finish by signing in once in a browser using a permitted test account.

The command saves resource IDs in the ignored `.deployments/` directory. If setup stops after a stage, rerun the same command from the same checkout to continue. If a provider reports a name conflict after a network interruption, review its dashboard for resources created by the interrupted request before proceeding. If a queued build fails, inspect the host's deployment logs and redeploy from the dashboard after correcting the error.

Push future changes to the **new app's** default branch. Render and Vercel deploy the connected project automatically.

## Set up from dashboards

If you prefer dashboard setup, create a GitHub repo from this template. In Render, use the included `render.yaml` Blueprint and a fresh database. The Blueprint prompts for `DATABASE_URL`, `DIRECT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, and `FRONTEND_URL`. To configure the service in stages, create the Render service first with the database connections, then create the Vercel project and finish the OAuth settings after both URLs are assigned. Use the build and start commands in `render.yaml`.

In Vercel, use `frontend` as the root, **Vite** as the framework, and set `VITE_API_URL` to the new Render HTTPS origin and optionally `VITE_APP_NAME` to the new display name. The frontend build requires a valid public HTTPS API origin. Set `FRONTEND_URL` in Render to the stable Vercel production origin. Set `GOOGLE_CALLBACK_URL` to the Render API origin followed by `/auth/google/callback` and register exactly that URI in Google Cloud. For a manually configured Render service, generate a random `JWT_SECRET` of at least 32 characters.

## Upgrade an existing deployment

Before deploying this version, set `VITE_API_URL` in the existing Vercel project's Production environment. Confirm Render has the matching backend OAuth callback and the stable Vercel production origin in `FRONTEND_URL`. Keep the existing database connections and `JWT_SECRET` for that project. Check the migration history before applying the Blueprint's startup command to a database previously initialized outside Prisma Migrate.
