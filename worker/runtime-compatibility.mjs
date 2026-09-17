import * as jose from 'jose';
import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = 'demo-cloudflare-compat';
const DATABASE_ID = 'ai-studio-49f27ecb-b053-4a8d-98b1-0f9445afb923';
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function classifyError(error) {
  const name = error?.name || error?.constructor?.name || 'Error';
  const message = String(error?.message || error || '');
  return {
    name,
    messageCategory:
      /api key|invalid_argument|permission|unauth|forbidden|400|401|403/i.test(message)
        ? 'provider-or-auth-response'
        : /not implemented|unsupported|not supported|proxy|color depth|stream|process\.stderr|grpc|socket/i.test(message)
          ? 'runtime-compatibility-error'
          : 'other-error',
  };
}

async function runtimeProbe(env) {
  const started = performance.now();
  const nodeCrypto = await import('node:crypto');
  const nodeBuffer = await import('node:buffer');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode('phase-0.5-cloudflare-runtime'),
  );
  const digestHex = Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('compat-timeout'), 5);
  clearTimeout(timer);

  return {
    ok: true,
    nodeCryptoRandomUUID: typeof nodeCrypto.randomUUID === 'function',
    bufferAvailable: typeof nodeBuffer.Buffer?.from === 'function',
    webCryptoAvailable: Boolean(globalThis.crypto?.subtle),
    fetchAvailable: typeof fetch === 'function',
    abortControllerAvailable: typeof AbortController === 'function',
    timersAvailable: typeof setTimeout === 'function' && typeof clearTimeout === 'function',
    processEnvAvailable: typeof process !== 'undefined' && Boolean(process.env),
    bindingVisibleViaProcessEnv:
      process.env.PHASE_0_5_RUNTIME_MARKER === 'worker-runtime-marker',
    bindingVisibleViaEnv: env.PHASE_0_5_RUNTIME_MARKER === 'worker-runtime-marker',
    digestPrefix: digestHex,
    synchronousProbeElapsedMs: Number((performance.now() - started).toFixed(3)),
  };
}

async function createVerifiedFixtureIdentity() {
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
  const token = await new jose.SignJWT({
    firebase: { sign_in_provider: 'password' },
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(`https://securetoken.google.com/${PROJECT_ID}`)
    .setAudience(PROJECT_ID)
    .setSubject('compat-user-a')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);

  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Synthetic compatibility token did not contain a verified UID');
  }

  return { token, uid: payload.sub };
}

async function joseProbe() {
  const started = performance.now();
  const { token, uid } = await createVerifiedFixtureIdentity();

  let jwksFetch;
  try {
    const response = await fetch(GOOGLE_JWKS_URL, {
      headers: { accept: 'application/json' },
    });
    const body = await response.json();
    jwksFetch = {
      ok: response.ok,
      status: response.status,
      keyCount: Array.isArray(body?.keys) ? body.keys.length : null,
    };
  } catch (error) {
    jwksFetch = { ok: false, ...classifyError(error) };
  }

  const remoteResolverCreated = typeof jose.createRemoteJWKSet(new URL(GOOGLE_JWKS_URL)) === 'function';

  return {
    ok: uid === 'compat-user-a',
    compactTokenCreated: typeof token === 'string' && token.split('.').length === 3,
    verifiedSubject: uid,
    expectedIssuer: `https://securetoken.google.com/${PROJECT_ID}`,
    expectedAudience: PROJECT_ID,
    localSignAndVerify: true,
    remoteResolverCreated,
    googleJwksFetch: jwksFetch,
    elapsedMs: Number((performance.now() - started).toFixed(3)),
  };
}

async function firebaseAdminProbe() {
  const started = performance.now();
  try {
    const appModule = await import('firebase-admin/app');
    const authModule = await import('firebase-admin/auth');
    const firestoreModule = await import('firebase-admin/firestore');

    return {
      ok: true,
      appImport: typeof appModule.initializeApp === 'function',
      authImport: typeof authModule.getAuth === 'function',
      firestoreImport: typeof firestoreModule.getFirestore === 'function',
      initializationAttempted: false,
      note: 'Import compatibility only; trusted Firestore read requires credentials/emulator proof.',
      elapsedMs: Number((performance.now() - started).toFixed(3)),
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyError(error),
      elapsedMs: Number((performance.now() - started).toFixed(3)),
    };
  }
}

