const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Signature',
  'Access-Control-Max-Age': '86400',
};

const PRO_FEATURES = [
  'messages',
  'media',
  'fakeData',
  'blurIntensity',
  'savedPin',
  'piiCpf',
  'piiEmail',
  'piiCard',
  'piiPhone',
  'piiPix',
];

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LICENSE_PRIVATE_KEY_JWK',
  'LICENSE_PUBLIC_KEY_KID',
  'CAKTO_WEBHOOK_SECRET',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'APP_API_BASE_URL',
  'LICENSE_FROM_EMAIL',
];

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    try {
      assertEnv(env);

      if (request.method === 'GET' && url.pathname === '/health') {
        return jsonResponse({ ok: true });
      }

      if (request.method === 'POST' && url.pathname === '/licenses/validate') {
        return handleValidateLicense(request, env);
      }

      if (request.method === 'POST' && url.pathname === '/licenses/reset-devices') {
        return handleRequestDeviceReset(request, env);
      }

      if (request.method === 'GET' && url.pathname === '/licenses/reset-devices/confirm') {
        return handleConfirmDeviceReset(url, env);
      }

      if (request.method === 'POST' && url.pathname === '/webhooks/lemonsqueezy') {
        return handleLemonSqueezyWebhook(request, env);
      }

      if (request.method === 'POST' && url.pathname === '/webhooks/cakto') {
        return handleCaktoWebhook(request, env);
      }

      return jsonResponse({ error: 'NOT_FOUND' }, 404);
    } catch (error) {
      const message = error instanceof HttpError ? error.publicMessage : 'INTERNAL_ERROR';
      const status = error instanceof HttpError ? error.status : 500;
      console.error(error);
      return jsonResponse({ error: message }, status);
    }
  },
};

async function handleValidateLicense(request, env) {
  const body = await readJson(request);
  const licenseKey = normalizeLicenseKey(body.license_key);
  const deviceUuid = safeString(body.device_uuid);
  const extensionVersion = safeString(body.extension_version);

  if (!licenseKey || !deviceUuid) {
    return jsonResponse({ error: 'INVALID_PAYLOAD' }, 400);
  }

  const validation = await supabaseRpc(env, 'validate_license_device', {
    p_license_key: licenseKey,
    p_device_uuid: deviceUuid,
    p_user_agent: [
      request.headers.get('User-Agent'),
      extensionVersion ? `AgioBlur/${extensionVersion}` : '',
    ].filter(Boolean).join(' '),
  });

  if (!validation?.ok) {
    return jsonResponse({ error: validation?.error || 'LICENSE_NOT_FOUND' }, errorStatus(validation?.error));
  }

  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1000;
  const receipt = {
    version: 1,
    kid: env.LICENSE_PUBLIC_KEY_KID,
    license_id: validation.license_id,
    license_key_hash: validation.license_key_hash,
    device_uuid: deviceUuid,
    plan: validation.plan,
    features: PRO_FEATURES,
    max_devices: validation.max_devices,
    issued_at: now,
    expires_at: expiresAt,
  };

  const receiptPayload = stableStringify(receipt);
  const receiptSignature = await signReceipt(env, receiptPayload);

  return jsonResponse({
    receipt_payload: receiptPayload,
    receipt_signature: receiptSignature,
    expires_at: expiresAt,
  });
}

