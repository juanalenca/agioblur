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
  if (POPUP_STATE.getIsPremium() && settings.savedPin && !unlocked) return;

  const feature = Object.entries(POPUP_CONSTANTS.TOGGLE_IDS).find(([, id]) => id === this.id)?.[0];
  if (feature && !POPUP_UI.isFeatureAllowed(feature)) {
    this.checked = false;
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgProFeatureLocked', 'Recurso Pro. Ative uma licença para liberar.'), 'warning');
    return;
  }

  const state = POPUP_UI.readUIState();
  await POPUP_STORAGE.saveState(state);
}

async function onSettingsChange(e) {
  const settings = POPUP_STATE.getSettings();
  const unlocked = POPUP_STATE.getIsUnlocked();
  if (POPUP_STATE.getIsPremium() && settings.savedPin && !unlocked) return;
  if (!POPUP_STATE.getIsPremium() && (e?.target === POPUP_UI.elements.sliderBlur || e?.target === POPUP_UI.elements.toggleFakeData)) {
    POPUP_UI.renderPremiumState();
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgProSettingLocked', 'Configuração Pro. Ative uma licença para liberar.'), 'warning');
    return;
  }

  const newSettings = {
    ...settings,
    blurIntensity: POPUP_STATE.getIsPremium() ? parseInt(POPUP_UI.elements.sliderBlur.value, 10) : 8,
    solidMode: POPUP_UI.elements.toggleSolid.checked,
    fakeData: POPUP_STATE.getIsPremium() && POPUP_UI.elements.toggleFakeData.checked,
    autoBlurEnabled: POPUP_STATE.getIsPremium() && (POPUP_UI.elements.toggleAutoBlur ? POPUP_UI.elements.toggleAutoBlur.checked : false),
    autoBlurTimer: POPUP_STATE.getIsPremium() && POPUP_UI.elements.sliderAutoBlur ? parseInt(POPUP_UI.elements.sliderAutoBlur.value, 10) : 5,
  };
  
  POPUP_UI.elements.blurLabel.textContent = newSettings.blurIntensity + 'px';
  if (POPUP_UI.elements.autoBlurLabel && POPUP_UI.elements.sliderAutoBlur) {
    POPUP_UI.elements.autoBlurLabel.textContent = newSettings.autoBlurTimer + 'm';
  }
  if (POPUP_UI.elements.autoBlurContainer) {
    POPUP_UI.elements.autoBlurContainer.style.display = newSettings.autoBlurEnabled ? 'flex' : 'none';
  }
  await POPUP_STORAGE.saveSettings(newSettings);
}

async function setAll(value) {
  const settings = POPUP_STATE.getSettings();
  const unlocked = POPUP_STATE.getIsUnlocked();
  if (POPUP_STATE.getIsPremium() && settings.savedPin && !unlocked) return;

  for (const key of POPUP_UI.getVisibleToggleKeys()) {
    POPUP_UI.getToggle(key).checked = value && POPUP_UI.isFeatureAllowed(key);
  }
  const state = POPUP_UI.readUIState();
  await POPUP_STORAGE.saveState(state);

  const activePanel = document.querySelector('.plan-panel.active');
  if (activePanel?.contains(POPUP_UI.elements.toggleSolid)) {
    POPUP_UI.elements.toggleSolid.checked = value;
    await onSettingsChange({ target: POPUP_UI.elements.toggleSolid });
  }
}

