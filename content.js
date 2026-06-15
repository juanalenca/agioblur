/**
 * WhatsApp Privacy Blur — Content Script
 *
 * Atualizado com suporte a:
 * - Ajuste dinâmico de intensidade e modo tarja preta
 * - Bloqueio de rascunhos (compose)
 * - Modo Fake Data
 * - Bloqueio de :hover com senha
 */

'use strict';

/* ==========================================================================
   Constantes
   ========================================================================== */

const STORAGE_KEY = 'wpbCategories';
const SETTINGS_KEY = 'wpbSettings';

const CATEGORIES = {
  photos: {
    cssClass: 'wpb-blur-photo',
    defaultEnabled: true,
    selectors: [
      '#pane-side img[draggable="false"]',
      '[role="listitem"] img[draggable="false"]',
      '[role="row"] img[draggable="false"]',
      '[data-testid="cell-frame-container"] img',
      'header img[draggable="false"]',
      '[data-testid="chat-info-drawer"] img',
    ],
  },
  names: {
    cssClass: 'wpb-blur-name',
    defaultEnabled: false,
    selectors: [
      '[data-testid="cell-frame-title"] span[title]',
      '[data-testid="cell-frame-title"] span',
      '#pane-side [role="listitem"] span[title]:not([title=""])',
      '#pane-side [role="row"] span[title]:not([title=""])',
      '#pane-side span[title]:not([title=""])',
      'header span[title]:not([title=""])',
      '[data-testid="chat-info-drawer"] span[title]:not([title=""])',
    ],
  },
  messages: {
    cssClass: 'wpb-blur-msg',
    defaultEnabled: true,
    selectors: [
      '[data-testid="cell-frame-secondary"] span[dir]',
      '[data-testid="cell-frame-secondary"] span',
      '#pane-side [role="listitem"] span[dir="ltr"]',
      '#pane-side [role="row"] span[dir="ltr"]',
      '#pane-side span[dir="ltr"]',
      '[data-testid="conversation-panel-body"] .selectable-text',
      '[data-testid="msg-container"] .selectable-text',
      '[role="row"] .selectable-text',
      '[role="row"] .copyable-text span',
      '[role="row"] [data-pre-plain-text] span[dir]',
      '.message-in .selectable-text',
      '.message-out .selectable-text',
      '.message-in .copyable-text span',
      '.message-out .copyable-text span',
    ],
  },
  media: {
    cssClass: 'wpb-blur-media',
    defaultEnabled: true,
    selectors: [
      '[data-testid="media-canvas"] img',
      '[data-testid="image-thumb"] img',
      '[data-testid="msg-container"] img[src*="blob:"]',
      '[data-testid="msg-container"] video',
      '.message-in img[src*="blob:"]',
      '.message-out img[src*="blob:"]',
      '.message-in video',
      '.message-out video',
      '[role="row"] img[src*="blob:"]',
      '[role="row"] video',
    ],
  },
  compose: {
    cssClass: 'wpb-blur-compose',
    defaultEnabled: true,
    selectors: [
      '[data-testid="conversation-compose-box-input"]',
      '#main footer [contenteditable="true"]',
      '[title="Mensagem"]',
      '[title="Digite uma mensagem"]'
    ],
  }
};

const CONTAINER_SELECTORS = [
  '#pane-side',
  '[data-testid="chat-list"]',
  '[aria-label][role="list"]',
  '[role="main"]',
  '[data-testid="conversation-panel-body"]',
  '[role="application"]',
];

/* ==========================================================================
   Estado
   ========================================================================== */

let categoryState = {};
let currentSettings = {
  blurIntensity: 8,
  solidMode: false,
  fakeData: false,
  savedPin: ''
};

/** Se true, o content script permite desativar categorias. */
let isUnlocked = false;

let containerObservers = [];
let rootObserver = null;
let pollIntervalId = null;
let rescanIntervalId = null;
let unlockTimeout = null;
const observedContainers = new Set();

/* ==========================================================================
   Fake Data
   ========================================================================== */

function getFakeName(text) {
  if (!text) return 'Contato Desconhecido';
  const hash = Array.from(text).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
  const names = ['Cliente', 'Fornecedor', 'Contato VIP', 'Alice', 'Bob', 'Suporte', 'Vendas', 'RH', 'Financeiro'];
  return names[Math.abs(hash) % names.length] + ' ' + (Math.abs(hash) % 100);
}

function getFakeMessage(text) {
  if (!text) return 'Mensagem...';
  const words = text.split(' ').length;
  if (words <= 2) return 'Tudo certo!';
  if (words <= 5) return 'Ok, combinado.';
  return 'Lorem ipsum dolor sit amet consectetur adipisicing elit.';
}

/* ==========================================================================
   Filtros de Validação
   ========================================================================== */

function isLegitPhoto(el) {
  if (el.tagName !== 'IMG') return true;
  const src = el.getAttribute('src') || '';
  if (src.includes('emoji')) return false;
  const w = el.naturalWidth || el.width || el.clientWidth || 0;
  const h = el.naturalHeight || el.height || el.clientHeight || 0;
  if (w > 0 && w < 20 && h > 0 && h < 20) return false;
  return true;
}

