/**
 * @fileoverview Ponto de entrada do Content Script e listeners de mensagens.
 */

/* global WPB_CONSTANTS, WPB_STATE, WPB_DOM */
'use strict';

/**
 * Aplica as configurações globais de estilo (blur, modo dark) na raiz
 * @param {Object} settings 
 */
function applySettingsToRoot(settings) {
  const root = document.documentElement;
  
  // Intensidade
  root.style.setProperty('--wpb-blur', settings.blurIntensity + 'px');
  root.style.setProperty('--wpb-blur-heavy', (settings.blurIntensity + 4) + 'px');

  // Tarja Preta
  if (settings.solidMode) {
    root.classList.add('wpb-solid-mode');
  } else {
    root.classList.remove('wpb-solid-mode');
  }

  // Ao mudar Fake Data, disparamos um re-scan total
  const current = WPB_STATE.getSettings();
  if (settings.fakeData !== current.fakeData) {
    current.fakeData = settings.fakeData;
    WPB_STATE.setSettings(current);
    WPB_DOM.applyFullState();
  }
}

/**
 * Escuta mudanças no storage
 */
function listenForStorageChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    // Atualizar settings primeiro
    if (changes[WPB_CONSTANTS.SETTINGS_KEY]) {
      const currentSettings = WPB_STATE.getSettings();
      const newSettings = changes[WPB_CONSTANTS.SETTINGS_KEY].newValue || {};
      const mergedSettings = { ...currentSettings, ...newSettings };
      
      applySettingsToRoot(mergedSettings);
      WPB_STATE.setSettings(mergedSettings);

      const isUnlocked = WPB_STATE.getIsUnlocked();
      if (mergedSettings.savedPin && !isUnlocked) {
        document.body.classList.add('wpb-locked');
      } else if (!mergedSettings.savedPin) {
        document.body.classList.remove('wpb-locked');
      }
    }

    if (changes[WPB_CONSTANTS.STORAGE_KEY]) {
      const newState = changes[WPB_CONSTANTS.STORAGE_KEY].newValue || {};
      const oldState = { ...WPB_STATE.getCategoryState() };
      
      const defaults = {};
      for (const [key, config] of Object.entries(WPB_CONSTANTS.CATEGORIES)) {
        defaults[key] = config.defaultEnabled;
      }
      const incoming = { ...defaults, ...newState };

      const currentSettings = WPB_STATE.getSettings();
      const isUnlocked = WPB_STATE.getIsUnlocked();
      const pinActive = !!currentSettings.savedPin && !isUnlocked;

      for (const key of Object.keys(WPB_CONSTANTS.CATEGORIES)) {
        const wasActive = oldState[key];
        const wantsActive = incoming[key];

        if (pinActive && wasActive && !wantsActive) {
          incoming[key] = true;
        }
      }

      WPB_STATE.setCategoryState(incoming);

      for (const key of Object.keys(WPB_CONSTANTS.CATEGORIES)) {
        const wasActive = oldState[key];
        const isActive = incoming[key];
        if (wasActive && !isActive) WPB_DOM.clearCategory(key);
        else if (!wasActive && isActive) WPB_DOM.scanAndApply(document);
      }
    }
  });
}

/**
 * Escuta comandos vindos do popup
 */
function listenForRuntimeMessages() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'unlock') {
      WPB_STATE.setIsUnlocked(true);
      document.body.classList.remove('wpb-locked');
      
      let unlockTimeout = WPB_STATE.getUnlockTimeout();
      if (unlockTimeout) clearTimeout(unlockTimeout);
      
      unlockTimeout = setTimeout(() => {
        WPB_STATE.setIsUnlocked(false);
        const currentSettings = WPB_STATE.getSettings();
        if (currentSettings.savedPin) {
          document.body.classList.add('wpb-locked');
        }
      }, message.duration || 300000);
      
      WPB_STATE.setUnlockTimeout(unlockTimeout);
      sendResponse({ success: true });
      
    } else if (message.action === 'relock') {
      WPB_STATE.setIsUnlocked(false);
      
      let unlockTimeout = WPB_STATE.getUnlockTimeout();
      if (unlockTimeout) clearTimeout(unlockTimeout);
      WPB_STATE.setUnlockTimeout(null);
      
      const currentSettings = WPB_STATE.getSettings();
      if (currentSettings.savedPin) {
        document.body.classList.add('wpb-locked');
      }
      sendResponse({ success: true });
      
    } else if (message.action === 'status') {
      sendResponse({ isUnlocked: WPB_STATE.getIsUnlocked() });
    }
  });
}

/**
 * Função de inicialização
 */
async function initialize() {
  const result = await chrome.storage.local.get([WPB_CONSTANTS.STORAGE_KEY, WPB_CONSTANTS.SETTINGS_KEY]);
  
  const savedCats = result[WPB_CONSTANTS.STORAGE_KEY];
  const defaults = {};
  for (const [key, config] of Object.entries(WPB_CONSTANTS.CATEGORIES)) {
    defaults[key] = config.defaultEnabled;
  }
  WPB_STATE.setCategoryState(savedCats ? { ...defaults, ...savedCats } : defaults);

  const savedSettings = result[WPB_CONSTANTS.SETTINGS_KEY];
  if (savedSettings) {
    const current = WPB_STATE.getSettings();
    WPB_STATE.setSettings({ ...current, ...savedSettings });
  }

  const currentSettings = WPB_STATE.getSettings();
  if (currentSettings.savedPin) {
    const waitForBody = () => {
      if (document.body) {
        document.body.classList.add('wpb-locked');
      } else {
        requestAnimationFrame(waitForBody);
      }
    };
    waitForBody();
  }

  applySettingsToRoot(currentSettings);
  WPB_DOM.applyFullState();
  WPB_DOM.startPolling();
  WPB_DOM.setupRootObserver();
  WPB_DOM.startPeriodicRescan();
  
  listenForStorageChanges();
  listenForRuntimeMessages();
}

initialize();
