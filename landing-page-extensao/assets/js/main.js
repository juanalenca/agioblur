const CHECKOUT_URLS = {
  cakto: 'https://pay.cakto.com.br/agioblur-pro',
  lemonsqueezy: 'https://agioblur.lemonsqueezy.com/buy/agioblur-pro'
};

const STORE_URLS = {
  chrome: 'https://chromewebstore.google.com/',
  edge: 'https://microsoftedge.microsoft.com/addons/',
  firefox: 'https://addons.mozilla.org/'
};

const CONTENT = {
  'pt-BR': {
    navInstall: 'Instalar',
    navUpgrade: 'Upgrade Pro',
    eyebrow: 'Privacidade visual para WhatsApp Web',
    headline: 'AgioBlur',
    lede: 'Desfoque conversas, nomes, fotos e dados sensíveis no WhatsApp Web antes que alguém olhe para a sua tela.',
    install: 'Instalar extensão',
    proCta: 'Ver Pro',
    trust: ['Sem rastreamento', '10 idiomas', 'Free + Pro'],
    trustText: ['Proteção local no navegador', 'Interface preparada para uso global', 'Comece grátis e libere recursos avançados'],
    featuresTitle: 'Proteção clara, controle rápido',
    featuresText: 'Tudo fica a um clique, com recursos separados entre Free e Pro para o usuário entender o que está ativo.',
    features: [
      ['Fotos e nomes', 'Oculte informações visuais da lista de conversas e do cabeçalho.'],
      ['Mensagens e mídias', 'No Pro, proteja texto, imagens, vídeos e previews de arquivos.'],
      ['Filtros LGPD', 'Detecte CPF, CNPJ, e-mail, telefone, cartão e Pix em mensagens.']
    ],
    pricingTitle: 'Escolha seu nível de proteção',
    pricingText: 'O plano Free cobre o básico. O Pro desbloqueia privacidade avançada para trabalho, atendimento e ambientes compartilhados.',
    free: 'Free',
    pro: 'Pro',
    freeDesc: 'Para privacidade rápida no dia a dia.',
    proDesc: 'Para quem trabalha com conversas sensíveis.',
    freeItems: ['Fotos de perfil', 'Nomes e números', 'Campo de digitação', 'Censura sólida'],
    proItems: ['Mensagens e mídias', 'Filtros LGPD', 'Modo Fake Data', 'PIN e intensidade customizada'],
    startFree: 'Começar grátis',
    buyPro: 'Comprar Pro',
    privacyTitle: 'Privacidade como padrão',
    privacyText: 'A extensão aplica classes e filtros no navegador. A licença Pro é validada por recibo assinado, sem colocar segredo dentro da extensão.',
    privacyItems: ['Manifest V3 e CSP restritiva', 'Recibo Premium com chave pública', 'Tolerância offline limitada'],
    faqTitle: 'Perguntas rápidas',
    faqs: [
      ['Funciona em qual navegador?', 'Chrome e Edge são o alvo inicial. Firefox pode ser habilitado quando a publicação estiver pronta.'],
      ['Preciso pagar para usar?', 'Não. O plano Free continua útil para proteção básica.'],
      ['O Pro é por dispositivo?', 'A licença Pro foi planejada para até 3 dispositivos.']
    ],
    finalTitle: 'Sua tela não precisa revelar tudo.',
    finalText: 'Instale o AgioBlur e transforme o WhatsApp Web em um espaço mais seguro para trabalhar em público.',
    footer: 'AgioBlur. Privacidade visual para WhatsApp Web.'
  },
  en: {
    navInstall: 'Install',
    navUpgrade: 'Upgrade Pro',
    eyebrow: 'Visual privacy for WhatsApp Web',
    headline: 'AgioBlur',
    lede: 'Blur chats, names, photos, media, and sensitive data on WhatsApp Web before someone sees your screen.',
    install: 'Install extension',
    proCta: 'See Pro',
    trust: ['No tracking', '10 languages', 'Free + Pro'],
    trustText: ['Local browser protection', 'Global-ready interface', 'Start free and unlock advanced controls'],
    featuresTitle: 'Clear protection, fast control',
    featuresText: 'Free and Pro tools are separated so people can see exactly what is active.',
    features: [
      ['Photos and names', 'Hide visual details from chat lists and headers.'],
      ['Messages and media', 'With Pro, protect text, images, videos, and file previews.'],
      ['Sensitive-data filters', 'Detect IDs, e-mails, phones, cards, and payment keys inside messages.']
    ],
    pricingTitle: 'Choose your protection level',
    pricingText: 'Free covers the basics. Pro unlocks advanced privacy for work, support, and shared spaces.',
    free: 'Free',
    pro: 'Pro',
    freeDesc: 'Fast everyday privacy.',
    proDesc: 'For sensitive conversations.',
    freeItems: ['Profile photos', 'Names and numbers', 'Typing field', 'Solid censor mode'],
    proItems: ['Messages and media', 'Sensitive-data filters', 'Fake Data mode', 'PIN and custom intensity'],
    startFree: 'Start free',
    buyPro: 'Buy Pro',
    privacyTitle: 'Privacy by default',
    privacyText: 'The extension applies local browser classes and filters. Pro access is validated with a signed receipt, without embedding secrets.',
    privacyItems: ['Manifest V3 and strict CSP', 'Premium receipt with public-key verification', 'Limited offline tolerance'],
    faqTitle: 'Quick questions',
    faqs: [
      ['Which browser is supported?', 'Chrome and Edge are the first targets. Firefox can follow when publication is ready.'],
      ['Do I need to pay?', 'No. Free remains useful for basic protection.'],
      ['Is Pro per device?', 'The Pro license is planned for up to 3 devices.']
    ],
    finalTitle: 'Your screen does not have to reveal everything.',
    finalText: 'Install AgioBlur and make WhatsApp Web safer for public work.',
    footer: 'AgioBlur. Visual privacy for WhatsApp Web.'
  }
};

