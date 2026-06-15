/**
 * WhatsApp Privacy Blur — Popup Script v2.1
 *
 * Gerencia categorias, configurações avançadas e bloqueio por PIN.
 * Quando um PIN está salvo e não desbloqueado, TODOS os controles
 * (toggles, botões, slider, checkboxes) ficam desabilitados e cobertos
 * por um overlay visual. Somente o campo de PIN permanece acessível.
 */

'use strict';

const STORAGE_KEY = 'wpbCategories';
const SETTINGS_KEY = 'wpbSettings';

const TOGGLE_IDS = {
  photos: 'toggle-photos',
  names: 'toggle-names',
  messages: 'toggle-messages',
  media: 'toggle-media',
  compose: 'toggle-compose',
};

const DEFAULTS_CATEGORIES = {
  photos: true,
  names: false,
  messages: true,
  media: true,
  compose: true,
};

const DEFAULTS_SETTINGS = {
  blurIntensity: 8,
  solidMode: false,
  fakeData: false,
  savedPin: '',
};

/* ==========================================================================
   Referências de UI
   ========================================================================== */

const ui = {
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
  lockDescription: document.getElementById('lock-description'),
  lockBadge: document.getElementById('lock-badge'),
  overlayCategories: document.getElementById('overlay-categories'),
  overlayMode: document.getElementById('overlay-mode'),
};

let currentSettings = { ...DEFAULTS_SETTINGS };
let isSessionUnlocked = false;

/* ==========================================================================
   Helpers
   ========================================================================== */

function getToggle(key) {
  return document.getElementById(TOGGLE_IDS[key]);
}

function readUIState() {
  const state = {};
  for (const key of Object.keys(TOGGLE_IDS)) {
    state[key] = getToggle(key).checked;
  }
  return state;
}

function updateSliderGradient() {
  const val = ui.sliderBlur.value;
  const min = ui.sliderBlur.min;
  const max = ui.sliderBlur.max;
  const pct = ((val - min) / (max - min)) * 100;
  ui.sliderBlur.style.background = `linear-gradient(90deg, #00a884 ${pct}%, #3b4a54 ${pct}%)`;
}

/* ==========================================================================
   Status
   ========================================================================== */

function updateStatus(state) {
  const activeCount = Object.values(state).filter(Boolean).length;
  const total = Object.keys(state).length;

  if (activeCount === 0) {
    ui.statusDot.classList.remove('active');
    ui.statusLabel.textContent = 'Proteção desativada';
  } else if (activeCount === total) {
    ui.statusDot.classList.add('active');
    ui.statusLabel.textContent = 'Proteção total ativa';
  } else {
    ui.statusDot.classList.add('active');
    ui.statusLabel.textContent = `${activeCount} de ${total} categorias ativas`;
  }
}

/* ==========================================================================
   Bloqueio por PIN — Estado visual do popup
   ========================================================================== */

/**
 * Quando um PIN existe e a sessão NÃO está desbloqueada,
 * desabilitamos TODOS os controles (toggles, slider, checkboxes, botões)
 * e exibimos os overlays visuais sobre as seções de categorias e modo.
 */
function applyLockState() {
  const hasPin = !!currentSettings.savedPin;
  const locked = hasPin && !isSessionUnlocked;

  // Overlays visuais
  ui.overlayCategories.classList.toggle('visible', locked);
  ui.overlayMode.classList.toggle('visible', locked);

  // Toggles de categoria
  for (const key of Object.keys(TOGGLE_IDS)) {
    getToggle(key).disabled = locked;
  }

  // Botões rápidos
  ui.btnAllOn.disabled = locked;
  ui.btnAllOff.disabled = locked;

  // Slider + checkboxes avançados
  ui.sliderBlur.disabled = locked;
  ui.toggleSolid.disabled = locked;
  ui.toggleFakeData.disabled = locked;

  // Atualizar a seção de PIN
  if (!hasPin) {
    // Sem PIN definido
    ui.inputPin.placeholder = 'Definir novo PIN...';
    ui.btnPinAction.textContent = 'Salvar PIN';
    ui.btnPinAction.className = 'btn-lock primary';
    ui.lockDescription.textContent = 'Defina um PIN para impedir que terceiros desativem a proteção ou leiam conteúdos ao passar o mouse.';
    ui.lockBadge.textContent = 'Sem PIN';
    ui.lockBadge.className = 'lock-badge unlocked';
    ui.btnResetPin.style.display = 'none';
  } else if (locked) {
    // PIN definido, bloqueado
    ui.inputPin.placeholder = 'Digitar PIN para desbloquear...';
    ui.btnPinAction.textContent = 'Desbloquear';
    ui.btnPinAction.className = 'btn-lock primary';
    ui.lockDescription.textContent = 'Um PIN está ativo. Desbloqueie para alterar configurações ou permitir leitura por hover (5 min).';
    ui.lockBadge.textContent = '🔒 Bloqueado';
    ui.lockBadge.className = 'lock-badge locked';
    ui.btnResetPin.style.display = 'none';
  } else {
    // PIN definido, desbloqueado
    ui.inputPin.placeholder = 'Sessão desbloqueada';
    ui.inputPin.value = '';
    ui.btnPinAction.textContent = '✓ Desbloqueado';
    ui.btnPinAction.className = 'btn-lock primary';
    ui.btnPinAction.disabled = true;
    ui.lockDescription.textContent = 'Sessão desbloqueada temporariamente. Você pode alterar as configurações normalmente.';
    ui.lockBadge.textContent = '🔓 Desbloqueado';
    ui.lockBadge.className = 'lock-badge unlocked';
    ui.btnResetPin.style.display = 'block';
  }
}

