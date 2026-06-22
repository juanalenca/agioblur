# AgioBlur License Worker

Cloudflare Worker responsible for AgioBlur Pro license validation, device reset, payment webhooks and license e-mails.

## Local setup

1. Copy `.dev.vars.example` to `.dev.vars`.
2. Fill the Supabase, gateway and Resend secrets.
3. Run the Supabase migrations in `../supabase/migrations`.
4. Install Worker dependencies:

```powershell
npm --prefix infra/worker install
```

5. Start locally:

```powershell
npm --prefix infra/worker run dev
```

Create or refresh a local test license after the migration. The same SQL is versioned at `infra/supabase/seeds/local_test_license.sql`:

```sql
insert into public.licenses (
  license_key,
  license_key_hash,
  email,
  gateway,
  gateway_order_id,
  max_devices
) values (
  'AGIO-TEST-0001',
  public.sha256_hex('AGIO-TEST-0001'),
  'dev@agioblur.local',
  'cakto',
  'local-test-0001',
  3
)
on conflict (license_key) do update
set status = 'ACTIVE',
    max_devices = excluded.max_devices,
    updated_at = now();
```

## Local extension integration

The extension defaults to `https://api.agioblur.com`. For local validation tests, point the service worker to Wrangler:

```powershell
npm run worker:dev
```

Then open the extension service worker DevTools in `chrome://extensions` and run:

```js
chrome.runtime.sendMessage({
  action: 'license:setApiBase',
  apiBaseUrl: 'http://127.0.0.1:8787'
});
```

Confirm the active API base:

```js
chrome.runtime.sendMessage({ action: 'license:getApiBase' }, console.log);
```

Return the extension to the production API:

```js
chrome.runtime.sendMessage({
  action: 'license:setApiBase',
  apiBaseUrl: ''
});
```

Basic Worker checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
Invoke-RestMethod http://127.0.0.1:8787/licenses/validate `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"license_key":"AGIO-TEST-0001","device_uuid":"local-device","extension_version":"2.1.0"}'
```

## Routes

- `GET /health`
- `POST /licenses/validate`
- `POST /licenses/reset-devices`
- `GET /licenses/reset-devices/confirm?token=...`
- `POST /webhooks/cakto`
- `POST /webhooks/lemonsqueezy`

## Secrets

Never commit `.dev.vars`. Production secrets must be configured with Cloudflare:

```powershell
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put LICENSE_PRIVATE_KEY_JWK
wrangler secret put CAKTO_WEBHOOK_SECRET
wrangler secret put LEMONSQUEEZY_WEBHOOK_SECRET
wrangler secret put RESEND_API_KEY
```

## Receipt signing

The Worker signs Premium receipts with `LICENSE_PRIVATE_KEY_JWK` using ECDSA P-256/SHA-256. The extension must only embed the matching public key and verify `receipt_payload` + `receipt_signature`; it must never contain the private key.
