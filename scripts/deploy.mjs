import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const callbackPath = '/auth/google/callback';
const renderBuild = 'npm ci --include=dev && npx prisma generate && npm run build';
const renderStart = 'npx prisma migrate deploy && npm run start:prod';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Set ${name} in your local deployment environment.`);
  return value;
}

function httpsOrigin(value) {
  const url = URL.parse(value ?? '');
  if (!url || url.protocol !== 'https:' || !url.hostname.includes('.') ||
      url.hostname.endsWith('.localhost') || /^127\./.test(url.hostname) ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Expected a public HTTPS origin without a path.');
  }
  return url.origin;
}

function api(base, token, extraHeaders = {}, query = '') {
  return async (method, path, body) => {
    const response = await fetch(base + path + query, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(45_000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...extraHeaders },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      // Provider error bodies can contain submitted environment variable values.
      throw new Error(`${method} ${base}${path} returned HTTP ${response.status}.`);
    }
    const content = await response.text();
    return content ? JSON.parse(content) : null;
  };
}

async function provision(name) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name ?? '') || name.length > 50) {
    throw new Error('Use a project name up to 50 characters, such as community-fund.');
  }

  const template = requireEnv('GITHUB_TEMPLATE');
  const owner = requireEnv('GITHUB_OWNER');
  if (!/^[\w-]+\/[\w.-]+$/.test(template) || !/^[\w-]+$/.test(owner)) {
    throw new Error('Set GITHUB_TEMPLATE to owner/repo and GITHUB_OWNER to a GitHub user or organization.');
  }
  const repository = `${owner}/${name}`;
  if (repository.toLowerCase() === template.toLowerCase()) {
    throw new Error('Choose a different name from the template repository.');
  }

  const workspace = requireEnv('RENDER_OWNER_ID');
  const team = process.env.VERCEL_TEAM_ID?.trim();
  const github = api('https://api.github.com', requireEnv('GITHUB_TOKEN'), {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });
  const render = api('https://api.render.com/v1', requireEnv('RENDER_API_KEY'));
  const vercel = api('https://api.vercel.com', requireEnv('VERCEL_TOKEN'), {},
    team ? `?${new URLSearchParams({ teamId: team })}` : '');
  const renderEnv = {
    NODE_VERSION: '24',
    NODE_ENV: 'production',
    PORT: '10000',
    DATABASE_URL: requireEnv('DATABASE_URL'),
    DIRECT_URL: requireEnv('DIRECT_URL'),
    GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  };
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    const url = URL.parse(renderEnv[key]);
    if (!url || !['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) {
      throw new Error(`${key} must be a PostgreSQL connection URL.`);
    }
  }

  const folder = resolve('.deployments');
  await mkdir(folder, { recursive: true });
  const file = resolve(folder, `${owner}-${name}.json`);
  const state = JSON.parse(await readFile(file, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return '{}';
    throw error;
  }));
  const identity = JSON.stringify([template, repository, workspace, team ?? null]);
  if (state.identity && state.identity !== identity) {
    throw new Error(`The saved deployment in ${file} belongs to a different template or workspace.`);
  }
  state.identity = identity;
  async function save() {
    await writeFile(`${file}.tmp`, JSON.stringify(state, null, 2) + '\n');
    await rename(`${file}.tmp`, file);
  }

  if (!state.repoId) {
    const source = await github('GET', `/repos/${template}`);
    if (!source.is_template) throw new Error(`Enable Template repository on ${template} in GitHub Settings.`);
    const repo = await github('POST', `/repos/${template}/generate`, { owner, name, private: true });
    state.repoId = repo.id;
    state.branch = repo.default_branch;
    await save();
    console.log(`Created https://github.com/${repository}`);
  }

  if (!state.renderId) {
    const { service } = await render('POST', '/services', {
      type: 'web_service', name: `${name}-api`, ownerId: workspace,
      repo: `https://github.com/${repository}`, branch: state.branch, rootDir: 'backend',
      autoDeployTrigger: 'commit',
      envVars: Object.entries({ ...renderEnv, JWT_SECRET: randomBytes(32).toString('base64url') })
        .map(([key, value]) => ({ key, value })),
      serviceDetails: {
        runtime: 'node', plan: 'free', region: 'oregon', healthCheckPath: '/ready',
        envSpecificDetails: { buildCommand: renderBuild, startCommand: renderStart },
      },
    });
    state.renderId = service.id;
    state.apiUrl = service.serviceDetails.url;
    await save();
    console.log(`Created Render service ${state.renderId}`);
  }
  if (!state.apiUrl) {
    const service = await render('GET', `/services/${state.renderId}`);
    state.apiUrl = service.serviceDetails.url;
    await save();
  }
  const apiUrl = httpsOrigin(state.apiUrl);
  const host = `${name}.vercel.app`;
  const frontendUrl = `https://${host}`;
  if (!state.vercelId) {
    const appName = name.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    const project = await vercel('POST', '/v11/projects', {
      name, framework: 'vite', rootDirectory: 'frontend',
      gitRepository: { type: 'github', repo: repository },
      environmentVariables: [
        { key: 'VITE_API_URL', value: apiUrl, target: 'production', type: 'plain' },
        { key: 'VITE_APP_NAME', value: appName, target: 'production', type: 'plain' },
      ],
    });
    state.vercelId = project.id;
    await save();
    console.log(`Created Vercel project ${state.vercelId}`);
  }
  if (!state.domain) {
    const path = `/v9/projects/${state.vercelId}/domains/${host}`;
    const domain = await vercel('GET', path).catch((error) => {
      if (!error.message.endsWith('returned HTTP 404.')) throw error;
      return vercel('POST', `/v10/projects/${state.vercelId}/domains`, { name: host });
    });
    if (!domain.verified) throw new Error(`Verify ${host} in the new Vercel project's Domains settings, then rerun.`);
    state.domain = host;
    await save();
  }

  const callback = apiUrl + callbackPath;
  if (!state.renderDeployId) {
    for (const [key, value] of Object.entries({ FRONTEND_URL: frontendUrl, GOOGLE_CALLBACK_URL: callback })) {
      await render('PUT', `/services/${state.renderId}/env-vars/${key}`, { value });
    }
    const deployment = await render('POST', `/services/${state.renderId}/deploys`, { clearCache: 'do_not_clear' });
    state.renderDeployId = deployment.id;
    await save();
  }
  if (!state.vercelDeployId) {
    const deployment = await vercel('POST', '/v13/deployments', {
      name, project: state.vercelId, target: 'production',
      gitSource: { type: 'github', repoId: state.repoId, ref: state.branch },
    });
    state.vercelDeployId = deployment.id;
    await save();
  }
  console.log(`Frontend ${frontendUrl}\nAPI ${apiUrl}\nRegister this Google redirect URI: ${callback}`);
  console.log(`After both deploys finish, run: node scripts/deploy.mjs check ${frontendUrl} ${apiUrl}`);
}

