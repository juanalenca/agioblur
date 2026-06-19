/**
 * @fileoverview Ponto de entrada do Popup e Listeners.
 */

/* global POPUP_CONSTANTS, POPUP_STATE, POPUP_UI, POPUP_STORAGE */
'use strict';

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function onToggleChange() {
  const settings = POPUP_STATE.getSettings();
  const unlocked = POPUP_STATE.getIsUnlocked();
  if (settings.savedPin && !unlocked) return;

  const state = POPUP_UI.readUIState();
  await POPUP_STORAGE.saveState(state);
}

async function onSettingsChange() {
  const settings = POPUP_STATE.getSettings();
  const unlocked = POPUP_STATE.getIsUnlocked();
  if (settings.savedPin && !unlocked) return;

  const newSettings = {
    ...settings,
    blurIntensity: parseInt(POPUP_UI.elements.sliderBlur.value, 10),
    solidMode: POPUP_UI.elements.toggleSolid.checked,
    fakeData: POPUP_UI.elements.toggleFakeData.checked,
  };
  
  POPUP_UI.elements.blurLabel.textContent = newSettings.blurIntensity + 'px';
  await POPUP_STORAGE.saveSettings(newSettings);
}

async function setAll(value) {
  const settings = POPUP_STATE.getSettings();
  const unlocked = POPUP_STATE.getIsUnlocked();
  if (settings.savedPin && !unlocked) return;

  for (const key of Object.keys(POPUP_CONSTANTS.TOGGLE_IDS)) {
    POPUP_UI.getToggle(key).checked = value;
  }
  const state = POPUP_UI.readUIState();
  await POPUP_STORAGE.saveState(state);
}

async function handleSavePin() {
  const pin = POPUP_UI.elements.inputPin.value.trim();
  if (!pin) return;
  if (pin.length < 3) {
    alert(chrome.i18n.getMessage('alertPinLength'));
    return;
  }
  const hashedPin = await hashPin(pin);
  const currentSettings = POPUP_STATE.getSettings();
  const newSettings = { ...currentSettings, savedPin: hashedPin };
  await POPUP_STORAGE.saveSettings(newSettings);
  POPUP_UI.elements.inputPin.value = '';
  POPUP_STATE.setIsUnlocked(false);
  POPUP_UI.applyLockState();
  
  
  chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
    tabs.forEach((tab) => {
      
      chrome.tabs.sendMessage(tab.id, { action: 'relock' }, () => {
        
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    });
  });
}

async function handleUnlock() {
  const pin = POPUP_UI.elements.inputPinOverlay.value.trim();
  if (!pin) return;

  const currentSettings = POPUP_STATE.getSettings();
  const hashedPin = await hashPin(pin);
  
  if (hashedPin === currentSettings.savedPin) {
    POPUP_STATE.setIsUnlocked(true);
    POPUP_UI.elements.inputPinOverlay.value = '';
    POPUP_UI.applyLockState();

    
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        
        chrome.tabs.sendMessage(tab.id, { action: 'unlock', duration: 5 * 60 * 1000 }, () => {
          
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      });
    });
  } else {
    alert(chrome.i18n.getMessage('alertPinIncorrect'));
    POPUP_UI.elements.inputPinOverlay.value = '';
  }
}

async function handleResetPin() {
  const currentSettings = POPUP_STATE.getSettings();
  const newSettings = { ...currentSettings, savedPin: '' };
  
  await POPUP_STORAGE.saveSettings(newSettings);
  POPUP_STATE.setIsUnlocked(false);
  POPUP_UI.applyLockState();

  chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'relock' }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    });
  });
}

async function handleResetPinFromOverlay() {
  const pin = POPUP_UI.elements.inputPinOverlay.value.trim();
  const currentSettings = POPUP_STATE.getSettings();
  const hashedPin = await hashPin(pin);
  
  if (hashedPin === currentSettings.savedPin) {
    const newSettings = { ...currentSettings, savedPin: '' };
    await POPUP_STORAGE.saveSettings(newSettings);
    POPUP_STATE.setIsUnlocked(false);
    POPUP_UI.applyLockState();
    
    chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action: 'relock' }, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      });
    });
  } else {
    alert(chrome.i18n.getMessage('alertPinRemoveLock'));
  }
}

async function handleRelock() {
  POPUP_STATE.setIsUnlocked(false);
  POPUP_UI.applyLockState();
  
  chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
    tabs.forEach((tab) => {
      
      chrome.tabs.sendMessage(tab.id, { action: 'relock' }, () => {
        
        if (chrome.runtime.lastError) { /* ignore */ }
      });
    });
  });
}

let resetConfirmTimeout;
async function handleFactoryReset(e) {
  const btn = e.target;
  
  if (!btn.classList.contains('confirming')) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = chrome.i18n.getMessage('btnConfirmReset');
    btn.classList.add('confirming');
    
    resetConfirmTimeout = setTimeout(() => {
      btn.textContent = btn.dataset.originalText;
      btn.classList.remove('confirming');
    }, 3000);
  } else {
    clearTimeout(resetConfirmTimeout);
    btn.textContent = btn.dataset.originalText;
    btn.classList.remove('confirming');
    
    const defaultData = {
      [POPUP_CONSTANTS.STORAGE_KEY]: POPUP_CONSTANTS.DEFAULTS_CATEGORIES,
      [POPUP_CONSTANTS.SETTINGS_KEY]: POPUP_CONSTANTS.DEFAULTS_SETTINGS
    };
    
    chrome.storage.local.set(defaultData, () => {
      POPUP_STORAGE.loadAndSync();
    });
  }
}

function attachListeners() {
  for (const key of Object.keys(POPUP_CONSTANTS.TOGGLE_IDS)) {
    POPUP_UI.getToggle(key).addEventListener('change', onToggleChange);
  }

  POPUP_UI.elements.btnAllOn.addEventListener('click', () => setAll(true));
  POPUP_UI.elements.btnAllOff.addEventListener('click', () => setAll(false));

  POPUP_UI.elements.sliderBlur.addEventListener('input', onSettingsChange);
  POPUP_UI.elements.toggleSolid.addEventListener('change', onSettingsChange);
  POPUP_UI.elements.toggleFakeData.addEventListener('change', onSettingsChange);

  // Setup PIN
  POPUP_UI.elements.btnSavePin.addEventListener('click', handleSavePin);
  POPUP_UI.elements.inputPin.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSavePin();
  });
  
  // Overlay actions
  POPUP_UI.elements.btnPinOverlay.addEventListener('click', handleUnlock);
  POPUP_UI.elements.inputPinOverlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });
  POPUP_UI.elements.btnRemovePinOverlay.addEventListener('click', handleResetPinFromOverlay);
  POPUP_UI.elements.btnFactoryReset.addEventListener('click', handleFactoryReset);

  // Active UI actions
  POPUP_UI.elements.btnRemovePin.addEventListener('click', handleResetPin);
  POPUP_UI.elements.btnRelock.addEventListener('click', handleRelock);
}

// Inicializar
POPUP_UI.localizeUI();
attachListeners();
POPUP_STORAGE.loadAndSync();
