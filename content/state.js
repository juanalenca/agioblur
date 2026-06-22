/**
 * @fileoverview Gerenciamento de estado e configurações globais (Content Script).
 */

/* exported WPB_STATE */
'use strict';

/**
 * Módulo de estado do AgioBlur.
 */
const WPB_STATE = (function() {
  let categoryState = {};
  let currentSettings = {
    blurIntensity: 8,
    solidMode: false,
    fakeData: false,
    savedPin: ''
  };
  
  let isUnlocked = false;
  let unlockTimeout = null;

  return {
    /** @returns {Object} Estado atual das categorias. */
    getCategoryState() { return categoryState; },
    
    /** @param {Object} state Novo estado das categorias. */
    setCategoryState(state) { categoryState = state; },

    /** @returns {Object} Configurações atuais. */
    getSettings() { return currentSettings; },

    /** @param {Object} settings Novas configurações. */
    setSettings(settings) { currentSettings = settings; },

    /** @returns {boolean} Se a sessão está temporariamente desbloqueada. */
    getIsUnlocked() { return isUnlocked; },

    /** @param {boolean} val Valor do bloqueio. */
    setIsUnlocked(val) { isUnlocked = val; },

    /** @returns {number|null} ID do timeout de desbloqueio. */
    getUnlockTimeout() { return unlockTimeout; },

    /** @param {number|null} val Novo ID do timeout. */
    setUnlockTimeout(val) { unlockTimeout = val; }
  };
})();
