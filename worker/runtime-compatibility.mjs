import * as jose from 'jose';
import { GoogleGenAI } from '@google/genai';

const PROJECT_ID = 'demo-cloudflare-compat';
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
        : /not implemented|unsupported|not supported|proxy|color depth|stream|process\.stderr/i.test(message)
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

async function joseProbe() {
  const started = performance.now();
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
  const token = await new jose.SignJWT({
    firebase: { sign_in_provider: 'password' },
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(`https://securetoken.google.com/${PROJECT_ID}`)
    .setAudience(PROJECT_ID)
    .setSubject('compat-user-123')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);

  const { payload } = await jose.jwtVerify(token, publicKey, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

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
    ok: payload.sub === 'compat-user-123',
    verifiedSubject: payload.sub,
    issuer: payload.iss,
    audience: payload.aud,
    localSignAndVerify: true,
    remoteResolverCreated,
    googleJwksFetch: jwksFetch,
    elapsedMs: Number((performance.now() - started).toFixed(3)),
  };
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
      if (url.pathname === '/compat/runtime') {
        return json(await runtimeProbe(env));
      }

      if (url.pathname === '/compat/jose') {
        return json(await joseProbe());
      }

      if (url.pathname === '/compat/genai') {
        return json(await genaiProbe(env));
      }

      return json({ error: 'not found' }, 404);
    } catch (error) {
      return json({ ok: false, ...classifyError(error) }, 500);
    }
  },
};
