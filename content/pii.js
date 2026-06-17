/**
 * @fileoverview Lógica de identificação e mascaramento de PII (LGPD).
 */

/* global WPB_CONSTANTS, WPB_STATE */
/* exported WPB_PII */
'use strict';

// eslint-disable-next-line no-unused-vars
const WPB_PII = (function() {
  const originalTextMap = new WeakMap();
  let hoverListenerAdded = false;

  function getActiveRegex() {
    const state = WPB_STATE.getCategoryState();
    const activePatterns = [];

    for (const key of Object.keys(WPB_CONSTANTS.PII_PATTERNS)) {
      if (state[key]) {
        activePatterns.push(WPB_CONSTANTS.PII_PATTERNS[key].source);
      }
    }

    if (activePatterns.length === 0) return null;
    return new RegExp(activePatterns.join('|'), 'g');
  }

  function maskString(str, regex) {
    return str.replace(regex, (match) => {
      // Cria um bloco escuro do mesmo tamanho do match, ou um padrão
      return '█'.repeat(Math.min(match.length, 12));
    });
  }

  function handleMouseOver(e) {
    if (WPB_STATE.getSettings().savedPin && !WPB_STATE.getIsUnlocked()) {
      return; // PIN bloqueado, não revela no hover
    }

    const parent = e.target.closest('.wpb-pii-parent');
    if (!parent) return;

    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (originalTextMap.has(node)) {
        node.nodeValue = originalTextMap.get(node);
      }
    }
  }

  function handleMouseOut(e) {
    const parent = e.target.closest('.wpb-pii-parent');
    if (!parent) return;

    const regex = getActiveRegex();
    if (!regex) return;

    const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (originalTextMap.has(node)) {
        const original = originalTextMap.get(node);
        node.nodeValue = maskString(original, regex);
      }
    }
  }

  function ensureListeners() {
    if (hoverListenerAdded) return;
    document.body.addEventListener('mouseover', handleMouseOver);
    document.body.addEventListener('mouseout', handleMouseOut);
    hoverListenerAdded = true;
  }

  function scanNodeForPII(root) {
    const regex = getActiveRegex();
    if (!regex) return; // Nenhuma categoria PII ativa

    ensureListeners();

    // Filtra elementos que não devem ser scaneados
    const filter = {
      acceptNode: function(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_SKIP;
        
        // Ignora scripts, styles, etc
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        
        // Se a mensagem já está com blur genérico ligado, não precisa aplicar PII!
        // Wait, o CSS do blur genérico aplica blur na caixa inteira.
        // Se a caixa inteira está borrada, o PII ainda pode rodar, não tem problema.

        return NodeFilter.FILTER_ACCEPT;
      }
    };

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter, false);
    const nodesToUpdate = [];
    
    let node;
    while ((node = walker.nextNode())) {
      const text = originalTextMap.has(node) ? originalTextMap.get(node) : node.nodeValue;
      if (!text || text.trim().length === 0) continue;

      regex.lastIndex = 0; // reset regex state
      if (regex.test(text)) {
        nodesToUpdate.push({ node, text });
      }
    }

    // Aplica as mudanças
    for (const { node, text } of nodesToUpdate) {
      if (!originalTextMap.has(node)) {
        originalTextMap.set(node, text);
      }

      const parent = node.parentElement;
      if (parent) {
        parent.classList.add('wpb-pii-parent');
        parent.style.transition = 'color 0.2s';
        
        // Se não estiver em hover, aplica a máscara
        if (!parent.matches(':hover')) {
          regex.lastIndex = 0;
          node.nodeValue = maskString(text, regex);
        }
      }
    }
  }

  function restoreAllPII(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      if (originalTextMap.has(node)) {
        node.nodeValue = originalTextMap.get(node);
        originalTextMap.delete(node);
        
        const parent = node.parentElement;
        if (parent) {
          parent.classList.remove('wpb-pii-parent');
        }
      }
    }
  }

  return {
    scan: scanNodeForPII,
    restore: restoreAllPII
  };
})();
