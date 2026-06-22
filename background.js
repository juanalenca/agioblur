/**
 * @fileoverview Service worker de licenciamento Freemium do AgioBlur.
 */

'use strict';

const AGIOBLUR_LICENSE_API_BASE = 'https://api.agioblur.com';
const LICENSE_KEY_ID = 'agioblur-dev-2026-01';
const LICENSE_PUBLIC_KEY_JWK = {
  key_ops: ['verify'],
  ext: true,
  kty: 'EC',
  x: 'HhoTYSi8YxvmOI8R3u0qqm6tnciYpzn6_mUSgeCBdvI',
  y: '2QxPF8ST5PLxCsaH_fHqP4idrGjxia-g_RSjeGkLrNc',
  crv: 'P-256'
};

const LICENSE_STORAGE_KEYS = [
  'device_uuid',
  'license_key',
  'license_receipt_payload',
  'license_receipt_signature',
  'license_last_validated_at',
  'license_last_failed_at',
  'license_last_error'
];

const OFFLINE_TOLERANCE_MS = 72 * 60 * 60 * 1000;

async function ensureDeviceUuid() {
  const storage = await chrome.storage.local.get('device_uuid');
  if (storage.device_uuid) return storage.device_uuid;

  const deviceUuid = crypto.randomUUID();
  await chrome.storage.local.set({ device_uuid: deviceUuid });
  return deviceUuid;
}

async function getLocalLicenseStatus() {
  await ensureDeviceUuid();

  const storage = await chrome.storage.local.get(LICENSE_STORAGE_KEYS);
  const baseStatus = {
    isPremium: false,
    plan: 'FREE',
    features: [],
    error: storage.license_last_error || null,
    expiresAt: null,
    offline: false
  };

  if (!storage.license_key || !storage.license_receipt_payload || !storage.license_receipt_signature) {
    return baseStatus;
  }

  const verified = await verifyReceipt(storage.license_receipt_payload, storage.license_receipt_signature);
  if (!verified.ok) {
    return { ...baseStatus, error: verified.error };
  }

  const receipt = verified.receipt;
  const now = Date.now();
  const expiresAt = Number(receipt.expires_at);

  if (receipt.kid !== LICENSE_KEY_ID) {
    return { ...baseStatus, error: 'LICENSE_KEY_MISMATCH' };
  }

  if (receipt.device_uuid !== storage.device_uuid) {
    return { ...baseStatus, error: 'DEVICE_MISMATCH' };
  }

  if (expiresAt > now) {
    return {
      isPremium: true,
      plan: receipt.plan || 'PRO',
      features: receipt.features || [],
      error: null,
      expiresAt,
      offline: false
    };
  }

  if (storage.license_last_failed_at && now - storage.license_last_failed_at < OFFLINE_TOLERANCE_MS) {
    return {
      isPremium: true,
      plan: receipt.plan || 'PRO',
      features: receipt.features || [],
      error: 'OFFLINE_GRACE',
      expiresAt,
      offline: true
    };
  }

  return { ...baseStatus, error: 'RECEIPT_EXPIRED', expiresAt };
}

async function activateLicense(licenseKey) {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  if (!normalizedKey) {
    return { ok: false, error: 'INVALID_LICENSE_KEY', status: await getLocalLicenseStatus() };
  }

  await chrome.storage.local.set({ license_key: normalizedKey });
  const result = await validateLicenseNow();
  return {
    ok: result.status.isPremium,
    error: result.error || result.status.error,
    status: result.status
  };
}

