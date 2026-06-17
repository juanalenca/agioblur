/**
 * @fileoverview Lógica de manipulação de DOM e MutationObserver.
 */

/* global WPB_CONSTANTS, WPB_STATE, WPB_PII */
/* exported WPB_DOM */
'use strict';

// eslint-disable-next-line no-unused-vars
const WPB_DOM = (function() {
  let containerObservers = [];
  let rootObserver = null;
  let pollIntervalId = null;
  let rescanIntervalId = null;
  const observedContainers = new Set();

  /**
   * Gera um nome falso (Fake Data)
   * @param {string} text Texto original.
   * @returns {string} Nome falso gerado.
   */
  function getFakeName(text) {
    if (!text) return 'Contato Desconhecido';
    const hash = Array.from(text).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
    const names = ['Cliente', 'Fornecedor', 'Contato VIP', 'Alice', 'Bob', 'Suporte', 'Vendas', 'RH', 'Financeiro'];
    return names[Math.abs(hash) % names.length] + ' ' + (Math.abs(hash) % 100);
  }

  /**
   * Gera uma mensagem falsa (Fake Data)
   * @param {string} text Texto original.
   * @returns {string} Mensagem falsa gerada.
   */
  function getFakeMessage(text) {
    if (!text) return 'Mensagem...';
    const words = text.split(' ').length;
    if (words <= 2) return 'Tudo certo!';
    if (words <= 5) return 'Ok, combinado.';
    return 'Lorem ipsum dolor sit amet consectetur adipisicing elit.';
  }

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

  function isLegitCompose() {
    return true;
  }

  const FILTERS = {
    photos: isLegitPhoto,
    names: isLegitName,
    messages: isLegitMessage,
    media: isLegitMedia,
    compose: isLegitCompose
  };

  /**
   * Aplica blur e/ou Fake Data no elemento
   * @param {Element} el 
   * @param {string} categoryKey 
   * @param {string} cssClass 
   */
  function applyBlur(el, categoryKey, cssClass) {
    if (!el.classList.contains(cssClass)) {
      el.classList.add(cssClass);
    }
    const settings = WPB_STATE.getSettings();
    if (settings.fakeData && (categoryKey === 'names' || categoryKey === 'messages')) {
      el.classList.add('wpb-fake-data');
      if (categoryKey === 'names' && !el.hasAttribute('data-fake-name')) {
        el.setAttribute('data-fake-name', getFakeName(el.textContent));
      }
      if (categoryKey === 'messages' && !el.hasAttribute('data-fake-text')) {
        el.setAttribute('data-fake-text', getFakeMessage(el.textContent));
      }
    } else if (!settings.fakeData) {
      el.classList.remove('wpb-fake-data');
    }
  }

  /**
   * Remove blur do elemento
   * @param {Element} el 
   * @param {string} cssClass 
   */
  function removeBlur(el, cssClass) {
    el.classList.remove(cssClass);
    el.classList.remove('wpb-fake-data');
  }

  /**
   * Faz varredura e aplica filtros
   * @param {Document|Element} root 
   */
  function scanAndApply(root) {
    const state = WPB_STATE.getCategoryState();
    for (const [key, config] of Object.entries(WPB_CONSTANTS.CATEGORIES)) {
      if (!state[key]) continue;
      const filter = FILTERS[key];

      for (const selector of config.selectors) {
        try {
          const matches = root.querySelectorAll(selector);
          for (const el of matches) {
            if (filter(el)) applyBlur(el, key, config.cssClass);
          }
        } catch {
          // ignora
        }
      }

      if (root instanceof Element) {
        for (const selector of config.selectors) {
          try {
            if (root.matches(selector) && filter(root)) {
              applyBlur(root, key, config.cssClass);
            }
          } catch {
            // ignora
          }
        }
      }
    }

    if (typeof WPB_PII !== 'undefined') {
      WPB_PII.scan(root);
    }
  }

  /**
   * Limpa uma categoria
   * @param {string} categoryKey 
   */
  function clearCategory(categoryKey) {
    const config = WPB_CONSTANTS.CATEGORIES[categoryKey];
    if (!config) return;
    const els = document.querySelectorAll(`.${config.cssClass}`);
    for (const el of els) {
      removeBlur(el, config.cssClass);
    }
  }

  /**
   * Aplica estado completo
   */
  function applyFullState() {
    const state = WPB_STATE.getCategoryState();
    for (const key of Object.keys(WPB_CONSTANTS.CATEGORIES)) {
      if (state[key]) {
        scanAndApply(document);
      } else {
        clearCategory(key);
      }
    }
  }

  function onMutation(mutations) {
    const state = WPB_STATE.getCategoryState();
    const anyActive = Object.values(state).some(Boolean);
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
    for (const selector of WPB_CONSTANTS.CONTAINER_SELECTORS) {
      try {
        const els = document.querySelectorAll(selector);
        for (const el of els) {
          if (!observedContainers.has(el)) {
            observeContainer(el);
            found++;
          }
        }
      } catch {
        // ignora
      }
    }
    return found;
  }

  function startPolling(intervalMs = 2000) {
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(() => {
      findAndObserveContainers();
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
      const state = WPB_STATE.getCategoryState();
      const anyActive = Object.values(state).some(Boolean);
      if (!anyActive) return;

      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(() => scanAndApply(document), { timeout: 500 });
      } else {
        scanAndApply(document);
      }
    }, intervalMs);
  }

  return {
    applyBlur,
    removeBlur,
    scanAndApply,
    clearCategory,
    applyFullState,
    startPolling,
    setupRootObserver,
    startPeriodicRescan
  };
})();
