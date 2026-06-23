/**
 * @fileoverview Ponto de entrada do Content Script e listeners de mensagens.
 */

/* global WPB_CONSTANTS, WPB_STATE, WPB_DOM, WPB_PII */
'use strict';

let appliedFakeData = false;

function toggleDocumentClass(className, enabled) {
  document.documentElement.classList.toggle(className, enabled);
  if (document.body) {
    document.body.classList.toggle(className, enabled);
  }
}

/**
 * Aplica as configurações globais de estilo (blur, modo dark) na raiz
 * @param {Object} settings 
 */

function applyFullScreenBlur(isActive) {
  let overlay = document.getElementById('wpb-full-screen-overlay');
  if (isActive) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'wpb-full-screen-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = '2147483647'; // max z-index
      overlay.style.backdropFilter = 'blur(15px)';
      overlay.style.background = 'rgba(0, 0, 0, 0.4)';
      overlay.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
  } else {
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 300);
    }
  }
}

function applySettingsToRoot(settings) {
  const root = document.documentElement;
  const premium = WPB_STATE.getIsPremium();
  const effectiveBlur = premium ? settings.blurIntensity : 8;
  const effectiveFakeData = premium && settings.fakeData;
  const effectiveSolidMode = settings.solidMode;
  
  // Intensidade
  root.style.setProperty('--wpb-blur', effectiveBlur + 'px');
  root.style.setProperty('--wpb-blur-heavy', (effectiveBlur + 4) + 'px');

  // Tarja Preta
  toggleDocumentClass('wpb-solid-mode', effectiveSolidMode);

  // Ao mudar Fake Data, disparamos um re-scan total
  if (effectiveFakeData !== appliedFakeData) {
    appliedFakeData = effectiveFakeData;
    if (!effectiveFakeData) {
      WPB_DOM.revertAllFakeContent();         // reversão depois
    }
    WPB_DOM.applyFullState();
  }
}

async function refreshPremiumStatus() {
  try {
    const status = await chrome.runtime.sendMessage({ action: 'license:getStatus' });
    WPB_STATE.setIsPremium(!!status?.isPremium);
  } catch {
    WPB_STATE.setIsPremium(false);
  }
}

function applyPremiumStatus(isPremium) {
  WPB_STATE.setIsPremium(!!isPremium);

  if (!isPremium) {
    WPB_DOM.revertAllFakeContent();
    WPB_DOM.clearPremiumFeatures();
    if (document.body) document.body.classList.remove('wpb-locked');
  }

  applySettingsToRoot(WPB_STATE.getSettings());
  WPB_DOM.applyFullState();
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
      
      // Restart the auto-blur timer with the new settings
      window.dispatchEvent(new Event('wpb-settings-updated'));
    }

    if (changes[WPB_CONSTANTS.STORAGE_KEY]) {
      const newState = changes[WPB_CONSTANTS.STORAGE_KEY].newValue || {};
      const oldState = { ...WPB_STATE.getCategoryState() };
      
      const defaults = {};
      for (const [key, config] of Object.entries(WPB_CONSTANTS.CATEGORIES)) {
        defaults[key] = config.defaultEnabled;
      }
      for (const [key, config] of Object.entries(WPB_CONSTANTS.PII_CATEGORIES)) {
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
      let piiChanged = false;
      for (const key of Object.keys(WPB_CONSTANTS.PII_CATEGORIES)) {
        const wasActive = oldState[key];
        const isActive = incoming[key];
        if (wasActive !== isActive) piiChanged = true;
      }

      for (const key of Object.keys(WPB_CONSTANTS.CATEGORIES)) {
        const wasActive = oldState[key];
        const isActive = incoming[key];
        if (wasActive && !isActive) WPB_DOM.clearCategory(key);
        else if (!wasActive && isActive) WPB_DOM.scanAndApply(document);
      }
      
      applyFullScreenBlur(incoming.fullScreenBlur);
      window.dispatchEvent(new Event('wpb-settings-updated'));

      if (piiChanged && typeof WPB_PII !== 'undefined' && WPB_STATE.getIsPremium()) {
        WPB_PII.restore(document.body);
        WPB_PII.scan(document.body);
      } else if (piiChanged && typeof WPB_PII !== 'undefined') {
        WPB_PII.restore(document.body);
      }
    }

    if (changes.license_is_premium) {
      applyPremiumStatus(!!changes.license_is_premium.newValue);
    }
  });
}

let inactivityTimer = null;
let savedStateBeforeInactivity = null;
let isCurrentlyAutoBlurred = false;

