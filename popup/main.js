/**
 * @fileoverview Ponto de entrada do Popup e Listeners.
 */

/* global POPUP_CONSTANTS, POPUP_STATE, POPUP_UI, POPUP_STORAGE */
'use strict';

async function onToggleChange() {
  const settings = POPUP_STATE.getSettings();
  const unlocked = POPUP_STATE.getIsUnlocked();
  if (settings.savedPin && !unlocked) return;

  const state = POPUP_UI.readUIState();
  POPUP_UI.updateStatus(state);
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
  POPUP_UI.updateSliderGradient();
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
  POPUP_UI.updateStatus(state);
  await POPUP_STORAGE.saveState(state);
}

async function handlePinAction() {
  const pin = POPUP_UI.elements.inputPin.value.trim();
  if (!pin) return;

  const currentSettings = POPUP_STATE.getSettings();
  const isUnlocked = POPUP_STATE.getIsUnlocked();

  if (!currentSettings.savedPin) {
    if (pin.length < 3) {
      alert('O PIN deve ter pelo menos 3 caracteres.');
      return;
    }
    const newSettings = { ...currentSettings, savedPin: pin };
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
    return;
  }

  if (!isUnlocked) {
    if (pin === currentSettings.savedPin) {
      POPUP_STATE.setIsUnlocked(true);
      POPUP_UI.elements.inputPin.value = '';
      POPUP_UI.applyLockState();

      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action: 'unlock', duration: 5 * 60 * 1000 }, () => {
            if (chrome.runtime.lastError) { /* tab fechada, ok */ }
          });
        });
      });
    } else {
      alert('PIN incorreto!');
      POPUP_UI.elements.inputPin.value = '';
    }
  }
}

async function handleResetPin() {
  const isUnlocked = POPUP_STATE.getIsUnlocked();
  if (!isUnlocked) return;
  
  const currentSettings = POPUP_STATE.getSettings();
  const newSettings = { ...currentSettings, savedPin: '' };
  
  await POPUP_STORAGE.saveSettings(newSettings);
  POPUP_STATE.setIsUnlocked(false);
  POPUP_UI.applyLockState();

  chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'relock' }, () => {
        if (chrome.runtime.lastError) { /* ignore se aba fechada */ }
      });
    });
  });
}

async function handleRelock() {
  const isUnlocked = POPUP_STATE.getIsUnlocked();
  if (!isUnlocked) return;
  
  POPUP_STATE.setIsUnlocked(false);
  POPUP_UI.applyLockState();
  
  chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: 'relock' }, () => {
        if (chrome.runtime.lastError) { /* ignore se aba fechada */ }
      });
    });
  });
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

  POPUP_UI.elements.btnPinAction.addEventListener('click', handlePinAction);
  POPUP_UI.elements.inputPin.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePinAction();
  });
  POPUP_UI.elements.btnResetPin.addEventListener('click', handleResetPin);
  POPUP_UI.elements.btnRelock.addEventListener('click', handleRelock);
}

// Inicializar
attachListeners();
POPUP_STORAGE.loadAndSync();