async function trustedFirestoreRestProbe(request, env) {
  const started = performance.now();
  const { uid } = await createVerifiedFixtureIdentity();
  const url = new URL(request.url);
  const clientSuppliedUid = url.searchParams.get('userId');

  const base = String(env.FIRESTORE_REST_BASE || '').replace(/\/$/, '');
  if (!base) {
    return {
      ok: false,
      error: 'FIRESTORE_REST_BASE is not configured for the compatibility fixture',
    };
  }

  const profilePath = `projects/${encodeURIComponent(PROJECT_ID)}/databases/${encodeURIComponent(DATABASE_ID)}/documents/users/${encodeURIComponent(uid)}/profile/vault`;
  const response = await fetch(`${base}/${profilePath}`, {
    headers: { accept: 'application/json' },
  });
  const body = await response.json();

  return {
    ok: response.ok && uid === 'compat-user-a',
    status: response.status,
    verifiedUid: uid,
    clientSuppliedUid,
    clientSuppliedUidIgnored: Boolean(clientSuppliedUid) && clientSuppliedUid !== uid,
    namedDatabase: DATABASE_ID,
    resolvedDocumentName: body?.name || null,
    resolvedProfileName: body?.fields?.name?.stringValue || null,
    fetchedExpectedUser: body?.fields?.marker?.stringValue === 'profile-for-compat-user-a',
    elapsedMs: Number((performance.now() - started).toFixed(3)),
  };
}

async function expressProbe() {
  const started = performance.now();
  try {
    const expressModule = await import('express');
    const rateLimitModule = await import('express-rate-limit');
    return {
      ok: true,
      expressImport: typeof expressModule.default === 'function',
      rateLimitImport:
        typeof rateLimitModule.default === 'function' || typeof rateLimitModule.rateLimit === 'function',
      note: 'Import success does not prove Node HTTP server/app.listen compatibility; Worker transport remains fetch-based.',
      elapsedMs: Number((performance.now() - started).toFixed(3)),
    };
  } catch (error) {
    return {
      ok: false,
      ...classifyError(error),
      elapsedMs: Number((performance.now() - started).toFixed(3)),
    };
  }
}

async function genaiProbe(env) {
  const secretPresent = typeof env.GEMINI_API_KEY === 'string' && env.GEMINI_API_KEY.length > 0;
  const secretVisibleViaProcessEnv =
    typeof process !== 'undefined' && process.env.GEMINI_API_KEY === env.GEMINI_API_KEY;

  const started = performance.now();
  let sdkImportAndInit = false;
  let providerCall = null;

  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    sdkImportAndInit = Boolean(ai?.models?.generateContent);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Phase 0.5 compatibility probe. Reply with OK.',
        config: { temperature: 0 },
      });
      providerCall = {
        reachedProvider: true,
        authenticated: true,
        returnedText: typeof response?.text === 'string',
      };
    } catch (error) {
      const classified = classifyError(error);
      providerCall = {
        reachedProvider: classified.messageCategory === 'provider-or-auth-response',
        authenticated: false,
        ...classified,
      };
    }
  } catch (error) {
    providerCall = {
      reachedProvider: false,
      authenticated: false,
      ...classifyError(error),
    };
  }

  return {
    ok: sdkImportAndInit && secretPresent,
    sdkImportAndInit,
    secretPresent,
    secretVisibleViaProcessEnv,
    secretEchoed: false,
    providerCall,
    elapsedMs: Number((performance.now() - started).toFixed(3)),
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/compat/runtime') return json(await runtimeProbe(env));
      if (url.pathname === '/compat/jose') return json(await joseProbe());
      if (url.pathname === '/compat/firebase-admin') return json(await firebaseAdminProbe());
      if (url.pathname === '/compat/firestore-rest') return json(await trustedFirestoreRestProbe(request, env));
      if (url.pathname === '/compat/express') return json(await expressProbe());
      if (url.pathname === '/compat/genai') return json(await genaiProbe(env));

      if (url.pathname.startsWith('/api/')) {
        return json({
          ok: true,
          transport: 'cloudflare-worker-fixture',
          method: request.method,
          path: url.pathname,
          authorizationHeaderPresent: request.headers.has('authorization'),
        });
      }

      return json({ error: 'not found' }, 404);
    } catch (error) {
      return json({ ok: false, ...classifyError(error) }, 500);
    }
  },
};
