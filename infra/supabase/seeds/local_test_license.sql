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