/* ==========================================================================
   Persistência
   ========================================================================== */

async function saveState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: state }, resolve);
  });
}

async function saveSettings(settings) {
  currentSettings = settings;
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, resolve);
  });
}

async function loadAndSync() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY, SETTINGS_KEY], (result) => {
      // Categorias
      const savedCats = result[STORAGE_KEY];
      const state = savedCats ? { ...DEFAULTS_CATEGORIES, ...savedCats } : { ...DEFAULTS_CATEGORIES };
      for (const [key, checked] of Object.entries(state)) {
        const toggle = getToggle(key);
        if (toggle) toggle.checked = checked;
      }
      updateStatus(state);

      // Configurações
      const savedSettings = result[SETTINGS_KEY];
      currentSettings = savedSettings ? { ...DEFAULTS_SETTINGS, ...savedSettings } : { ...DEFAULTS_SETTINGS };

      ui.sliderBlur.value = currentSettings.blurIntensity;
      ui.blurLabel.textContent = currentSettings.blurIntensity + 'px';
      ui.toggleSolid.checked = currentSettings.solidMode;
      ui.toggleFakeData.checked = currentSettings.fakeData;
      updateSliderGradient();

      // Lock
      isSessionUnlocked = false;
      applyLockState();

      resolve();
    });
  });
}

/* ==========================================================================
   Handlers
   ========================================================================== */

async function onToggleChange() {
  if (currentSettings.savedPin && !isSessionUnlocked) return;
  const state = readUIState();
  updateStatus(state);
  await saveState(state);
}

async function onSettingsChange() {
  if (currentSettings.savedPin && !isSessionUnlocked) return;
  const newSettings = {
    ...currentSettings,
    blurIntensity: parseInt(ui.sliderBlur.value, 10),
    solidMode: ui.toggleSolid.checked,
    fakeData: ui.toggleFakeData.checked,
  };
  ui.blurLabel.textContent = newSettings.blurIntensity + 'px';
  updateSliderGradient();
  await saveSettings(newSettings);
}

async function setAll(value) {
  if (currentSettings.savedPin && !isSessionUnlocked) return;
  for (const key of Object.keys(TOGGLE_IDS)) {
    getToggle(key).checked = value;
  }
  const state = readUIState();
  updateStatus(state);
  await saveState(state);
}

async function handlePinAction() {
  const pin = ui.inputPin.value.trim();
  if (!pin) return;

  // Caso 1: Nenhum PIN salvo → Salvar novo PIN
  if (!currentSettings.savedPin) {
    if (pin.length < 3) {
      alert('O PIN deve ter pelo menos 3 caracteres.');
      return;
    }
    const newSettings = { ...currentSettings, savedPin: pin };
    await saveSettings(newSettings);
    ui.inputPin.value = '';
    isSessionUnlocked = false;
    applyLockState();
    return;
  }

  // Caso 2: PIN existe, sessão bloqueada → Tentar desbloquear
  if (!isSessionUnlocked) {
    if (pin === currentSettings.savedPin) {
      isSessionUnlocked = true;
      ui.inputPin.value = '';
      applyLockState();

      // Enviar unlock para o content script (hover por 5 min)
      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action: 'unlock', duration: 5 * 60 * 1000 }, () => {
            if (chrome.runtime.lastError) { /* tab fechada, ok */ }
          });
        });
      });
    } else {
      alert('PIN incorreto!');
      ui.inputPin.value = '';
    }
  }
}

async function handleResetPin() {
  if (!isSessionUnlocked) return;
  const newSettings = { ...currentSettings, savedPin: '' };
  await saveSettings(newSettings);
  isSessionUnlocked = false;
  applyLockState();
}

/* ==========================================================================
   Event Listeners
   ========================================================================== */

for (const key of Object.keys(TOGGLE_IDS)) {
  getToggle(key).addEventListener('change', onToggleChange);
}

ui.btnAllOn.addEventListener('click', () => setAll(true));
ui.btnAllOff.addEventListener('click', () => setAll(false));

ui.sliderBlur.addEventListener('input', onSettingsChange);
ui.toggleSolid.addEventListener('change', onSettingsChange);
ui.toggleFakeData.addEventListener('change', onSettingsChange);

ui.btnPinAction.addEventListener('click', handlePinAction);
ui.inputPin.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handlePinAction();
});
ui.btnResetPin.addEventListener('click', handleResetPin);

/* ==========================================================================
   Init
   ========================================================================== */

loadAndSync();
