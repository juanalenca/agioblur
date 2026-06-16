/**
 * @fileoverview Lógica de UI do Popup.
 */

/* global POPUP_CONSTANTS, POPUP_STATE */
'use strict';

// eslint-disable-next-line no-unused-vars
const POPUP_UI = (function() {
  const elements = {
    statusDot: document.getElementById('status-dot'),
    statusLabel: document.getElementById('status-label'),
    btnAllOn: document.getElementById('btn-all-on'),
    btnAllOff: document.getElementById('btn-all-off'),
    sliderBlur: document.getElementById('slider-blur'),
    blurLabel: document.getElementById('blur-value-label'),
    toggleSolid: document.getElementById('toggle-solid'),
    toggleFakeData: document.getElementById('toggle-fakedata'),
    inputPin: document.getElementById('input-pin'),
    btnPinAction: document.getElementById('btn-pin-action'),
    btnResetPin: document.getElementById('btn-reset-pin'),
    btnRelock: document.getElementById('btn-relock'),
    lockActionsRow: document.getElementById('lock-actions-row'),
    lockDescription: document.getElementById('lock-description'),
    lockBadge: document.getElementById('lock-badge'),
    overlayCategories: document.getElementById('overlay-categories'),
    overlayMode: document.getElementById('overlay-mode'),
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

  function updateSliderGradient() {
    const val = elements.sliderBlur.value;
    const min = elements.sliderBlur.min;
    const max = elements.sliderBlur.max;
    const pct = ((val - min) / (max - min)) * 100;
    elements.sliderBlur.style.background = `linear-gradient(90deg, #00a884 ${pct}%, #3b4a54 ${pct}%)`;
  }

  function updateStatus(state) {
    const activeCount = Object.values(state).filter(Boolean).length;
    const total = Object.keys(state).length;

    if (activeCount === 0) {
      elements.statusDot.classList.remove('active');
      elements.statusLabel.textContent = 'Proteção desativada';
    } else if (activeCount === total) {
      elements.statusDot.classList.add('active');
      elements.statusLabel.textContent = 'Proteção total ativa';
    } else {
      elements.statusDot.classList.add('active');
      elements.statusLabel.textContent = `${activeCount} de ${total} categorias ativas`;
    }
  }

  function applyLockState() {
    const currentSettings = POPUP_STATE.getSettings();
    const isSessionUnlocked = POPUP_STATE.getIsUnlocked();

    const hasPin = !!currentSettings.savedPin;
    const locked = hasPin && !isSessionUnlocked;

    elements.overlayCategories.classList.toggle('visible', locked);
    elements.overlayMode.classList.toggle('visible', locked);

    for (const key of Object.keys(POPUP_CONSTANTS.TOGGLE_IDS)) {
      getToggle(key).disabled = locked;
    }

    elements.btnAllOn.disabled = locked;
    elements.btnAllOff.disabled = locked;

    elements.sliderBlur.disabled = locked;
    elements.toggleSolid.disabled = locked;
    elements.toggleFakeData.disabled = locked;

    if (!hasPin) {
      elements.inputPin.style.display = 'block';
      elements.inputPin.placeholder = 'Definir novo PIN...';
      elements.btnPinAction.textContent = 'Salvar PIN';
      elements.btnPinAction.className = 'btn-lock primary';
      elements.btnPinAction.disabled = false;
      elements.btnPinAction.style.display = 'block';
      elements.lockDescription.textContent = 'Defina um PIN para impedir que terceiros desativem a proteção ou leiam conteúdos ao passar o mouse.';
      elements.lockBadge.textContent = 'Sem PIN';
      elements.lockBadge.className = 'lock-badge unlocked';
      elements.lockActionsRow.style.display = 'none';
    } else if (locked) {
      elements.inputPin.style.display = 'block';
      elements.inputPin.placeholder = 'Digitar PIN para desbloquear...';
      elements.btnPinAction.textContent = 'Desbloquear';
      elements.btnPinAction.className = 'btn-lock primary';
      elements.btnPinAction.disabled = false;
      elements.btnPinAction.style.display = 'block';
      elements.lockDescription.textContent = 'Um PIN está ativo. Desbloqueie para alterar configurações ou permitir leitura por hover (5 min).';
      elements.lockBadge.textContent = '🔒 Bloqueado';
      elements.lockBadge.className = 'lock-badge locked';
      elements.lockActionsRow.style.display = 'none';
    } else {
      elements.inputPin.style.display = 'none';
      elements.inputPin.value = '';
      elements.btnPinAction.disabled = true;
      elements.btnPinAction.style.display = 'none';
      elements.lockDescription.textContent = 'Sessão desbloqueada por 5 minutos. Você pode alterar as configurações ou visualizar mensagens passando o mouse.';
      elements.lockBadge.textContent = '🔓 Desbloqueado';
      elements.lockBadge.className = 'lock-badge unlocked';
      elements.lockActionsRow.style.display = 'flex';
    }
  }

  return {
    elements,
    getToggle,
    readUIState,
    updateSliderGradient,
    updateStatus,
    applyLockState
  };
})();
