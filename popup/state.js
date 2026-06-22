/**
 * @fileoverview Estado do Popup.
 */

/* global POPUP_CONSTANTS */
'use strict';

// eslint-disable-next-line no-unused-vars
const POPUP_STATE = (function() {
  let currentSettings = { ...POPUP_CONSTANTS.DEFAULTS_SETTINGS };
  let isSessionUnlocked = false;
  let licenseStatus = { isPremium: false, plan: 'FREE', features: [] };

  return {
    getSettings() { return currentSettings; },
    setSettings(s) { currentSettings = s; },
    getIsUnlocked() { return isSessionUnlocked; },
    setIsUnlocked(v) { isSessionUnlocked = v; },
    getLicenseStatus() { return licenseStatus; },
    setLicenseStatus(status) { licenseStatus = status || { isPremium: false, plan: 'FREE', features: [] }; },
    getIsPremium() { return !!licenseStatus.isPremium; }
  };
})();