async function validateLicenseNow() {
  const deviceUuid = await ensureDeviceUuid();
  const storage = await chrome.storage.local.get(['license_key', 'license_last_failed_at']);
  const licenseKey = normalizeLicenseKey(storage.license_key);

  if (!licenseKey) {
    const status = await getLocalLicenseStatus();
    await notifyLicenseStatusChanged(status);
    return { ok: true, status };
  }

  try {
    const response = await fetch(`${AGIOBLUR_LICENSE_API_BASE}/licenses/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: licenseKey,
        device_uuid: deviceUuid,
        extension_version: chrome.runtime.getManifest().version
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      await handleValidationError(data.error || 'VALIDATION_FAILED');
      const status = await getLocalLicenseStatus();
      await notifyLicenseStatusChanged(status);
      return { ok: false, error: data.error || 'VALIDATION_FAILED', status };
    }

    const verified = await verifyReceipt(data.receipt_payload, data.receipt_signature);
    if (!verified.ok) {
      await chrome.storage.local.set({
        license_last_error: verified.error,
        license_last_failed_at: Date.now()
      });
      const status = await getLocalLicenseStatus();
      await notifyLicenseStatusChanged(status);
      return { ok: false, error: verified.error, status };
    }

    await chrome.storage.local.set({
      license_key: licenseKey,
      license_receipt_payload: data.receipt_payload,
      license_receipt_signature: data.receipt_signature,
      license_last_validated_at: Date.now(),
      license_last_failed_at: null,
      license_last_error: null
    });

    const status = await getLocalLicenseStatus();
    await notifyLicenseStatusChanged(status);
    return { ok: true, status };
  } catch {
    if (!storage.license_last_failed_at) {
      await chrome.storage.local.set({ license_last_failed_at: Date.now() });
    }

    const status = await getLocalLicenseStatus();
    await notifyLicenseStatusChanged(status);
    return { ok: false, error: 'NETWORK_ERROR', status };
  }
}

async function requestDeviceReset(licenseKey) {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  const deviceUuid = await ensureDeviceUuid();

  if (!normalizedKey) {
    return { ok: false, error: 'INVALID_LICENSE_KEY' };
  }

  try {
    const response = await fetch(`${AGIOBLUR_LICENSE_API_BASE}/licenses/reset-devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        license_key: normalizedKey,
        new_device_uuid: deviceUuid
      })
    });
    const data = await response.json().catch(() => ({}));
    return response.ok ? { ok: true } : { ok: false, error: data.error || 'RESET_FAILED' };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

async function handleValidationError(error) {
  if (['LICENSE_NOT_FOUND', 'LICENSE_REVOKED'].includes(error)) {
    await chrome.storage.local.remove([
      'license_key',
      'license_receipt_payload',
      'license_receipt_signature',
      'license_last_validated_at',
      'license_last_failed_at'
    ]);
  }

  await chrome.storage.local.set({ license_last_error: error });
}

async function verifyReceipt(payload, signature) {
  if (!payload || !signature) {
    return { ok: false, error: 'RECEIPT_MISSING' };
  }

  let receipt;
  try {
    receipt = JSON.parse(payload);
  } catch {
    return { ok: false, error: 'RECEIPT_INVALID' };
  }

  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      LICENSE_PUBLIC_KEY_JWK,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      base64urlToArrayBuffer(signature),
      new TextEncoder().encode(payload)
    );
    return valid ? { ok: true, receipt } : { ok: false, error: 'RECEIPT_SIGNATURE_INVALID' };
  } catch {
    return { ok: false, error: 'RECEIPT_VERIFY_FAILED' };
  }
}

async function notifyLicenseStatusChanged(status) {
  await chrome.storage.local.set({
    license_is_premium: status.isPremium,
    license_status_snapshot: status
  });

  const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
  for (const tab of tabs) {
    if (!tab.id) continue;
    chrome.tabs.sendMessage(tab.id, { action: 'license:statusChanged', status }, () => {
      if (chrome.runtime.lastError) {
        // Tab without an active content script yet.
      }
    });
  }
}

function normalizeLicenseKey(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function base64urlToArrayBuffer(value) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDeviceUuid();
  chrome.alarms.create('license-check', { periodInMinutes: 60 });
});

chrome.runtime.onStartup.addListener(() => {
  ensureDeviceUuid();
  validateLicenseNow();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'license-check') {
    validateLicenseNow();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'license:getStatus') {
    getLocalLicenseStatus().then(sendResponse);
    return true;
  }

  if (message.action === 'license:validateNow') {
    validateLicenseNow().then(sendResponse);
    return true;
  }

  if (message.action === 'license:activate') {
    activateLicense(message.licenseKey).then(sendResponse);
    return true;
  }

  if (message.action === 'license:requestDeviceReset') {
    requestDeviceReset(message.licenseKey).then(sendResponse);
    return true;
  }

  return false;
});

ensureDeviceUuid();
chrome.alarms.create('license-check', { periodInMinutes: 60 });
validateLicenseNow();
