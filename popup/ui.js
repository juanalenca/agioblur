/**
 * @fileoverview Lógica de UI do Popup (Atualizada para Redesign Premium).
 */

/* global POPUP_CONSTANTS, POPUP_STATE */
'use strict';

// eslint-disable-next-line no-unused-vars
const POPUP_UI = (function() {
  const elements = {
    btnAllOn: document.getElementById('btn-all-on'),
    btnAllOff: document.getElementById('btn-all-off'),
    sliderBlur: document.getElementById('slider-blur'),
    blurLabel: document.getElementById('blur-val'),
    toggleSolid: document.getElementById('toggle-solid'),
    toggleFakeData: document.getElementById('toggle-fake-data'),
    toggleAutoBlur: document.getElementById('toggle-auto-blur'),
    sliderAutoBlur: document.getElementById('slider-auto-blur'),
    autoBlurLabel: document.getElementById('auto-blur-val'),
    autoBlurContainer: document.getElementById('auto-blur-timer-container'),
    profileSelect: document.getElementById('profile-select'),
    
    // Setup initial
    pinSetupContainer: document.getElementById('pin-setup-container'),
    inputPin: document.getElementById('input-pin'),
    btnSavePin: document.getElementById('btn-save-pin'),
    
    // Active control
    pinActiveContainer: document.getElementById('pin-active-container'),
    btnRelock: document.getElementById('btn-relock'),
    btnRemovePin: document.getElementById('btn-remove-pin'),
    licensePlanBadge: document.getElementById('license-plan-badge'),
    licenseStatusText: document.getElementById('license-status-text'),
    licenseInput: document.getElementById('input-license-key'),
    btnActivateLicense: document.getElementById('btn-activate-license'),
    btnValidateLicense: document.getElementById('btn-validate-license'),
    btnUpgrade: document.getElementById('btn-upgrade'),
    btnResetDevices: document.getElementById('btn-reset-devices'),
    licenseMessage: document.getElementById('license-message'),
    planTabs: Array.from(document.querySelectorAll('[data-plan-tab]')),
    planPanels: Array.from(document.querySelectorAll('[data-plan-panel]')),
    
    // Overlay (bloqueado)
    overlay: document.getElementById('overlay'),
    inputPinOverlay: document.getElementById('input-pin-overlay'),
    btnPinOverlay: document.getElementById('btn-pin-overlay'),
    btnRemovePinOverlay: document.getElementById('btn-remove-pin-overlay'),
    btnFactoryReset: document.getElementById('btn-factory-reset'),
    lockStatusBadge: document.getElementById('lock-status-badge')
  };

  function getToggle(key) {
    return document.getElementById(POPUP_CONSTANTS.TOGGLE_IDS[key]);
  }

  function readUIState() {
    const state = {};
    for (const key of Object.keys(POPUP_CONSTANTS.TOGGLE_IDS)) {
      state[key] = getToggle(key).checked;
    }
    return state;
  }

  function getVisibleToggleKeys() {
    const activePanel = document.querySelector('.plan-panel.active');
    const ids = new Set(Array.from(activePanel?.querySelectorAll('input[type="checkbox"][id]') || []).map(input => input.id));
    return Object.entries(POPUP_CONSTANTS.TOGGLE_IDS)
      .filter(([, id]) => ids.has(id))
      .map(([key]) => key);
  }

  function isFeatureAllowed(featureKey) {
    return POPUP_CONSTANTS.FEATURE_TIERS[featureKey] !== 'PRO' || POPUP_STATE.getIsPremium();
  }

  function getMessage(key, fallback = '') {
    return chrome.i18n.getMessage(key) || fallback;
  }

  function renderPremiumState() {
    const status = POPUP_STATE.getLicenseStatus();
    const isPremium = !!status.isPremium;

    elements.licensePlanBadge.textContent = isPremium ? 'PRO' : 'FREE';
    elements.licensePlanBadge.classList.toggle('premium', isPremium);
    elements.licenseStatusText.textContent = isPremium
      ? getMessage('licenseStatusPro', 'Licença ativa. Recursos Pro liberados.')
      : getMessage('licenseStatusFree', 'Plano gratuito ativo. Recursos Pro bloqueados.');
    elements.btnResetDevices.style.display = status.error === 'DEVICE_LIMIT_EXCEEDED' ? 'block' : 'none';

    for (const [feature, tier] of Object.entries(POPUP_CONSTANTS.FEATURE_TIERS)) {
      const toggle = getToggle(feature);
      const row = toggle?.closest('.cat-row') || document.querySelector(`[data-feature-row="${feature}"]`);
      if (!row || tier !== 'PRO') continue;

      row.classList.toggle('premium-locked', !isPremium);
      if (toggle) {
        toggle.disabled = !isPremium;
        if (!isPremium) toggle.checked = false;
      }

      if (!row.querySelector('.pro-badge')) {
        const badge = document.createElement('span');
        badge.className = 'pro-badge';
        badge.textContent = 'PRO';
        row.querySelector('.cat-info')?.appendChild(badge);
      }
    }

    const proControls = [
      elements.toggleAutoBlur,
      elements.sliderAutoBlur,
      elements.profileSelect,
      elements.sliderBlur,
      elements.toggleFakeData,
      elements.inputPin,
      elements.btnSavePin
    ];
    for (const control of proControls) {
      if (control) control.disabled = !isPremium;
    }

    if (!isPremium) {
      elements.toggleFakeData.checked = false;
      if (elements.toggleAutoBlur) elements.toggleAutoBlur.checked = false;
      if (elements.sliderAutoBlur) {
        elements.sliderAutoBlur.value = POPUP_CONSTANTS.DEFAULTS_SETTINGS.autoBlurTimer;
        if (elements.autoBlurLabel) elements.autoBlurLabel.textContent = POPUP_CONSTANTS.DEFAULTS_SETTINGS.autoBlurTimer + 'm';
      }
      elements.sliderBlur.value = POPUP_CONSTANTS.DEFAULTS_SETTINGS.blurIntensity;
      elements.blurLabel.textContent = POPUP_CONSTANTS.DEFAULTS_SETTINGS.blurIntensity + 'px';
    }

    const pinSettings = document.getElementById('pin-settings');
    const blurRow = document.querySelector('[data-feature-row="blurIntensity"]');
    const fakeDataRow = document.querySelector('[data-feature-row="fakeData"]');
    if (pinSettings) pinSettings.classList.toggle('premium-locked', !isPremium);
    if (blurRow) blurRow.classList.toggle('premium-locked', !isPremium);
    if (fakeDataRow) fakeDataRow.classList.toggle('premium-locked', !isPremium);
    const autoBlurRow = document.querySelector('[data-feature-row="autoBlur"]');
    if (autoBlurRow) autoBlurRow.classList.toggle('premium-locked', !isPremium);
    const autoBlurTimerRow = document.querySelector('[data-feature-row="autoBlurTimer"]');
    if (autoBlurTimerRow) autoBlurTimerRow.classList.toggle('premium-locked', !isPremium);
  }

  function showLicenseMessage(message, type = 'neutral') {
    elements.licenseMessage.textContent = message;
    elements.licenseMessage.className = `license-message ${type}`;
  }

  function setActivePlanTab(plan) {
    for (const tab of elements.planTabs) {
      const active = tab.dataset.planTab === plan;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    }

    for (const panel of elements.planPanels) {
      const active = panel.dataset.planPanel === plan;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    }
  }



  function applyLockState() {
    const currentSettings = POPUP_STATE.getSettings();
    const isSessionUnlocked = POPUP_STATE.getIsUnlocked();

    const hasPin = POPUP_STATE.getIsPremium() && !!currentSettings.savedPin;
    const locked = hasPin && !isSessionUnlocked;

    // Se estiver bloqueado, mostra o overlay gigante na frente de tudo
    if (locked) {
      document.body.style.overflow = 'hidden';
      elements.overlay.classList.add('active');
      elements.pinSetupContainer.style.display = 'none';
      elements.pinActiveContainer.style.display = 'none';
      
      elements.inputPinOverlay.value = '';
    } else {
      document.body.style.overflow = '';
      elements.overlay.classList.remove('active');
      
      if (hasPin) {
        // Desbloqueado temporariamente
        elements.pinSetupContainer.style.display = 'none';
        elements.pinActiveContainer.style.display = 'block';
      } else {
        // Sem PIN
        elements.pinSetupContainer.style.display = 'block';
        elements.pinActiveContainer.style.display = 'none';
        elements.inputPin.value = '';
      }
    }
  }

  function localizeUI() {
    const elementsWithI18n = document.querySelectorAll('[data-i18n]');
    elementsWithI18n.forEach(el => {
      const msg = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
      if (msg) el.textContent = msg;
    });

    const elementsWithPlaceholder = document.querySelectorAll('[data-i18n-placeholder]');
    elementsWithPlaceholder.forEach(el => {
      const msg = chrome.i18n.getMessage(el.getAttribute('data-i18n-placeholder'));
      if (msg) el.placeholder = msg;
    });

    const lang = chrome.i18n.getUILanguage();
    if (lang && lang.startsWith('ar')) {
      document.body.classList.add('popup-arabic');
    }
  }

  return {
    elements,
    getToggle,
    readUIState,
    getVisibleToggleKeys,
    isFeatureAllowed,
    getMessage,
    renderPremiumState,
    showLicenseMessage,
    setActivePlanTab,
    applyLockState,
    localizeUI
  };
})();
