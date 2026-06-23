/**
 * @fileoverview Constantes do Popup.
 */

// eslint-disable-next-line no-unused-vars
const POPUP_CONSTANTS = {
  STORAGE_KEY: 'wpbCategories',
  SETTINGS_KEY: 'wpbSettings',

  TOGGLE_IDS: {
    autoBlur: 'toggle-auto-blur',
    photos: 'toggle-photos',
    names: 'toggle-names',
    messages: 'toggle-messages',
    media: 'toggle-media',
    compose: 'toggle-compose',
    piiCpf: 'toggle-pii-cpf',
    piiEmail: 'toggle-pii-email',
    piiCard: 'toggle-pii-card',
    piiPhone: 'toggle-pii-phone',
    piiPix: 'toggle-pii-pix'
  },

  DEFAULTS_CATEGORIES: {
    autoBlur: false,
    photos: true,
    names: false,
    messages: true,
    media: true,
    compose: true,
    piiCpf: false,
    piiEmail: false,
    piiCard: false,
    piiPhone: false,
    piiPix: false
  },

  DEFAULTS_SETTINGS: {
    autoBlurEnabled: false,
    autoBlurTimer: 5,
    blurIntensity: 8,
    solidMode: false,
    fakeData: false,
    savedPin: '',
  },

  FEATURE_TIERS: {
    autoBlur: 'PRO',
    photos: 'FREE',
    names: 'FREE',
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

  UPGRADE_URL: 'https://agioblur.com/pt-BR/#pricing'
};