async function handleRequestDeviceReset(request, env) {
  const body = await readJson(request);
  const licenseKey = normalizeLicenseKey(body.license_key);
  const newDeviceUuid = safeString(body.new_device_uuid);

  if (!licenseKey || !newDeviceUuid) {
    return jsonResponse({ error: 'INVALID_PAYLOAD' }, 400);
  }

  const licenses = await supabaseSelect(env, 'licenses', {
    select: 'id,email,status',
    license_key: `eq.${licenseKey}`,
    limit: '1',
  });
  const license = licenses[0];

  if (!license) {
    return jsonResponse({ error: 'LICENSE_NOT_FOUND' }, 404);
  }

  if (license.status !== 'ACTIVE') {
    return jsonResponse({ error: 'LICENSE_REVOKED' }, 403);
  }

  const token = crypto.randomUUID();
  const tokenHash = await sha256Hex(token);
  const confirmUrl = `${env.APP_API_BASE_URL.replace(/\/$/, '')}/licenses/reset-devices/confirm?token=${encodeURIComponent(token)}`;

  await supabaseInsert(env, 'device_reset_tokens', {
    license_id: license.id,
    token_hash: tokenHash,
    new_device_uuid: newDeviceUuid,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  await sendEmail(env, {
    to: license.email,
    subject: 'Redefinição de dispositivos AgioBlur',
    text: [
      'Recebemos uma solicitação para redefinir os dispositivos da sua licença AgioBlur.',
      '',
      'Confirme pelo link abaixo em até 15 minutos:',
      confirmUrl,
      '',
      'Se você não solicitou isso, ignore este e-mail.',
    ].join('\n'),
  });

  return jsonResponse({ message: 'Confirmation email sent.' });
}

async function handleConfirmDeviceReset(url, env) {
  const token = safeString(url.searchParams.get('token'));

  if (!token) {
    return htmlResponse(deviceResetPage(false, 'Token ausente.'), 400);
  }

  const tokenHash = await sha256Hex(token);
  const result = await supabaseRpc(env, 'confirm_device_reset', {
    p_token_hash: tokenHash,
  });

  if (!result?.ok) {
    const message = {
      INVALID_TOKEN: 'Token inválido.',
      TOKEN_USED: 'Este link já foi usado.',
      TOKEN_EXPIRED: 'Este link expirou.',
    }[result?.error] || 'Não foi possível redefinir seus dispositivos.';

    return htmlResponse(deviceResetPage(false, message), 400);
  }

  return htmlResponse(deviceResetPage(true, 'Seus dispositivos foram redefinidos. Reative a extensão no novo navegador.'));
}

async function handleLemonSqueezyWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get('X-Signature') || '';
  const expected = await hmacHex(env.LEMONSQUEEZY_WEBHOOK_SECRET, rawBody);

  if (!timingSafeEqual(signature, expected)) {
    return jsonResponse({ error: 'INVALID_SIGNATURE' }, 401);
  }

  const payload = parseJson(rawBody);
  const eventType = getPath(payload, ['meta', 'event_name']) || 'unknown';
  const attrs = getPath(payload, ['data', 'attributes']) || {};
  const orderId = String(getPath(payload, ['data', 'id']) || attrs.order_id || attrs.identifier || '');
  const eventId = String(getPath(payload, ['meta', 'webhook_id']) || getPath(payload, ['meta', 'event_id']) || `${eventType}:${orderId}`);
  const email = attrs.user_email || attrs.customer_email || getPath(attrs, ['user_email']);

  const eventRecord = await recordWebhookEvent(env, {
    gateway: 'lemonsqueezy',
    gatewayEventId: eventId,
    gatewayOrderId: orderId,
    eventType,
    payload,
    rawBody,
  });

  if (eventRecord.duplicate) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  try {
    if (isPurchaseEvent(eventType)) {
      const license = await createLicenseForPurchase(env, {
        gateway: 'lemonsqueezy',
        email,
        gatewayOrderId: orderId,
        gatewayCustomerId: String(attrs.customer_id || ''),
        gatewayProductId: String(attrs.product_id || getPath(attrs, ['first_order_item', 'product_id']) || ''),
        gatewayVariantId: String(attrs.variant_id || getPath(attrs, ['first_order_item', 'variant_id']) || ''),
      });

      if (license?.license_key) {
        await sendLicenseEmail(env, license.email, license.license_key);
      }
    } else if (isRevocationEvent(eventType)) {
      await revokeLicense(env, {
        gateway: 'lemonsqueezy',
        gatewayOrderId: orderId,
        email,
        status: eventType.includes('chargeback') ? 'CHARGEBACK' : 'REFUNDED',
        reason: eventType,
      });
    }

    await markWebhookProcessed(env, eventRecord.id);
    return jsonResponse({ ok: true });
  } catch (error) {
    await markWebhookFailed(env, eventRecord.id, error.message);
    throw error;
  }
}

async function handleCaktoWebhook(request, env) {
  const rawBody = await request.text();
  const payload = parseJson(rawBody);

  if (!timingSafeEqual(String(payload.secret || ''), env.CAKTO_WEBHOOK_SECRET)) {
    return jsonResponse({ error: 'INVALID_SIGNATURE' }, 401);
  }

  const eventType = String(payload.event || 'unknown');
  const data = payload.data || {};
  const orderId = String(data.id || data.order_id || data.transaction_id || data.sale_id || '');
  const eventId = String(payload.id || data.webhook_id || `${eventType}:${orderId || await sha256Hex(rawBody)}`);
  const email = data.email || getPath(data, ['customer', 'email']) || getPath(data, ['buyer', 'email']);

  const eventRecord = await recordWebhookEvent(env, {
    gateway: 'cakto',
    gatewayEventId: eventId,
    gatewayOrderId: orderId,
    eventType,
    payload,
    rawBody,
  });

  if (eventRecord.duplicate) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  try {
    if (isPurchaseEvent(eventType)) {
      const license = await createLicenseForPurchase(env, {
        gateway: 'cakto',
        email,
        gatewayOrderId: orderId,
        gatewayCustomerId: String(data.customer_id || getPath(data, ['customer', 'id']) || ''),
        gatewayProductId: String(data.product_id || getPath(data, ['product', 'id']) || ''),
        gatewayVariantId: String(data.offer_id || data.variant_id || ''),
      });

      if (license?.license_key) {
        await sendLicenseEmail(env, license.email, license.license_key);
      }
    } else if (isRevocationEvent(eventType)) {
      await revokeLicense(env, {
        gateway: 'cakto',
        gatewayOrderId: orderId,
        email,
        status: eventType.includes('chargeback') ? 'CHARGEBACK' : 'REFUNDED',
        reason: eventType,
      });
    }

    await markWebhookProcessed(env, eventRecord.id);
    return jsonResponse({ ok: true });
  } catch (error) {
    await markWebhookFailed(env, eventRecord.id, error.message);
    throw error;
  }
}

async function createLicenseForPurchase(env, purchase) {
  if (!purchase.email) {
    throw new HttpError(400, 'WEBHOOK_EMAIL_MISSING');
  }

  const licenseKey = generateLicenseKey();
  let rows;

  try {
    rows = await supabaseInsert(env, 'licenses', {
      license_key: licenseKey,
      license_key_hash: await sha256Hex(licenseKey),
      email: purchase.email,
      gateway: purchase.gateway,
      gateway_order_id: purchase.gatewayOrderId || null,
      gateway_customer_id: purchase.gatewayCustomerId || null,
      gateway_product_id: purchase.gatewayProductId || null,
      gateway_variant_id: purchase.gatewayVariantId || null,
      purchased_at: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof SupabaseError && error.status === 409) {
      return null;
    }
    throw error;
  }

  if (!rows?.length) {
    return null;
  }

  return rows[0];
}

async function revokeLicense(env, { gateway, gatewayOrderId, email, status, reason }) {
  const filters = { gateway: `eq.${gateway}` };

  if (gatewayOrderId) {
    filters.gateway_order_id = `eq.${gatewayOrderId}`;
  } else if (email) {
    filters.email = `eq.${email}`;
  } else {
    throw new HttpError(400, 'WEBHOOK_LICENSE_REFERENCE_MISSING');
  }

  await supabasePatch(env, 'licenses', filters, {
    status,
    revoked_at: new Date().toISOString(),
    revoke_reason: reason,
  });
}

async function recordWebhookEvent(env, event) {
  const payloadSha256 = await sha256Hex(event.rawBody);

  try {
    const rows = await supabaseInsert(env, 'webhook_events', {
      gateway: event.gateway,
      gateway_event_id: event.gatewayEventId || null,
      gateway_order_id: event.gatewayOrderId || null,
      event_type: event.eventType,
      payload: event.payload,
      payload_sha256: payloadSha256,
    });

    return rows[0];
  } catch (error) {
    if (error instanceof SupabaseError && error.status === 409) {
      return { duplicate: true };
    }
    throw error;
  }
}

async function markWebhookProcessed(env, id) {
  if (!id) return;
  await supabasePatch(env, 'webhook_events', { id: `eq.${id}` }, {
    processed_at: new Date().toISOString(),
    processing_error: null,
  });
}

async function markWebhookFailed(env, id, message) {
  if (!id) return;
  await supabasePatch(env, 'webhook_events', { id: `eq.${id}` }, {
    processing_error: String(message).slice(0, 1000),
  });
}

async function sendLicenseEmail(env, to, licenseKey) {
  await sendEmail(env, {
    to,
    subject: 'Sua licença AgioBlur Pro',
    text: [
      'Obrigado por comprar o AgioBlur Pro.',
      '',
      `Sua chave de licença: ${licenseKey}`,
      '',
      'Abra o popup da extensão, acesse "Ativar licença" e cole essa chave.',
    ].join('\n'),
  });
}

async function sendEmail(env, { to, subject, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.LICENSE_FROM_EMAIL,
      to: [to],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, 'EMAIL_SEND_FAILED', await response.text());
  }
}

async function supabaseRpc(env, functionName, body) {
  return supabaseRequest(env, `/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function supabaseSelect(env, table, query) {
  const params = new URLSearchParams(query);
  return supabaseRequest(env, `/rest/v1/${table}?${params}`, {
    method: 'GET',
  });
}

async function supabaseInsert(env, table, body) {
  const headers = { Prefer: 'return=representation' };

  return supabaseRequest(env, `/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

async function supabasePatch(env, table, query, body) {
  const params = new URLSearchParams(query);
  return supabaseRequest(env, `/rest/v1/${table}?${params}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
}

async function supabaseRequest(env, path, init) {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new SupabaseError(response.status, await response.text());
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function signReceipt(env, payload) {
  const key = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(env.LICENSE_PRIVATE_KEY_JWK),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(payload),
  );
  return base64url(signature);
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return hex(signature);
}

async function sha256Hex(value) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

function generateLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const segment = (offset) => Array.from(
    bytes.slice(offset, offset + 4),
    (byte) => chars[byte % chars.length],
  ).join('');

  return [segment(0), segment(4), segment(8), segment(12)].join('-');
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function isPurchaseEvent(eventType) {
  const normalized = eventType.toLowerCase();
  return [
    'purchase_approved',
    'order_created',
    'order_paid',
    'subscription_created',
  ].some((event) => normalized.includes(event));
}

function isRevocationEvent(eventType) {
  const normalized = eventType.toLowerCase();
  return ['refund', 'refunded', 'chargeback', 'cancel'].some((event) => normalized.includes(event));
}

function normalizeLicenseKey(value) {
  return safeString(value).trim().toUpperCase();
}

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

function getPath(source, path) {
  return path.reduce((value, key) => (value && value[key] !== undefined ? value[key] : undefined), source);
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new HttpError(400, 'INVALID_JSON');
  }
}

async function readJson(request) {
  return parseJson(await request.text());
}

function assertEnv(env) {
  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  if (missing.length) {
    throw new HttpError(500, 'MISSING_ENV', missing.join(', '));
  }
}

function errorStatus(error) {
  return {
    LICENSE_NOT_FOUND: 404,
    LICENSE_REVOKED: 403,
    DEVICE_LIMIT_EXCEEDED: 403,
    INVALID_PAYLOAD: 400,
  }[error] || 400;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

function deviceResetPage(success, message) {
  const title = success ? 'Dispositivos redefinidos' : 'Não foi possível redefinir';
  const color = success ? '#10b981' : '#ef4444';

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - AgioBlur</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: Arial, sans-serif; background: #111827; color: #f9fafb; }
    main { width: min(90vw, 520px); padding: 32px; border: 1px solid #374151; border-radius: 8px; background: #1f2937; }
    .mark { width: 40px; height: 40px; border-radius: 999px; background: ${color}; margin-bottom: 18px; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    p { margin: 0; color: #d1d5db; line-height: 1.5; }
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true"></div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function timingSafeEqual(a, b) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] || 0) ^ (right[index] || 0);
  }

  return diff === 0;
}

function base64url(buffer) {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function hex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

class HttpError extends Error {
  constructor(status, publicMessage, detail = '') {
    super(detail || publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

class SupabaseError extends Error {
  constructor(status, body) {
    super(body || `Supabase request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}
