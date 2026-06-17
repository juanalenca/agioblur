/**
 * @fileoverview Constantes do projeto AgioBlur.
 */

/* exported WPB_CONSTANTS */
'use strict';

// eslint-disable-next-line no-unused-vars
const WPB_CONSTANTS = {
  STORAGE_KEY: 'wpbCategories',
  SETTINGS_KEY: 'wpbSettings',

  CATEGORIES: {
    photos: {
      cssClass: 'wpb-blur-photo',
      defaultEnabled: true,
      selectors: [
        '#pane-side img',
        '[role="listitem"] img',
        '[role="row"] img',
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
    piiCard: /\b(?:\d[ -]*?){13,16}\b/g,
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
