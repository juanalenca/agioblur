# Supabase License Schema

Migrations for the AgioBlur Freemium license system.

## Local development

Start Supabase locally with Docker:

```powershell
npm run supabase:start
```

Reset the local database, apply migrations and seed the test license:

```powershell
npm run supabase:reset
```

Show local API URLs and keys:

```powershell
npm run supabase:status
```

Stop local services:

```powershell
npm run supabase:stop
```

The local seed creates this reusable Pro test license:

```text
AGIO-TEST-0001
```

## Apply Migrations Remotely

Run the SQL files in `migrations/` against a Supabase development project before connecting the Worker to a remote environment.

The schema creates:

- `licenses`
- `license_devices`
- `device_reset_tokens`
- `webhook_events`
- `validate_license_device(...)`
- `confirm_device_reset(...)`

## Security model

Tables have RLS enabled and no public policies. The Cloudflare Worker is expected to use the Supabase service role key server-side only.

Do not expose the service role key in the extension, landing page or GitHub repository.