function isLegitName(el) {
  const text = (el.textContent || '').trim();
  if (text.length < 1) return false;
  if (/^\d{1,2}:\d{2}$/.test(text)) return false;
  if (/^(visto por último|online|digitando|clique aqui|escrevendo|gravando|chamando)/i.test(text)) return false;
  if (el.getAttribute('data-testid') === 'selectable-text') return false;
  if (el.classList.contains('copyable-text')) return false;
  if (el.closest('[data-testid="cell-frame-secondary"]')) return false;
  if (el.closest('.message-in') || el.closest('.message-out')) return false;
  if (el.closest('[data-testid="msg-container"]')) return false;
  if (el.closest('#pane-side') && el.getAttribute('dir') === 'ltr') return false;
  if (text.length > 60) return false;
  return true;
}

function isLegitMessage(el) {
  const text = (el.textContent || '').trim();
  if (text.length < 1) return false;
  if (/^\d{1,2}:\d{2}$/.test(text)) return false;
  if (el.closest('[data-testid="cell-frame-title"]')) return false;
  return true;
}

function isLegitMedia(el) {
  if (el.closest('#pane-side')) return false;
  if (el.closest('header')) return false;
  if (el.closest('[data-testid="chat-info-drawer"]')) return false;
  if (el.tagName === 'IMG') {
    const src = el.getAttribute('src') || '';
    if (src.includes('emoji')) return false;
    const w = el.naturalWidth || el.width || el.clientWidth || 0;
    const h = el.naturalHeight || el.height || el.clientHeight || 0;
    if (w > 0 && w < 20 && h > 0 && h < 20) return false;
  }
  return true;
}

function isLegitCompose(el) {
  return true;
}

const FILTERS = {
  photos: isLegitPhoto,
  names: isLegitName,
  messages: isLegitMessage,
  media: isLegitMedia,
  compose: isLegitCompose
};

/* ==========================================================================
   Manipulação do DOM
   ========================================================================== */

function applyBlur(el, categoryKey, cssClass) {
  if (!el.classList.contains(cssClass)) {
    el.classList.add(cssClass);
  }

  // Lidar com Fake Data
  if (currentSettings.fakeData && (categoryKey === 'names' || categoryKey === 'messages')) {
    el.classList.add('wpb-fake-data');
    if (categoryKey === 'names' && !el.hasAttribute('data-fake-name')) {
      el.setAttribute('data-fake-name', getFakeName(el.textContent));
    }
    if (categoryKey === 'messages' && !el.hasAttribute('data-fake-text')) {
      el.setAttribute('data-fake-text', getFakeMessage(el.textContent));
    }
  } else if (!currentSettings.fakeData) {
    el.classList.remove('wpb-fake-data');
  }
}

function removeBlur(el, cssClass) {
  el.classList.remove(cssClass);
  el.classList.remove('wpb-fake-data');
}

function scanAndApply(root) {
  for (const [key, config] of Object.entries(CATEGORIES)) {
    if (!categoryState[key]) continue;

    const filter = FILTERS[key];

    for (const selector of config.selectors) {
      try {
        const matches = root.querySelectorAll(selector);
        for (const el of matches) {
          if (filter(el)) {
            applyBlur(el, key, config.cssClass);
          }
        }
      } catch { }
    }

    if (root instanceof Element) {
      for (const selector of config.selectors) {
        try {
          if (root.matches(selector) && filter(root)) {
            applyBlur(root, key, config.cssClass);
          }
        } catch { }
      }
    }
  }
}

function clearCategory(categoryKey) {
  const config = CATEGORIES[categoryKey];
  if (!config) return;

  const els = document.querySelectorAll(`.${config.cssClass}`);
  for (const el of els) {
    removeBlur(el, config.cssClass);
  }
}

function applyFullState() {
  for (const key of Object.keys(CATEGORIES)) {
    if (categoryState[key]) {
      scanAndApply(document);
    } else {
      clearCategory(key);
    }
  }
}

/* ==========================================================================
   MutationObserver
   ========================================================================== */

function onMutation(mutations) {
  const anyActive = Object.values(categoryState).some(Boolean);
  if (!anyActive) return;

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      scanAndApply(node);
    }
  }
}

function observeContainer(container) {
  if (observedContainers.has(container)) return;
  const observer = new MutationObserver(onMutation);
  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });
  containerObservers.push(observer);
  observedContainers.add(container);
  scanAndApply(container);
}

function findAndObserveContainers() {
  let found = 0;
  for (const selector of CONTAINER_SELECTORS) {
    try {
      const els = document.querySelectorAll(selector);
      for (const el of els) {
        if (!observedContainers.has(el)) {
          observeContainer(el);
          found++;
        }
      }
    } catch { }
  }
  return found;
}

/* ==========================================================================
   Polling e Re-scan
   ========================================================================== */