async function check(frontend, backend) {
  const frontendUrl = httpsOrigin(frontend);
  const apiUrl = httpsOrigin(backend);
  const options = { redirect: 'manual', signal: AbortSignal.timeout(45_000) };
  const [page, ready, login, callback] = await Promise.all([
    fetch(frontendUrl, options), fetch(apiUrl + '/ready', options),
    fetch(apiUrl + '/auth/google', options), fetch(apiUrl + callbackPath, options),
  ]);
  if (!page.ok || !ready.ok) {
    throw new Error(`Frontend HTTP ${page.status}, backend readiness HTTP ${ready.status}. Check the deployment logs.`);
  }
  const loginUrl = URL.parse(login.headers.get('location') ?? '');
  if (login.status !== 302 || loginUrl?.origin !== 'https://accounts.google.com' ||
      loginUrl.searchParams.get('redirect_uri') !== apiUrl + callbackPath) {
    throw new Error(`Render did not send Google the expected callback ${apiUrl + callbackPath}.`);
  }
  const returnUrl = URL.parse(callback.headers.get('location') ?? '');
  if (callback.status !== 302 || returnUrl?.origin !== frontendUrl) {
    throw new Error(`The OAuth callback did not return to ${frontendUrl}. Check Render's FRONTEND_URL.`);
  }
  const html = await page.text();
  const script = html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"[^>]*>/i)?.[1];
  const asset = script && new URL(script, frontendUrl);
  if (!asset || asset.origin !== frontendUrl) throw new Error('The frontend did not serve a Vite bundle.');
  const bundle = await fetch(asset, { ...options, signal: AbortSignal.timeout(20_000) });
  if (!bundle.ok || !(await bundle.text()).includes(apiUrl)) {
    throw new Error(`The frontend bundle does not contain ${apiUrl}. Set VITE_API_URL and redeploy.`);
  }
  console.log('Frontend, backend readiness, and both OAuth redirect URLs passed. Complete one Google sign-in in a browser.');
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'create' && args.length === 1) await provision(args[0]);
  else if (command === 'check' && args.length === 2) await check(...args);
  else {
    console.log('Usage: node --env-file=.env.deploy.local scripts/deploy.mjs create <name>\n' +
      '       node scripts/deploy.mjs check <frontend-https-origin> <backend-https-origin>');
    if (command && command !== '--help') process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