function setupInactivityListener() {
  const resetTimer = (e) => {
    const settings = WPB_STATE.getSettings();
    if (!settings.autoBlurEnabled || !WPB_STATE.getIsPremium()) {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      return;
    }

    if (e && !e.isTrusted && e.type !== 'wpb-settings-updated') return;

    if (e && e.type === 'mousemove') {
      if (typeof window.lastMouseX !== 'undefined') {
        const dx = Math.abs(e.clientX - window.lastMouseX);
        const dy = Math.abs(e.clientY - window.lastMouseY);
        if (dx < 5 && dy < 5) return; // Ignore tiny drift
      }
      window.lastMouseX = e.clientX;
      window.lastMouseY = e.clientY;
    }

    if (isCurrentlyAutoBlurred) {
      if (document.visibilityState === 'hidden') return;
      isCurrentlyAutoBlurred = false;
      applyFullScreenBlur(WPB_STATE.getCategoryState().fullScreenBlur);
    }

    if (inactivityTimer) clearTimeout(inactivityTimer);
    const minutes = parseInt(settings.autoBlurTimer, 10) || 5;
    inactivityTimer = setTimeout(triggerAutoBlur, minutes * 60 * 1000);
  };

  const triggerAutoBlur = () => {
    isCurrentlyAutoBlurred = true;
    applyFullScreenBlur(true);
  };

  const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'wpb-settings-updated'];
  events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
  
  // Initial setup
  resetTimer();
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
    } else if (message.action === 'license:statusChanged') {
      applyPremiumStatus(!!message.status?.isPremium);
      sendResponse({ success: true });
    } else if (message.action === 'updateOptions') {
      chrome.storage.local.get([WPB_CONSTANTS.STORAGE_KEY, WPB_CONSTANTS.SETTINGS_KEY], (result) => {
        const savedCats = result[WPB_CONSTANTS.STORAGE_KEY];
        const defaults = {};
        for (const [key, config] of Object.entries(WPB_CONSTANTS.CATEGORIES)) {
          defaults[key] = config.defaultEnabled;
        }
        for (const [key, config] of Object.entries(WPB_CONSTANTS.PII_CATEGORIES)) {
          defaults[key] = config.defaultEnabled;
        }
        WPB_STATE.setCategoryState(savedCats ? { ...defaults, ...savedCats } : defaults);

        // Captura fakeData ANTES de aplicar as novas settings
        const previousFakeData = WPB_STATE.getSettings().fakeData;

        const savedSettings = result[WPB_CONSTANTS.SETTINGS_KEY];
        if (savedSettings) {
          const current = WPB_STATE.getSettings();
          WPB_STATE.setSettings({ ...current, ...savedSettings });
        }

        const currentSettings = WPB_STATE.getSettings();

        // Reverte manualmente se fakeData foi desligado — applySettingsToRoot
        // não detecta mais a mudança porque o estado já foi atualizado acima.
        if (previousFakeData && (!currentSettings.fakeData || !WPB_STATE.getIsPremium())) {
          WPB_DOM.revertAllFakeContent();
        }

        if (!currentSettings.savedPin) {
          document.body.classList.remove('wpb-locked');
          WPB_STATE.setIsUnlocked(false);
        }

        applySettingsToRoot(currentSettings);
        WPB_DOM.applyFullState();
        if (typeof WPB_PII !== 'undefined' && WPB_STATE.getIsPremium()) {
          WPB_PII.restore(document.body);
          WPB_PII.scan(document.body);
        } else if (typeof WPB_PII !== 'undefined') {
          WPB_PII.restore(document.body);
        }
      });
      sendResponse({ success: true });
    }
  });
}

/**
 * Função de inicialização
 */
async function initialize() {
  await refreshPremiumStatus();
  const result = await chrome.storage.local.get([WPB_CONSTANTS.STORAGE_KEY, WPB_CONSTANTS.SETTINGS_KEY]);
  
  const savedCats = result[WPB_CONSTANTS.STORAGE_KEY];
  const defaults = {};
  for (const [key, config] of Object.entries(WPB_CONSTANTS.CATEGORIES)) {
    defaults[key] = config.defaultEnabled;
  }
  for (const [key, config] of Object.entries(WPB_CONSTANTS.PII_CATEGORIES)) {
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

  // Observer do WhatsApp
  WPB_DOM.initObserver();
  applyFullScreenBlur(WPB_STATE.getCategoryState().fullScreenBlur);
  setupInactivityListener();
}

initialize();