function startPolling(intervalMs = 500, maxAttempts = 120) {
  let attempts = 0;
  if (pollIntervalId) clearInterval(pollIntervalId);
  pollIntervalId = setInterval(() => {
    attempts++;
    findAndObserveContainers();
    if (observedContainers.size >= 2 || attempts >= maxAttempts) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  }, intervalMs);
}

function setupRootObserver() {
  const attach = () => {
    if (!document.body) {
      requestAnimationFrame(attach);
      return;
    }
    rootObserver = new MutationObserver(() => {
      findAndObserveContainers();
    });
    rootObserver.observe(document.body, {
      childList: true,
      subtree: false,
    });
  };
  attach();
}

function startPeriodicRescan(intervalMs = 2000) {
  if (rescanIntervalId) clearInterval(rescanIntervalId);
  rescanIntervalId = setInterval(() => {
    const anyActive = Object.values(categoryState).some(Boolean);
    if (!anyActive) return;

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => scanAndApply(document), { timeout: 500 });
    } else {
      scanAndApply(document);
    }
  }, intervalMs);
}

/* ==========================================================================
   Configurações Globais
   ========================================================================== */

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

  // Ao mudar Fake Data, disparamos um re-scan total para adicionar/remover classes
  if (settings.fakeData !== currentSettings.fakeData) {
    currentSettings.fakeData = settings.fakeData;
    applyFullState();
  }
}

/* ==========================================================================
   Storage e Mensagens
   ========================================================================== */

function listenForStorageChanges() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    // Atualizar settings primeiro (pode conter savedPin)
    if (changes[SETTINGS_KEY]) {
      const newSettings = changes[SETTINGS_KEY].newValue || {};
      const mergedSettings = { ...currentSettings, ...newSettings };
      applySettingsToRoot(mergedSettings);
      currentSettings = mergedSettings;

      // Adicionar ou remover a classe de bloqueio dependendo do PIN
      if (currentSettings.savedPin && !isUnlocked) {
        document.body.classList.add('wpb-locked');
      } else if (!currentSettings.savedPin) {
        document.body.classList.remove('wpb-locked');
      }
    }

    if (changes[STORAGE_KEY]) {
      const newState = changes[STORAGE_KEY].newValue || {};
      const oldState = { ...categoryState };
      
      const defaults = {};
      for (const [key, config] of Object.entries(CATEGORIES)) {
        defaults[key] = config.defaultEnabled;
      }
      const incoming = { ...defaults, ...newState };

      // Se PIN ativo e não desbloqueado, impedir DESATIVAÇÃO de categorias
      const pinActive = !!currentSettings.savedPin && !isUnlocked;

      for (const key of Object.keys(CATEGORIES)) {
        const wasActive = oldState[key];
        const wantsActive = incoming[key];

        if (pinActive && wasActive && !wantsActive) {
          // Tentativa de desativar com PIN ativo → IGNORAR, manter ativo
          incoming[key] = true;
        }
      }

      categoryState = incoming;

      for (const key of Object.keys(CATEGORIES)) {
        const wasActive = oldState[key];
        const isActive = categoryState[key];
        if (wasActive && !isActive) clearCategory(key);
        else if (!wasActive && isActive) scanAndApply(document);
      }
    }
  });
}

function listenForRuntimeMessages() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'unlock') {
      isUnlocked = true;
      document.body.classList.remove('wpb-locked');
      if (unlockTimeout) clearTimeout(unlockTimeout);
      unlockTimeout = setTimeout(() => {
        isUnlocked = false;
        // Só re-bloqueia se ainda houver PIN salvo
        if (currentSettings.savedPin) {
          document.body.classList.add('wpb-locked');
        }
      }, message.duration || 300000);
      sendResponse({ success: true });
    } else if (message.action === 'relock') {
      isUnlocked = false;
      if (unlockTimeout) clearTimeout(unlockTimeout);
      if (currentSettings.savedPin) {
        document.body.classList.add('wpb-locked');
      }
      sendResponse({ success: true });
    } else if (message.action === 'status') {
      sendResponse({ isUnlocked: isUnlocked });
    }
  });
}

/* ==========================================================================
   Entry Point
   ========================================================================== */

async function initialize() {
  const result = await chrome.storage.local.get([STORAGE_KEY, SETTINGS_KEY]);
  
  // Categorias
  const savedCats = result[STORAGE_KEY];
  const defaults = {};
  for (const [key, config] of Object.entries(CATEGORIES)) {
    defaults[key] = config.defaultEnabled;
  }
  categoryState = savedCats ? { ...defaults, ...savedCats } : defaults;

  // Configurações
  const savedSettings = result[SETTINGS_KEY];
  if (savedSettings) {
    currentSettings = { ...currentSettings, ...savedSettings };
  }

  // Se há PIN salvo, iniciar bloqueado
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
  applyFullState();
  startPolling();
  setupRootObserver();
  startPeriodicRescan();
  listenForStorageChanges();
  listenForRuntimeMessages();
}

initialize();
