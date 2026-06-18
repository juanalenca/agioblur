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
    
    // Setup initial
    pinSetupContainer: document.getElementById('pin-setup-container'),
    inputPin: document.getElementById('input-pin'),
    btnSavePin: document.getElementById('btn-save-pin'),
    
    // Active control
    pinActiveContainer: document.getElementById('pin-active-container'),
    btnRelock: document.getElementById('btn-relock'),
    btnRemovePin: document.getElementById('btn-remove-pin'),
    
    // Overlay (bloqueado)
    overlay: document.getElementById('overlay'),
    inputPinOverlay: document.getElementById('input-pin-overlay'),
    btnPinOverlay: document.getElementById('btn-pin-overlay'),
    btnRemovePinOverlay: document.getElementById('btn-remove-pin-overlay'),
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



  function applyLockState() {
    const currentSettings = POPUP_STATE.getSettings();
    const isSessionUnlocked = POPUP_STATE.getIsUnlocked();

    const hasPin = !!currentSettings.savedPin;
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

  return {
    elements,
    getToggle,
    readUIState,
    applyLockState
  };
})();
