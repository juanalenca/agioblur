/**
 * @fileoverview Lógica de armazenamento do Popup.
 */

/* global POPUP_CONSTANTS, POPUP_STATE, POPUP_UI */
'use strict';

// eslint-disable-next-line no-unused-vars
const POPUP_STORAGE = (function() {
  async function saveState(state) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [POPUP_CONSTANTS.STORAGE_KEY]: state }, resolve);
    });
  }

  async function saveSettings(settings) {
    POPUP_STATE.setSettings(settings);
    return new Promise((resolve) => {
      chrome.storage.local.set({ [POPUP_CONSTANTS.SETTINGS_KEY]: settings }, resolve);
    });
  }

  async function loadAndSync() {
    return new Promise((resolve) => {
      chrome.storage.local.get([POPUP_CONSTANTS.STORAGE_KEY, POPUP_CONSTANTS.SETTINGS_KEY], (result) => {
        const savedCats = result[POPUP_CONSTANTS.STORAGE_KEY];
        const state = savedCats ? { ...POPUP_CONSTANTS.DEFAULTS_CATEGORIES, ...savedCats } : { ...POPUP_CONSTANTS.DEFAULTS_CATEGORIES };
        
        for (const [key, checked] of Object.entries(state)) {
          const toggle = POPUP_UI.getToggle(key);
          if (toggle) toggle.checked = checked;
        }
        POPUP_UI.updateStatus(state);

        const savedSettings = result[POPUP_CONSTANTS.SETTINGS_KEY];
        const currentSettings = savedSettings ? { ...POPUP_CONSTANTS.DEFAULTS_SETTINGS, ...savedSettings } : { ...POPUP_CONSTANTS.DEFAULTS_SETTINGS };
        POPUP_STATE.setSettings(currentSettings);

        POPUP_UI.elements.sliderBlur.value = currentSettings.blurIntensity;
        POPUP_UI.elements.blurLabel.textContent = currentSettings.blurIntensity + 'px';
        POPUP_UI.elements.toggleSolid.checked = currentSettings.solidMode;
        POPUP_UI.elements.toggleFakeData.checked = currentSettings.fakeData;
        POPUP_UI.updateSliderGradient();

        POPUP_STATE.setIsUnlocked(false);
        POPUP_UI.applyLockState();

        chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'status' }, (response) => {
              if (!chrome.runtime.lastError && response && response.isUnlocked) {
                POPUP_STATE.setIsUnlocked(true);
                POPUP_UI.applyLockState();
              }
            });
          }
        });

        resolve();
      });
    });
  }

  return { saveState, saveSettings, loadAndSync };
})();
