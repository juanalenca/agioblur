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