const FALLBACKS = {
  es: ['Privacidad visual para WhatsApp Web', 'Protege tu pantalla antes de que alguien mire.'],
  de: ['Visueller Datenschutz für WhatsApp Web', 'Schütze deinen Bildschirm, bevor jemand mitliest.'],
  fr: ['Confidentialité visuelle pour WhatsApp Web', 'Protégez votre écran avant qu’il ne soit visible.'],
  it: ['Privacy visiva per WhatsApp Web', 'Proteggi lo schermo prima che qualcuno guardi.'],
  id: ['Privasi visual untuk WhatsApp Web', 'Lindungi layar sebelum orang lain melihatnya.'],
  tr: ['WhatsApp Web için görsel gizlilik', 'Ekranını biri görmeden önce koru.'],
  hi: ['WhatsApp Web के लिए visual privacy', 'किसी के देखने से पहले अपनी screen सुरक्षित रखें।'],
  ar: ['خصوصية بصرية لـ WhatsApp Web', 'احم شاشتك قبل أن يراها الآخرون.']
};

function contentFor(locale) {
  if (CONTENT[locale]) return CONTENT[locale];
  const base = { ...CONTENT.en };
  const fallback = FALLBACKS[locale];
  if (fallback) {
    base.eyebrow = fallback[0];
    base.lede = fallback[1];
  }
  return base;
}

function getInstallUrl() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return STORE_URLS.edge;
  if (ua.includes('Firefox')) return STORE_URLS.firefox;
  return STORE_URLS.chrome;
}

function checkoutUrl(locale) {
  return locale === 'pt-BR' ? CHECKOUT_URLS.cakto : CHECKOUT_URLS.lemonsqueezy;
}

function html(strings, ...values) {
  return strings.reduce((out, part, index) => out + part + (values[index] ?? ''), '');
}

