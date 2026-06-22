/**
 * @fileoverview Lógica de identificação e mascaramento de PII (LGPD).
 */

/* global WPB_CONSTANTS, WPB_STATE */
/* exported WPB_PII */
'use strict';

window.WPB_PII = (function() {
  const originalTextMap = new WeakMap();
  let hoverListenerAdded = false;

  function getActiveRegex() {
    if (!WPB_STATE.getIsPremium()) return null;

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
    if (WPB_STATE.getIsPremium() && WPB_STATE.getSettings().savedPin && !WPB_STATE.getIsUnlocked()) {
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
        const cleanOriginal = original.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
        
        regex.lastIndex = 0;
        const masked = maskString(cleanOriginal, regex);
        if (masked !== cleanOriginal) {
          node.nodeValue = masked;
        } else {
          regex.lastIndex = 0;
          node.nodeValue = maskString(original, regex);
        }
      }
    }
  }

  function ensureListeners() {
    if (hoverListenerAdded) return;

    // Cláusula de guarda para evitar execução antes da criação do body
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => {
        if (!hoverListenerAdded && document.body) {
          document.body.addEventListener('mouseover', handleMouseOver);
          document.body.addEventListener('mouseout', handleMouseOut);
          hoverListenerAdded = true;
        }
      });
      return;
    }

    // Execução normal caso o body já exista
    document.body.addEventListener('mouseover', handleMouseOver);
    document.body.addEventListener('mouseout', handleMouseOut);
    hoverListenerAdded = true;
  }

  function scanNodeForPII(root) {
    // Guard: ignora nós gerenciados pelo Fake Data para evitar conflito
    if (root.closest && root.closest('[data-wpb-managed]')) return;

    const regex = getActiveRegex();
    if (!regex) return; // Nenhuma categoria PII ativa

    ensureListeners();

    // Filtra elementos que não devem ser scaneados
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodesToUpdate = [];
    
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent) continue;
      
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;

      const text = originalTextMap.has(node) ? originalTextMap.get(node) : node.nodeValue;
      if (!text || text.trim().length === 0) continue;

      // WhatsApp Web inserts directionality marks (LRM, RLM, etc) which break regexes!
      const cleanText = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');

      regex.lastIndex = 0; // reset regex state
      if (regex.test(cleanText) || regex.test(text)) {
        nodesToUpdate.push({ node, text, cleanText });
      }
    }

    // Aplica as mudanças
    for (const { node, text, cleanText } of nodesToUpdate) {
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
          // Se o text original tem caracteres invisíveis que quebram o replace, usamos o cleanText!
          const masked = maskString(cleanText, regex);
          if (masked !== cleanText) {
             node.nodeValue = masked;
          } else {
             // Fallback se não conseguir substituir exatamente
             regex.lastIndex = 0;
             node.nodeValue = maskString(text, regex);
          }
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