async function handleSavePin() {
  if (!POPUP_STATE.getIsPremium()) {
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgPinProOnly', 'PIN é um recurso Pro.'), 'warning');
    return;
  }

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

async function handleActivateLicense() {
  const key = POPUP_UI.elements.licenseInput.value.trim();
  if (!key) {
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgEnterLicenseKey', 'Digite uma chave de licença.'), 'warning');
    return;
  }

  POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgValidatingLicense', 'Validando licença...'), 'neutral');
  const result = await chrome.runtime.sendMessage({ action: 'license:activate', licenseKey: key });
  POPUP_STATE.setLicenseStatus(result.status);
  POPUP_UI.renderPremiumState();

  if (result.ok) {
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgLicenseActivated', 'Licença ativada com sucesso.'), 'success');
    await POPUP_STORAGE.loadAndSync();
  } else if (result.error === 'DEVICE_LIMIT_EXCEEDED') {
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgDeviceLimit', 'Limite de dispositivos atingido. Solicite reset por e-mail.'), 'warning');
  } else {
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgLicenseActivationFailed', 'Não foi possível ativar essa licença.'), 'danger');
  }
}

async function handleValidateLicense() {
  POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgRefreshingLicense', 'Atualizando status...'), 'neutral');
  const result = await chrome.runtime.sendMessage({ action: 'license:validateNow' });
  POPUP_STATE.setLicenseStatus(result.status);
  POPUP_UI.renderPremiumState();
  POPUP_UI.showLicenseMessage(
    result.status?.isPremium
      ? POPUP_UI.getMessage('msgLicenseProActive', 'Licença Pro ativa.')
      : POPUP_UI.getMessage('msgLicenseFreeActive', 'Plano Free ativo.'),
    result.status?.isPremium ? 'success' : 'neutral'
  );
}

async function handleRequestDeviceReset() {
  const key = POPUP_UI.elements.licenseInput.value.trim();
  if (!key) {
    POPUP_UI.showLicenseMessage(POPUP_UI.getMessage('msgEnterKeyForReset', 'Digite a chave para solicitar o reset.'), 'warning');
    return;
  }

  const result = await chrome.runtime.sendMessage({ action: 'license:requestDeviceReset', licenseKey: key });
  POPUP_UI.showLicenseMessage(
    result.ok
      ? POPUP_UI.getMessage('msgResetEmailSent', 'E-mail de confirmação enviado.')
      : POPUP_UI.getMessage('msgResetFailed', 'Não foi possível solicitar o reset.'),
    result.ok ? 'success' : 'danger'
  );
}

function handleUpgrade() {
  chrome.tabs.create({ url: POPUP_CONSTANTS.UPGRADE_URL });
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
      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateOptions' }, () => {
            if (chrome.runtime.lastError) { /* ignore */ }
          });
        });
      });
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
  if (POPUP_UI.elements.toggleAutoBlur) POPUP_UI.elements.toggleAutoBlur.addEventListener('change', onSettingsChange);
  if (POPUP_UI.elements.sliderAutoBlur) POPUP_UI.elements.sliderAutoBlur.addEventListener('input', onSettingsChange);
  
  if (POPUP_UI.elements.profileSelect) {
    POPUP_UI.elements.profileSelect.addEventListener('change', async (e) => {
      const val = e.target.value;
      if (val === 'custom') return;
      
      const unlocked = POPUP_STATE.getIsUnlocked();
      if (POPUP_STATE.getIsPremium() && POPUP_STATE.getSettings().savedPin && !unlocked) return;

      const base = {
        photos: false, names: false, messages: false, media: false, compose: false,
        piiCpf: false, piiEmail: false, piiCard: false, piiPhone: false, piiPix: false
      };
      
      let target = { ...base };
      if (val === 'office') {
        target = { photos: true, names: true, messages: true, media: true, compose: true, piiCpf: true, piiEmail: true, piiCard: true, piiPhone: true, piiPix: true };
      } else if (val === 'presentation') {
        target = { photos: true, names: true, messages: true, media: true, compose: true, piiCpf: false, piiEmail: false, piiCard: false, piiPhone: false, piiPix: false };
      } else if (val === 'personal') {
        target = { ...base, photos: true, media: true };
      }

      // Filter by permissions
      const finalTarget = {};
      for (const [k, v] of Object.entries(target)) {
        finalTarget[k] = v && POPUP_UI.isFeatureAllowed(k);
      }
      
      await POPUP_STORAGE.saveState(finalTarget);
      
      POPUP_UI.elements.profileSelect.value = 'custom';
    });
  }
  POPUP_UI.elements.toggleSolid.addEventListener('change', onSettingsChange);
  POPUP_UI.elements.toggleFakeData.addEventListener('change', onSettingsChange);
  POPUP_UI.elements.btnActivateLicense.addEventListener('click', handleActivateLicense);
  POPUP_UI.elements.btnValidateLicense.addEventListener('click', handleValidateLicense);
  POPUP_UI.elements.btnUpgrade.addEventListener('click', handleUpgrade);
  POPUP_UI.elements.btnResetDevices.addEventListener('click', handleRequestDeviceReset);
  POPUP_UI.elements.planTabs.forEach((tab) => {
    tab.addEventListener('click', () => POPUP_UI.setActivePlanTab(tab.dataset.planTab));
  });

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
