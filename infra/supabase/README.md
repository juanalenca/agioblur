# Supabase License Schema

Migrations for the AgioBlur Freemium license system.

## Apply migrations

Run the SQL files in `migrations/` against a Supabase development project before connecting the Worker.

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