function render() {
  const locale = document.body.dataset.locale || 'en';
  const t = contentFor(locale);
  document.documentElement.lang = locale;
  if (locale === 'ar') document.body.setAttribute('dir', 'rtl');

  document.body.innerHTML = html`
    <div class="site-shell">
      <header class="hero">
        <div class="topbar">
          <a class="brand" href="#top" aria-label="AgioBlur">
            <img src="../assets/images/agioblur-icon.png" alt="">
            <span>AgioBlur</span>
          </a>
          <div class="nav-actions">
            <select class="lang-select" aria-label="Language">
              ${['pt-BR', 'en', 'es', 'de', 'fr', 'it', 'id', 'tr', 'hi', 'ar'].map(code => `<option value="${code}" ${code === locale ? 'selected' : ''}>${code}</option>`).join('')}
            </select>
            <a class="button secondary" href="#pricing">${t.navUpgrade}</a>
          </div>
        </div>
        <div class="hero-scene" aria-hidden="true">
          <div class="chat-canvas">
            <div class="chat-list">
              ${Array.from({ length: 8 }, (_, index) => `
                <div class="chat-row">
                  <div class="avatar"></div>
                  <div class="chat-copy">
                    <div class="blur-line ${index % 2 ? 'medium' : 'long'}"></div>
                    <div class="blur-line short"></div>
                  </div>
                </div>`).join('')}
            </div>
            <div class="chat-window">
              <div class="message-stack">
                <div class="message"><div class="chat-copy"><div class="blur-line long"></div><div class="blur-line medium"></div></div></div>
                <div class="message"><div class="media-tile"></div><div class="chat-copy"><div class="blur-line medium"></div><div class="blur-line short"></div></div></div>
                <div class="message"><div class="chat-copy"><div class="blur-line long"></div><div class="blur-line medium"></div><div class="blur-line short"></div></div></div>
                <div class="message"><div class="media-tile"></div><div class="chat-copy"><div class="blur-line long"></div><div class="blur-line short"></div></div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="hero-content" id="top">
          <div class="hero-copy">
            <div class="eyebrow">${t.eyebrow}</div>
            <h1>${t.headline}</h1>
            <p class="hero-lede">${t.lede}</p>
            <div class="hero-actions">
              <a class="button primary install-link" href="${getInstallUrl()}">${t.install}</a>
              <a class="button secondary" href="#pricing">${t.proCta}</a>
            </div>
            <div class="trust-strip">
              ${t.trust.map((item, index) => `<div class="trust-item"><strong>${item}</strong><span>${t.trustText[index]}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </header>

      <main>
        <section>
          <div class="section-inner">
            <div class="section-head">
              <h2>${t.featuresTitle}</h2>
              <p>${t.featuresText}</p>
            </div>
            <div class="feature-grid">
              ${t.features.map((feature, index) => `<article class="feature"><span>${index + 1}</span><h3>${feature[0]}</h3><p>${feature[1]}</p></article>`).join('')}
            </div>
          </div>
        </section>

        <section id="pricing" class="privacy-band">
          <div class="section-inner">
            <div class="section-head">
              <h2>${t.pricingTitle}</h2>
              <p>${t.pricingText}</p>
            </div>
            <div class="pricing-grid">
              <article class="plan">
                <h3>${t.free}</h3>
                <p>${t.freeDesc}</p>
                <div class="plan-price"><strong>$0</strong><span></span></div>
                <ul>${t.freeItems.map(item => `<li>${item}</li>`).join('')}</ul>
                <a class="button secondary install-link" href="${getInstallUrl()}">${t.startFree}</a>
              </article>
              <article class="plan pro">
                <h3>${t.pro}</h3>
                <p>${t.proDesc}</p>
                <div class="plan-price"><strong>Pro</strong><span></span></div>
                <ul>${t.proItems.map(item => `<li>${item}</li>`).join('')}</ul>
                <a class="button primary checkout-link" href="${checkoutUrl(locale)}">${t.buyPro}</a>
              </article>
            </div>
          </div>
        </section>

        <section>
          <div class="section-inner privacy-panel">
            <div class="section-head">
              <h2>${t.privacyTitle}</h2>
              <p>${t.privacyText}</p>
            </div>
            <div class="privacy-list">
              ${t.privacyItems.map(item => `<div>${item}</div>`).join('')}
            </div>
          </div>
        </section>

        <section>
          <div class="section-inner">
            <div class="section-head">
              <h2>${t.faqTitle}</h2>
            </div>
            <div class="faq-grid">
              ${t.faqs.map(faq => `<article class="faq-item"><h3>${faq[0]}</h3><p>${faq[1]}</p></article>`).join('')}
            </div>
          </div>
        </section>

        <section class="cta">
          <div class="section-inner">
            <div class="section-head">
              <h2>${t.finalTitle}</h2>
              <p>${t.finalText}</p>
            </div>
            <div class="button-row">
              <a class="button primary install-link" href="${getInstallUrl()}">${t.install}</a>
              <a class="button secondary checkout-link" href="${checkoutUrl(locale)}">${t.buyPro}</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div class="section-inner footer-row">
          <span>${t.footer}</span>
          <div class="footer-links">
            <a href="#pricing">${t.navUpgrade}</a>
            <a class="install-link" href="${getInstallUrl()}">${t.navInstall}</a>
          </div>
        </div>
      </footer>
    </div>
  `;

  document.querySelector('.lang-select')?.addEventListener('change', event => {
    location.href = `../${event.target.value}/`;
  });
}

render();
