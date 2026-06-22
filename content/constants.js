/**
 * @fileoverview Constantes do projeto AgioBlur.
 */

/* exported WPB_CONSTANTS */
'use strict';

const WPB_CONSTANTS = {
  STORAGE_KEY: 'wpbCategories',
  SETTINGS_KEY: 'wpbSettings',
  FEATURE_TIERS: {
    photos: 'FREE',
    names: 'PRO',
    compose: 'FREE',
    solidMode: 'FREE',
    messages: 'FREE',
    media: 'PRO',
    fakeData: 'PRO',
    blurIntensity: 'PRO',
    savedPin: 'PRO',
    piiCpf: 'PRO',
    piiEmail: 'PRO',
    piiCard: 'PRO',
    piiPhone: 'PRO',
    piiPix: 'PRO'
  },

  CATEGORIES: {
    photos: {
      cssClass: 'wpb-blur-photo',
      defaultEnabled: true,
      selectors: [
        '#pane-side img',
        '[role="listitem"] img',
        '[data-testid="cell-frame-container"] img',
        'header img',
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
        '#pane-side span[dir="auto"]', // Garante suporte à lista de conversas
        '[data-testid="conversation-panel-body"] .selectable-text',
        '[data-testid="msg-container"] .selectable-text',
        '[role="row"] .selectable-text',
        '[role="row"] .copyable-text span',
        '[role="row"] [data-pre-plain-text] span[dir]',
        '.message-in .selectable-text',
        '.message-out .selectable-text',
        '.message-in .copyable-text span',
        '.message-out .copyable-text span',
        // Botões de anexo em mensagens (Documentos, Áudio, etc)
        '[data-testid="msg-container"] [role="button"]:has(svg) span',
        '.message-in [role="button"]:has(svg) span',
        '.message-out [role="button"]:has(svg) span',
        // Texto embutido nos ícones de anexo (o WhatsApp usa um div com font-size: 8px para escrever "PDF", "DOC", etc.)
        '[data-testid="msg-container"] div[style*="font-size: 8px"]',
        '.message-in div[style*="font-size: 8px"]',
        '.message-out div[style*="font-size: 8px"]',
        // Captura o preview visual de arquivos (Modal) e Fallbacks Globais
        'div:has(> span[title*=".pdf"]) span',
        'div:has(> span[title*=".doc"]) span',
        'div:has(> span[title*=".xls"]) span',
        'div:has(> span[title*=".ppt"]) span',
        'div:has(> span[title*=".zip"]) span',
        'div:has(> span[title*=".txt"]) span',
        '[role="dialog"] span[title]',
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
        // O WhatsApp usa divs com background-image (blob:) para renderizar prévias de PDF/documentos
        '[data-testid="msg-container"] div[style*="blob:"]',
        '.message-in div[style*="blob:"]',
        '.message-out div[style*="blob:"]',
        // Imagens de prévia anexadas a documentos/links (ignora emojis)
        '[data-testid="msg-container"]:has([role="button"]) img:not(.emoji)',
        '.message-in:has([role="button"]) img:not(.emoji)',
        '.message-out:has([role="button"]) img:not(.emoji)',
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
        '#main footer [contenteditable="true"]'
      ],
    }
  },

  PII_CATEGORIES: {
    piiCpf: { defaultEnabled: false },
    piiEmail: { defaultEnabled: false },
    piiCard: { defaultEnabled: false },
    piiPhone: { defaultEnabled: false },
    piiPix: { defaultEnabled: false }
  },

  PII_PATTERNS: {
    piiCpf: /\b(?:\d{3}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}|\d{2}[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\/?\d{4}[\s.-]?\d{2})\b/g,
    piiEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    piiCard: /\b(?:\d{4}[ -]?){3}\d{4}\b|\b\d{4}[ -]?\d{6}[ -]?\d{5}\b/g,
    piiPhone: /\b(?:\+?55\s?)?(?:\(?0?[1-9]{2}\)?\s?)?(?:9[\s-]?\d{4}[\s-]?\d{4}|\d{4}[\s-]?\d{4})\b/g,
    piiPix: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g
  },

  CONTAINER_SELECTORS: [
    '#pane-side',
    '[data-testid="chat-list"]',
    '[aria-label][role="list"]',
    '[role="main"]',
    '[data-testid="conversation-panel-body"]',
    '[role="application"]',
    '#main',
    '#app',
    '.app-wrapper-web'
  ]
};
