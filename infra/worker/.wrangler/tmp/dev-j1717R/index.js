var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Signature",
  "Access-Control-Max-Age": "86400"
};
var PRO_FEATURES = [
  "messages",
  "media",
  "fakeData",
  "blurIntensity",
  "savedPin",
  "piiCpf",
  "piiEmail",
  "piiCard",
  "piiPhone",
  "piiPix"
];
var REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LICENSE_PRIVATE_KEY_JWK",
  "LICENSE_PUBLIC_KEY_KID",
  "CAKTO_WEBHOOK_SECRET",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "APP_API_BASE_URL",
  "LICENSE_FROM_EMAIL"
];
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const url = new URL(request.url);
    try {
      assertEnv(env);
      if (request.method === "GET" && url.pathname === "/health") {
        return jsonResponse({ ok: true });
      }
      if (request.method === "POST" && url.pathname === "/licenses/validate") {
        return handleValidateLicense(request, env);
      }
      if (request.method === "POST" && url.pathname === "/licenses/reset-devices") {
        return handleRequestDeviceReset(request, env);
      }
      if (request.method === "GET" && url.pathname === "/licenses/reset-devices/confirm") {
        return handleConfirmDeviceReset(url, env);
      }
      if (request.method === "POST" && url.pathname === "/webhooks/lemonsqueezy") {
        return handleLemonSqueezyWebhook(request, env);
      }
      if (request.method === "POST" && url.pathname === "/webhooks/cakto") {
        return handleCaktoWebhook(request, env);
      }
      return jsonResponse({ error: "NOT_FOUND" }, 404);
    } catch (error) {
      const message = error instanceof HttpError ? error.publicMessage : "INTERNAL_ERROR";
      const status = error instanceof HttpError ? error.status : 500;
      console.error(error);
      return jsonResponse({ error: message }, status);
    }
  }
};
async function handleValidateLicense(request, env) {
  const body = await readJson(request);
  const licenseKey = normalizeLicenseKey(body.license_key);
  const deviceUuid = safeString(body.device_uuid);
  const extensionVersion = safeString(body.extension_version);
  if (!licenseKey || !deviceUuid) {
    return jsonResponse({ error: "INVALID_PAYLOAD" }, 400);
  }
  const validation = await supabaseRpc(env, "validate_license_device", {
    p_license_key: licenseKey,
    p_device_uuid: deviceUuid,
    p_user_agent: [
      request.headers.get("User-Agent"),
      extensionVersion ? `AgioBlur/${extensionVersion}` : ""
    ].filter(Boolean).join(" ")
  });
  if (!validation?.ok) {
    return jsonResponse({ error: validation?.error || "LICENSE_NOT_FOUND" }, errorStatus(validation?.error));
  }
  const now = Date.now();
  const expiresAt = now + 24 * 60 * 60 * 1e3;
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
    expires_at: expiresAt
  };
  const receiptPayload = stableStringify(receipt);
  const receiptSignature = await signReceipt(env, receiptPayload);
  return jsonResponse({
    receipt_payload: receiptPayload,
    receipt_signature: receiptSignature,
    expires_at: expiresAt
  });
}
__name(handleValidateLicense, "handleValidateLicense");
async function handleRequestDeviceReset(request, env) {
  const body = await readJson(request);
  const licenseKey = normalizeLicenseKey(body.license_key);
  const newDeviceUuid = safeString(body.new_device_uuid);
  if (!licenseKey || !newDeviceUuid) {
    return jsonResponse({ error: "INVALID_PAYLOAD" }, 400);
  }
  const licenses = await supabaseSelect(env, "licenses", {
    select: "id,email,status",
    license_key: `eq.${licenseKey}`,
    limit: "1"
  });
  const license = licenses[0];
  if (!license) {
    return jsonResponse({ error: "LICENSE_NOT_FOUND" }, 404);
  }
  if (license.status !== "ACTIVE") {
    return jsonResponse({ error: "LICENSE_REVOKED" }, 403);
  }
  const token = crypto.randomUUID();
  const tokenHash = await sha256Hex(token);
  const confirmUrl = `${env.APP_API_BASE_URL.replace(/\/$/, "")}/licenses/reset-devices/confirm?token=${encodeURIComponent(token)}`;
  await supabaseInsert(env, "device_reset_tokens", {
    license_id: license.id,
    token_hash: tokenHash,
    new_device_uuid: newDeviceUuid,
    expires_at: new Date(Date.now() + 15 * 60 * 1e3).toISOString()
  });
  await sendEmail(env, {
    to: license.email,
    subject: "Redefini\xE7\xE3o de dispositivos AgioBlur",
    text: [
      "Recebemos uma solicita\xE7\xE3o para redefinir os dispositivos da sua licen\xE7a AgioBlur.",
      "",
      "Confirme pelo link abaixo em at\xE9 15 minutos:",
      confirmUrl,
      "",
      "Se voc\xEA n\xE3o solicitou isso, ignore este e-mail."
    ].join("\n")
  });
  return jsonResponse({ message: "Confirmation email sent." });
}
__name(handleRequestDeviceReset, "handleRequestDeviceReset");
async function handleConfirmDeviceReset(url, env) {
  const token = safeString(url.searchParams.get("token"));
  if (!token) {
    return htmlResponse(deviceResetPage(false, "Token ausente."), 400);
  }
  const tokenHash = await sha256Hex(token);
  const result = await supabaseRpc(env, "confirm_device_reset", {
    p_token_hash: tokenHash
  });
  if (!result?.ok) {
    const message = {
      INVALID_TOKEN: "Token inv\xE1lido.",
      TOKEN_USED: "Este link j\xE1 foi usado.",
      TOKEN_EXPIRED: "Este link expirou."
    }[result?.error] || "N\xE3o foi poss\xEDvel redefinir seus dispositivos.";
    return htmlResponse(deviceResetPage(false, message), 400);
  }
  return htmlResponse(deviceResetPage(true, "Seus dispositivos foram redefinidos. Reative a extens\xE3o no novo navegador."));
}
__name(handleConfirmDeviceReset, "handleConfirmDeviceReset");
async function handleLemonSqueezyWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") || "";
  const expected = await hmacHex(env.LEMONSQUEEZY_WEBHOOK_SECRET, rawBody);
  if (!timingSafeEqual(signature, expected)) {
    return jsonResponse({ error: "INVALID_SIGNATURE" }, 401);
  }
  const payload = parseJson(rawBody);
  const eventType = getPath(payload, ["meta", "event_name"]) || "unknown";
  const attrs = getPath(payload, ["data", "attributes"]) || {};
  const orderId = String(getPath(payload, ["data", "id"]) || attrs.order_id || attrs.identifier || "");
  const eventId = String(getPath(payload, ["meta", "webhook_id"]) || getPath(payload, ["meta", "event_id"]) || `${eventType}:${orderId}`);
  const email = attrs.user_email || attrs.customer_email || getPath(attrs, ["user_email"]);
  const eventRecord = await recordWebhookEvent(env, {
    gateway: "lemonsqueezy",
    gatewayEventId: eventId,
    gatewayOrderId: orderId,
    eventType,
    payload,
    rawBody
  });
  if (eventRecord.duplicate) {
    return jsonResponse({ ok: true, duplicate: true });
  }
  try {
    if (isPurchaseEvent(eventType)) {
      const license = await createLicenseForPurchase(env, {
        gateway: "lemonsqueezy",
        email,
        gatewayOrderId: orderId,
        gatewayCustomerId: String(attrs.customer_id || ""),
        gatewayProductId: String(attrs.product_id || getPath(attrs, ["first_order_item", "product_id"]) || ""),
        gatewayVariantId: String(attrs.variant_id || getPath(attrs, ["first_order_item", "variant_id"]) || "")
      });
      if (license?.license_key) {
        await sendLicenseEmail(env, license.email, license.license_key);
      }
    } else if (isRevocationEvent(eventType)) {
      await revokeLicense(env, {
        gateway: "lemonsqueezy",
        gatewayOrderId: orderId,
        email,
        status: eventType.includes("chargeback") ? "CHARGEBACK" : "REFUNDED",
        reason: eventType
      });
    }
    await markWebhookProcessed(env, eventRecord.id);
    return jsonResponse({ ok: true });
  } catch (error) {
    await markWebhookFailed(env, eventRecord.id, error.message);
    throw error;
  }
}
__name(handleLemonSqueezyWebhook, "handleLemonSqueezyWebhook");
async function handleCaktoWebhook(request, env) {
  const rawBody = await request.text();
  const payload = parseJson(rawBody);
  if (!timingSafeEqual(String(payload.secret || ""), env.CAKTO_WEBHOOK_SECRET)) {
    return jsonResponse({ error: "INVALID_SIGNATURE" }, 401);
  }
  const eventType = String(payload.event || "unknown");
  const data = payload.data || {};
  const orderId = String(data.id || data.order_id || data.transaction_id || data.sale_id || "");
  const eventId = String(payload.id || data.webhook_id || `${eventType}:${orderId || await sha256Hex(rawBody)}`);
  const email = data.email || getPath(data, ["customer", "email"]) || getPath(data, ["buyer", "email"]);
  const eventRecord = await recordWebhookEvent(env, {
    gateway: "cakto",
    gatewayEventId: eventId,
    gatewayOrderId: orderId,
    eventType,
    payload,
    rawBody
  });
  if (eventRecord.duplicate) {
    return jsonResponse({ ok: true, duplicate: true });
  }
  try {
    if (isPurchaseEvent(eventType)) {
      const license = await createLicenseForPurchase(env, {
        gateway: "cakto",
        email,
        gatewayOrderId: orderId,
        gatewayCustomerId: String(data.customer_id || getPath(data, ["customer", "id"]) || ""),
        gatewayProductId: String(data.product_id || getPath(data, ["product", "id"]) || ""),
        gatewayVariantId: String(data.offer_id || data.variant_id || "")
      });
      if (license?.license_key) {
        await sendLicenseEmail(env, license.email, license.license_key);
      }
    } else if (isRevocationEvent(eventType)) {
      await revokeLicense(env, {
        gateway: "cakto",
        gatewayOrderId: orderId,
        email,
        status: eventType.includes("chargeback") ? "CHARGEBACK" : "REFUNDED",
        reason: eventType
      });
    }
    await markWebhookProcessed(env, eventRecord.id);
    return jsonResponse({ ok: true });
  } catch (error) {
    await markWebhookFailed(env, eventRecord.id, error.message);
    throw error;
  }
}
__name(handleCaktoWebhook, "handleCaktoWebhook");
async function createLicenseForPurchase(env, purchase) {
  if (!purchase.email) {
    throw new HttpError(400, "WEBHOOK_EMAIL_MISSING");
  }
  const licenseKey = generateLicenseKey();
  let rows;
  try {
    rows = await supabaseInsert(env, "licenses", {
      license_key: licenseKey,
      license_key_hash: await sha256Hex(licenseKey),
      email: purchase.email,
      gateway: purchase.gateway,
      gateway_order_id: purchase.gatewayOrderId || null,
      gateway_customer_id: purchase.gatewayCustomerId || null,
      gateway_product_id: purchase.gatewayProductId || null,
      gateway_variant_id: purchase.gatewayVariantId || null,
      purchased_at: (/* @__PURE__ */ new Date()).toISOString()
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
__name(createLicenseForPurchase, "createLicenseForPurchase");
async function revokeLicense(env, { gateway, gatewayOrderId, email, status, reason }) {
  const filters = { gateway: `eq.${gateway}` };
  if (gatewayOrderId) {
    filters.gateway_order_id = `eq.${gatewayOrderId}`;
  } else if (email) {
    filters.email = `eq.${email}`;
  } else {
    throw new HttpError(400, "WEBHOOK_LICENSE_REFERENCE_MISSING");
  }
  await supabasePatch(env, "licenses", filters, {
    status,
    revoked_at: (/* @__PURE__ */ new Date()).toISOString(),
    revoke_reason: reason
  });
}
__name(revokeLicense, "revokeLicense");
async function recordWebhookEvent(env, event) {
  const payloadSha256 = await sha256Hex(event.rawBody);
  try {
    const rows = await supabaseInsert(env, "webhook_events", {
      gateway: event.gateway,
      gateway_event_id: event.gatewayEventId || null,
      gateway_order_id: event.gatewayOrderId || null,
      event_type: event.eventType,
      payload: event.payload,
      payload_sha256: payloadSha256
    });
    return rows[0];
  } catch (error) {
    if (error instanceof SupabaseError && error.status === 409) {
      return { duplicate: true };
    }
    throw error;
  }
}
__name(recordWebhookEvent, "recordWebhookEvent");
async function markWebhookProcessed(env, id) {
  if (!id) return;
  await supabasePatch(env, "webhook_events", { id: `eq.${id}` }, {
    processed_at: (/* @__PURE__ */ new Date()).toISOString(),
    processing_error: null
  });
}
__name(markWebhookProcessed, "markWebhookProcessed");
async function markWebhookFailed(env, id, message) {
  if (!id) return;
  await supabasePatch(env, "webhook_events", { id: `eq.${id}` }, {
    processing_error: String(message).slice(0, 1e3)
  });
}
__name(markWebhookFailed, "markWebhookFailed");
async function sendLicenseEmail(env, to, licenseKey) {
  await sendEmail(env, {
    to,
    subject: "Sua licen\xE7a AgioBlur Pro",
    text: [
      "Obrigado por comprar o AgioBlur Pro.",
      "",
      `Sua chave de licen\xE7a: ${licenseKey}`,
      "",
      'Abra o popup da extens\xE3o, acesse "Ativar licen\xE7a" e cole essa chave.'
    ].join("\n")
  });
}
__name(sendLicenseEmail, "sendLicenseEmail");
async function sendEmail(env, { to, subject, text }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.LICENSE_FROM_EMAIL,
      to: [to],
      subject,
      text
    })
  });
  if (!response.ok) {
    throw new HttpError(502, "EMAIL_SEND_FAILED", await response.text());
  }
}
__name(sendEmail, "sendEmail");
async function supabaseRpc(env, functionName, body) {
  return supabaseRequest(env, `/rest/v1/rpc/${functionName}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}
__name(supabaseRpc, "supabaseRpc");
async function supabaseSelect(env, table, query) {
  const params = new URLSearchParams(query);
  return supabaseRequest(env, `/rest/v1/${table}?${params}`, {
    method: "GET"
  });
}
__name(supabaseSelect, "supabaseSelect");
async function supabaseInsert(env, table, body) {
  const headers = { Prefer: "return=representation" };
  return supabaseRequest(env, `/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}
__name(supabaseInsert, "supabaseInsert");
async function supabasePatch(env, table, query, body) {
  const params = new URLSearchParams(query);
  return supabaseRequest(env, `/rest/v1/${table}?${params}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(body)
  });
}
__name(supabasePatch, "supabasePatch");
async function supabaseRequest(env, path, init) {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...init.headers || {}
    }
  });
  if (!response.ok) {
    throw new SupabaseError(response.status, await response.text());
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
__name(supabaseRequest, "supabaseRequest");
async function signReceipt(env, payload) {
  const key = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(env.LICENSE_PRIVATE_KEY_JWK),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(payload)
  );
  return base64url(signature);
}
__name(signReceipt, "signReceipt");
async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return hex(signature);
}
__name(hmacHex, "hmacHex");
async function sha256Hex(value) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}
__name(sha256Hex, "sha256Hex");
function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const segment = /* @__PURE__ */ __name((offset) => Array.from(
    bytes.slice(offset, offset + 4),
    (byte) => chars[byte % chars.length]
  ).join(""), "segment");
  return [segment(0), segment(4), segment(8), segment(12)].join("-");
}
__name(generateLicenseKey, "generateLicenseKey");
function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}
__name(stableStringify, "stableStringify");
function isPurchaseEvent(eventType) {
  const normalized = eventType.toLowerCase();
  return [
    "purchase_approved",
    "order_created",
    "order_paid",
    "subscription_created"
  ].some((event) => normalized.includes(event));
}
__name(isPurchaseEvent, "isPurchaseEvent");
function isRevocationEvent(eventType) {
  const normalized = eventType.toLowerCase();
  return ["refund", "refunded", "chargeback", "cancel"].some((event) => normalized.includes(event));
}
__name(isRevocationEvent, "isRevocationEvent");
function normalizeLicenseKey(value) {
  return safeString(value).trim().toUpperCase();
}
__name(normalizeLicenseKey, "normalizeLicenseKey");
function safeString(value) {
  return typeof value === "string" ? value : "";
}
__name(safeString, "safeString");
function getPath(source, path) {
  return path.reduce((value, key) => value && value[key] !== void 0 ? value[key] : void 0, source);
}
__name(getPath, "getPath");
function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new HttpError(400, "INVALID_JSON");
  }
}
__name(parseJson, "parseJson");
async function readJson(request) {
  return parseJson(await request.text());
}
__name(readJson, "readJson");
function assertEnv(env) {
  const missing = REQUIRED_ENV.filter((key) => !env[key]);
  if (missing.length) {
    throw new HttpError(500, "MISSING_ENV", missing.join(", "));
  }
}
__name(assertEnv, "assertEnv");
function errorStatus(error) {
  return {
    LICENSE_NOT_FOUND: 404,
    LICENSE_REVOKED: 403,
    DEVICE_LIMIT_EXCEEDED: 403,
    INVALID_PAYLOAD: 400
  }[error] || 400;
}
__name(errorStatus, "errorStatus");
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
__name(jsonResponse, "jsonResponse");
function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
__name(htmlResponse, "htmlResponse");
function deviceResetPage(success, message) {
  const title = success ? "Dispositivos redefinidos" : "N\xE3o foi poss\xEDvel redefinir";
  const color = success ? "#10b981" : "#ef4444";
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
__name(deviceResetPage, "deviceResetPage");
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
__name(escapeHtml, "escapeHtml");
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
__name(timingSafeEqual, "timingSafeEqual");
function base64url(buffer) {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
__name(base64url, "base64url");
function hex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(hex, "hex");
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  constructor(status, publicMessage, detail = "") {
    super(detail || publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
  }
};
var SupabaseError = class extends Error {
  static {
    __name(this, "SupabaseError");
  }
  constructor(status, body) {
    super(body || `Supabase request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-EJr0z9/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-EJr0z9/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
