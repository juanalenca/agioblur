const CHECKOUT_URLS = {
  cakto: 'https://pay.cakto.com.br/agioblur-pro',
  lemonsqueezy: 'https://agioblur.lemonsqueezy.com/buy/agioblur-pro'
};

const STORE_URLS = {
  chrome: 'https://chromewebstore.google.com/',
  edge: 'https://microsoftedge.microsoft.com/addons/',
  firefox: 'https://addons.mozilla.org/'
};

const LANGUAGES = [
  ['pt-BR', 'Português'],
  ['en', 'English'],
  ['es', 'Español'],
  ['de', 'Deutsch'],
  ['fr', 'Français'],
  ['it', 'Italiano'],
  ['id', 'Indonesia'],
  ['tr', 'Türkçe'],
  ['hi', 'हिन्दी'],
  ['ar', 'العربية']
];

const CONTENT = {
  'pt-BR': {
    navInstall: 'Instalar',
    navUpgrade: 'Upgrade Pro',
    eyebrow: 'CONTRA OLHARES INDISCRETOS',
    headline: 'Sua conversa continua sua.',
    lede: 'Desfoque automaticamente mensagens, nomes, fotos e informações sensíveis no WhatsApp Web antes que alguém veja sua tela.',
    install: 'Instalar grátis',
    proCta: 'Conhecer Pro',
    trust: ['Local no navegador', '10 idiomas', 'Free + Pro'],
    trustText: ['Sem rastrear suas conversas', 'Interface preparada para uso global', 'Comece grátis e libere recursos avançados'],
    featuresTitle: 'Proteção clara, controle rápido',
    featuresText: 'Os controles são separados entre Free e Pro para o usuário entender o que está ativo e o que pode ser desbloqueado.',
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
    proItems: ['Auto-Blur por inatividade', 'Perfis de Privacidade', 'Atalhos de Teclado', 'Filtros LGPD', 'Modo Fake Data'],
    startFree: 'Começar grátis',
    buyPro: 'Comprar Pro',
    privacyTitle: 'Privacidade como padrão',
    privacyText: 'A extensão aplica classes e filtros no navegador. A licença Pro é validada por recibo assinado, sem colocar segredo dentro da extensão.',
    privacyItems: ['Manifest V3 e CSP restritiva', 'Recibo Premium com chave pública', 'Tolerância offline limitada'],
    faqTitle: 'Perguntas frequentes',
    faqs: [
      ['O que continua grátis?', 'Fotos de perfil, nomes/números, campo de digitação e censura sólida continuam disponíveis no plano Free.'],
      ['O que o Pro desbloqueia?', 'Mensagens, mídias, filtros LGPD, Fake Data, PIN de segurança e intensidade personalizada do desfoque.'],
      ['A extensão lê minhas conversas?', 'Não. O objetivo é aplicar proteção visual local no WhatsApp Web; suas conversas não são enviadas para análise.'],
      ['Quantos dispositivos posso usar?', 'A licença Pro foi planejada para até 3 dispositivos vinculados.'],
      ['O que acontece se eu trocar de computador?', 'Você poderá solicitar um reset de dispositivos por e-mail para reativar a licença em um novo navegador.'],
      ['Funciona offline?', 'O Pro usa recibo assinado com validade curta e uma tolerância offline limitada para quedas temporárias de conexão.']
    ],
    finalTitle: 'Sua tela não precisa revelar tudo.',
    finalText: 'Instale o AgioBlur e transforme o WhatsApp Web em um espaço mais seguro para trabalhar em público.',
    proPrice: 'R$ 9,90',
    footer: '© 2026 AgioBlur. Uma ferramenta independente de privacidade para WhatsApp Web.'
  },
  en: {
    navInstall: 'Install',
    navUpgrade: 'Upgrade Pro',
    eyebrow: 'AGAINST PRYING EYES',
    headline: 'Your chat remains yours.',
    lede: 'Automatically blur messages, names, photos, and sensitive information on WhatsApp Web before anyone sees your screen.',
    install: 'Install for free',
    proCta: 'Discover Pro',
    trust: ['Local in-browser', '10 languages', 'Free + Pro'],
    trustText: ['No conversation tracking', 'Global-ready interface', 'Start free and unlock advanced controls'],
    featuresTitle: 'Clear protection, fast control',
    featuresText: 'Free and Pro tools are separated so users can see exactly what is active and what can be unlocked.',
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
    faqTitle: 'Frequently asked questions',
    faqs: [
      ['What remains free?', 'Profile photos, names/numbers, the typing field, and solid censor mode remain available in Free.'],
      ['What does Pro unlock?', 'Messages, media, sensitive-data filters, Fake Data, security PIN, and custom blur intensity.'],
      ['Does the extension read my chats?', 'No. The goal is local visual protection on WhatsApp Web; your chats are not sent for analysis.'],
      ['How many devices can I use?', 'The Pro license is planned for up to 3 linked devices.'],
      ['What if I change computers?', 'You can request a device reset by e-mail to activate the license in a new browser.'],
      ['Does it work offline?', 'Pro uses a short-lived signed receipt and limited offline tolerance for temporary connection loss.']
    ],
    finalTitle: 'Your screen does not have to reveal everything.',
    finalText: 'Install AgioBlur and make WhatsApp Web safer for public work.',
    proPrice: '$2.99 USD',
    footer: '© 2026 AgioBlur. An independent visual privacy tool for WhatsApp Web.'
  },
  es: {
    navInstall: 'Instalar',
    navUpgrade: 'Mejorar a Pro',
    eyebrow: 'CONTRA MIRADAS INDISCRETAS',
    headline: 'Tu conversación sigue siendo tuya.',
    lede: 'Desenfoca automáticamente mensajes, nombres, fotos e información sensible en WhatsApp Web antes de que alguien vea tu pantalla.',
    install: 'Instalar gratis',
    proCta: 'Conocer Pro',
    trust: ['Local en el navegador', '10 idiomas', 'Gratis + Pro'],
    trustText: ['Sin rastrear conversaciones', 'Interfaz lista para uso global', 'Empieza gratis y desbloquea controles avanzados'],
    featuresTitle: 'Protección clara, control rápido',
    featuresText: 'Las herramientas Free y Pro están separadas para que sepas qué está activo y qué puedes desbloquear.',
    features: [
      ['Fotos y nombres', 'Oculta detalles visuales en listas de chats y encabezados.'],
      ['Mensajes y medios', 'Con Pro, protege texto, imágenes, videos y vistas previas.'],
      ['Filtros de datos', 'Detecta documentos, e-mails, teléfonos, tarjetas y claves de pago en mensajes.']
    ],
    pricingTitle: 'Elige tu nivel de protección',
    pricingText: 'Free cubre lo básico. Pro desbloquea privacidad avanzada para trabajo, soporte y espacios compartidos.',
    free: 'Gratis',
    pro: 'Pro',
    freeDesc: 'Privacidad rápida para el día a día.',
    proDesc: 'Para conversaciones sensibles.',
    freeItems: ['Fotos de perfil', 'Nombres y números', 'Campo de escritura', 'Censura sólida'],
    proItems: ['Mensajes y medios', 'Filtros de datos sensibles', 'Modo Fake Data', 'PIN e intensidad personalizada'],
    startFree: 'Empezar gratis',
    buyPro: 'Comprar Pro',
    privacyTitle: 'Privacidad por defecto',
    privacyText: 'La extensión aplica clases y filtros locales en el navegador. Pro se valida con un recibo firmado, sin secretos dentro de la extensión.',
    privacyItems: ['Manifest V3 y CSP estricta', 'Recibo Premium con clave pública', 'Tolerancia offline limitada'],
    faqTitle: 'Preguntas frecuentes',
    faqs: [
      ['¿Qué sigue siendo gratis?', 'Fotos de perfil, nombres/números, campo de escritura y censura sólida siguen en Free.'],
      ['¿Qué desbloquea Pro?', 'Mensajes, medios, filtros de datos, Fake Data, PIN de seguridad e intensidad personalizada.'],
      ['¿La extensión lee mis chats?', 'No. La protección visual ocurre localmente en WhatsApp Web; tus chats no se envían para análisis.'],
      ['¿En cuántos dispositivos puedo usarla?', 'La licencia Pro está pensada para hasta 3 dispositivos vinculados.'],
      ['¿Qué pasa si cambio de computador?', 'Puedes pedir un reset por e-mail para activar la licencia en un nuevo navegador.'],
      ['¿Funciona sin conexión?', 'Pro usa un recibo firmado de corta duración y tolerancia offline limitada.']
    ],
    finalTitle: 'Tu pantalla no tiene que revelarlo todo.',
    finalText: 'Instala AgioBlur y haz que WhatsApp Web sea más seguro en público.',
    proPrice: '2.99 EUR',
    footer: '© 2026 AgioBlur. Una herramienta independiente de privacidad visual para WhatsApp Web.'
  },
  de: {
    navInstall: 'Installieren',
    navUpgrade: 'Upgrade Pro',
    eyebrow: 'GEGEN NEUGIERIGE BLICKE',
    headline: 'Dein Chat bleibt dein Chat.',
    lede: 'Verberge automatisch Nachrichten, Namen, Fotos und sensible Informationen in WhatsApp Web, bevor jemand deinen Bildschirm sieht.',
    install: 'Kostenlos installieren',
    proCta: 'Pro entdecken',
    trust: ['Lokal im Browser', '10 Sprachen', 'Free + Pro'],
    trustText: ['Kein Tracking von Gesprächen', 'Globale Oberfläche', 'Kostenlos starten und Pro-Kontrollen freischalten'],
    featuresTitle: 'Klare Schutzfunktionen, schnelle Kontrolle',
    featuresText: 'Free- und Pro-Werkzeuge sind getrennt, damit klar bleibt, was aktiv ist und was freigeschaltet werden kann.',
    features: [
      ['Fotos und Namen', 'Verberge visuelle Details in Chatlisten und Kopfbereichen.'],
      ['Nachrichten und Medien', 'Mit Pro schützt du Text, Bilder, Videos und Dateivorschauen.'],
      ['Datenfilter', 'Erkenne IDs, E-Mails, Telefone, Karten und Zahlungsschlüssel in Nachrichten.']
    ],
    pricingTitle: 'Wähle dein Schutzlevel',
    pricingText: 'Free deckt das Wesentliche ab. Pro schaltet erweiterten Datenschutz für Arbeit, Support und geteilte Räume frei.',
    free: 'Free',
    pro: 'Pro',
    freeDesc: 'Schneller Alltagsschutz.',
    proDesc: 'Für sensible Gespräche.',
    freeItems: ['Profilfotos', 'Namen und Nummern', 'Eingabefeld', 'Solider Zensurmodus'],
    proItems: ['Nachrichten und Medien', 'Datenfilter', 'Fake-Data-Modus', 'PIN und eigene Intensität'],
    startFree: 'Kostenlos starten',
    buyPro: 'Pro kaufen',
    privacyTitle: 'Datenschutz als Standard',
    privacyText: 'Die Erweiterung nutzt lokale Browserklassen und Filter. Pro wird mit einem signierten Beleg geprüft, ohne Geheimnisse in der Erweiterung.',
    privacyItems: ['Manifest V3 und strenge CSP', 'Premium-Beleg mit Public-Key-Prüfung', 'Begrenzte Offline-Toleranz'],
    faqTitle: 'Häufige Fragen',
    faqs: [
      ['Was bleibt kostenlos?', 'Profilfotos, Namen/Nummern, Eingabefeld und solider Zensurmodus bleiben in Free.'],
      ['Was schaltet Pro frei?', 'Nachrichten, Medien, Datenfilter, Fake Data, Sicherheits-PIN und eigene Blur-Intensität.'],
      ['Liest die Erweiterung meine Chats?', 'Nein. Der visuelle Schutz läuft lokal in WhatsApp Web; Chats werden nicht zur Analyse gesendet.'],
      ['Wie viele Geräte sind möglich?', 'Die Pro-Lizenz ist für bis zu 3 verknüpfte Geräte geplant.'],
      ['Was passiert beim Computerwechsel?', 'Du kannst per E-Mail einen Geräte-Reset anfordern und im neuen Browser aktivieren.'],
      ['Funktioniert Pro offline?', 'Pro nutzt einen kurzlebigen signierten Beleg und begrenzte Offline-Toleranz.']
    ],
    finalTitle: 'Dein Bildschirm muss nicht alles preisgeben.',
    finalText: 'Installiere AgioBlur und arbeite sicherer mit WhatsApp Web in der Öffentlichkeit.',
    proPrice: '2.99 EUR',
    footer: '© 2026 AgioBlur. Ein unabhängiges Tool für visuellen Datenschutz für WhatsApp Web.'
  },
  fr: {
    navInstall: 'Installer',
    navUpgrade: 'Passer Pro',
    eyebrow: 'CONTRE LES REGARDS INDISCRETS',
    headline: 'Votre conversation reste la vôtre.',
    lede: 'Floutez automatiquement les messages, noms, photos et informations sensibles dans WhatsApp Web avant que quelqu\'un ne voie votre écran.',
    install: 'Installer gratuitement',
    proCta: 'Découvrir Pro',
    trust: ['Local dans le navigateur', '10 langues', 'Gratuit + Pro'],
    trustText: ['Sans suivi des conversations', 'Interface prête pour le monde entier', 'Commencez gratuitement puis débloquez les contrôles avancés'],
    featuresTitle: 'Protection claire, contrôle rapide',
    featuresText: 'Les outils gratuits et Pro sont séparés pour comprendre ce qui est actif et ce qui peut être débloqué.',
    features: [
      ['Photos et noms', 'Masquez les détails visuels des listes de discussions et en-têtes.'],
      ['Messages et médias', 'Avec Pro, protégez textes, images, vidéos et aperçus de fichiers.'],
      ['Filtres de données', 'Détectez identifiants, e-mails, téléphones, cartes et clés de paiement dans les messages.']
    ],
    pricingTitle: 'Choisissez votre niveau de protection',
    pricingText: 'Gratuit couvre l’essentiel. Pro débloque une confidentialité avancée pour le travail, le support et les espaces partagés.',
    free: 'Gratuit',
    pro: 'Pro',
    freeDesc: 'Confidentialité rapide au quotidien.',
    proDesc: 'Pour les conversations sensibles.',
    freeItems: ['Photos de profil', 'Noms et numéros', 'Champ de saisie', 'Mode censure solide'],
    proItems: ['Messages et médias', 'Filtres de données', 'Mode Fake Data', 'PIN et intensité personnalisée'],
    startFree: 'Commencer gratuitement',
    buyPro: 'Acheter Pro',
    privacyTitle: 'Confidentialité par défaut',
    privacyText: 'L’extension applique localement des classes et filtres dans le navigateur. Pro est validé par reçu signé, sans secret embarqué.',
    privacyItems: ['Manifest V3 et CSP stricte', 'Reçu Premium vérifié par clé publique', 'Tolérance hors ligne limitée'],
    faqTitle: 'Questions fréquentes',
    faqs: [
      ['Qu’est-ce qui reste gratuit ?', 'Photos de profil, noms/numéros, champ de saisie et censure solide restent dans Gratuit.'],
      ['Que débloque Pro ?', 'Messages, médias, filtres de données, Fake Data, PIN de sécurité et intensité personnalisée.'],
      ['L’extension lit-elle mes discussions ?', 'Non. La protection visuelle est locale dans WhatsApp Web; vos discussions ne sont pas envoyées pour analyse.'],
      ['Combien d’appareils puis-je utiliser ?', 'La licence Pro est prévue pour jusqu’à 3 appareils liés.'],
      ['Et si je change d’ordinateur ?', 'Vous pourrez demander une réinitialisation par e-mail pour activer un nouveau navigateur.'],
      ['Pro fonctionne-t-il hors ligne ?', 'Pro utilise un reçu signé de courte durée et une tolérance hors ligne limitée.']
    ],
    finalTitle: 'Votre écran n’a pas besoin de tout révéler.',
    finalText: 'Installez AgioBlur et rendez WhatsApp Web plus sûr en public.',
    proPrice: '2.99 EUR',
    footer: '© 2026 AgioBlur. Un outil indépendant de confidentialité visuelle pour WhatsApp Web.'
  },
  it: {
    navInstall: 'Installa',
    navUpgrade: 'Upgrade Pro',
    eyebrow: 'CONTRO OCCHI INDISCRETI',
    headline: 'La tua chat resta tua.',
    lede: 'Sfoca automaticamente messaggi, nomi, foto e informazioni sensibili su WhatsApp Web prima che qualcuno veda il tuo schermo.',
    install: 'Installa gratis',
    proCta: 'Scopri Pro',
    trust: ['Locale nel browser', '10 lingue', 'Gratis + Pro'],
    trustText: ['Senza tracciare conversazioni', 'Interfaccia pronta per uso globale', 'Inizia gratis e sblocca controlli avanzati'],
    featuresTitle: 'Protezione chiara, controllo rapido',
    featuresText: 'Gli strumenti Free e Pro sono separati per capire cosa è attivo e cosa si può sbloccare.',
    features: [
      ['Foto e nomi', 'Nasconde dettagli visivi da liste chat e intestazioni.'],
      ['Messaggi e media', 'Con Pro protegge testo, immagini, video e anteprime file.'],
      ['Filtri dati', 'Rileva ID, e-mail, telefoni, carte e chiavi di pagamento nei messaggi.']
    ],
    pricingTitle: 'Scegli il tuo livello di protezione',
    pricingText: 'Free copre le basi. Pro sblocca privacy avanzata per lavoro, supporto e spazi condivisi.',
    free: 'Gratis',
    pro: 'Pro',
    freeDesc: 'Privacy rapida quotidiana.',
    proDesc: 'Per conversazioni sensibili.',
    freeItems: ['Foto profilo', 'Nomi e numeri', 'Campo di digitazione', 'Censura solida'],
    proItems: ['Messaggi e media', 'Filtri dati sensibili', 'Modalità Fake Data', 'PIN e intensità personalizzata'],
    startFree: 'Inizia gratis',
    buyPro: 'Acquista Pro',
    privacyTitle: 'Privacy predefinita',
    privacyText: 'L’estensione applica classi e filtri locali nel browser. Pro viene validato con ricevuta firmata, senza segreti nell’estensione.',
    privacyItems: ['Manifest V3 e CSP rigida', 'Ricevuta Premium con chiave pubblica', 'Tolleranza offline limitata'],
    faqTitle: 'Domande frequenti',
    faqs: [
      ['Cosa resta gratis?', 'Foto profilo, nomi/numeri, campo di digitazione e censura solida restano in Free.'],
      ['Cosa sblocca Pro?', 'Messaggi, media, filtri dati, Fake Data, PIN di sicurezza e intensità personalizzata.'],
      ['L’estensione legge le chat?', 'No. La protezione visiva è locale in WhatsApp Web; le chat non vengono inviate per analisi.'],
      ['Quanti dispositivi posso usare?', 'La licenza Pro è pensata per un massimo di 3 dispositivi collegati.'],
      ['Se cambio computer?', 'Puoi richiedere un reset via e-mail per attivare un nuovo browser.'],
      ['Funziona offline?', 'Pro usa una ricevuta firmata a breve durata e tolleranza offline limitata.']
    ],
    finalTitle: 'Il tuo schermo non deve rivelare tutto.',
    finalText: 'Installa AgioBlur e rendi WhatsApp Web più sicuro in pubblico.',
    proPrice: '2.99 EUR',
    footer: '© 2026 AgioBlur. Uno strumento indipendente per la privacy visiva per WhatsApp Web.'
  },
  id: {
    navInstall: 'Instal',
    navUpgrade: 'Tingkatkan Pro',
    eyebrow: 'TERHADAP MATA MENGINTIP',
    headline: 'Obrolan Anda tetap milik Anda.',
    lede: 'Buramkan pesan, nama, foto, dan informasi sensitif secara otomatis di WhatsApp Web sebelum ada yang melihat layar Anda.',
    install: 'Instal gratis',
    proCta: 'Temukan Pro',
    trust: ['Lokal di browser', '10 bahasa', 'Gratis + Pro'],
    trustText: ['Tanpa melacak percakapan', 'Antarmuka siap global', 'Mulai gratis dan buka kontrol lanjutan'],
    featuresTitle: 'Perlindungan jelas, kontrol cepat',
    featuresText: 'Alat Free dan Pro dipisahkan agar pengguna tahu yang aktif dan yang bisa dibuka.',
    features: [
      ['Foto dan nama', 'Sembunyikan detail visual dari daftar chat dan header.'],
      ['Pesan dan media', 'Dengan Pro, lindungi teks, gambar, video, dan pratinjau file.'],
      ['Filter data sensitif', 'Deteksi ID, e-mail, telepon, kartu, dan kunci pembayaran dalam pesan.']
    ],
    pricingTitle: 'Pilih tingkat perlindungan',
    pricingText: 'Free mencakup dasar. Pro membuka privasi lanjutan untuk kerja, dukungan, dan ruang bersama.',
    free: 'Gratis',
    pro: 'Pro',
    freeDesc: 'Privasi cepat untuk harian.',
    proDesc: 'Untuk percakapan sensitif.',
    freeItems: ['Foto profil', 'Nama dan nomor', 'Kolom mengetik', 'Mode sensor solid'],
    proItems: ['Pesan dan media', 'Filter data sensitif', 'Mode Fake Data', 'PIN dan intensitas khusus'],
    startFree: 'Mulai gratis',
    buyPro: 'Beli Pro',
    privacyTitle: 'Privasi sebagai standar',
    privacyText: 'Ekstensi menerapkan kelas dan filter lokal di browser. Pro divalidasi dengan tanda terima bertanda tangan tanpa menyimpan rahasia di ekstensi.',
    privacyItems: ['Manifest V3 dan CSP ketat', 'Tanda terima Premium dengan kunci publik', 'Toleransi offline terbatas'],
    faqTitle: 'Pertanyaan umum',
    faqs: [
      ['Apa yang tetap gratis?', 'Foto profil, nama/nomor, kolom mengetik, dan mode sensor solid tetap tersedia di Free.'],
      ['Apa yang dibuka Pro?', 'Pesan, media, filter data, Fake Data, PIN keamanan, dan intensitas blur khusus.'],
      ['Apakah ekstensi membaca chat?', 'Tidak. Perlindungan visual berjalan lokal di WhatsApp Web; chat tidak dikirim untuk analisis.'],
      ['Berapa perangkat yang bisa dipakai?', 'Lisensi Pro dirancang untuk hingga 3 perangkat tertaut.'],
      ['Bagaimana jika ganti komputer?', 'Anda dapat meminta reset perangkat lewat e-mail untuk mengaktifkan browser baru.'],
      ['Apakah bisa offline?', 'Pro memakai tanda terima bertanda tangan berdurasi pendek dan toleransi offline terbatas.']
    ],
    finalTitle: 'Layar Anda tidak harus menampilkan semuanya.',
    finalText: 'Instal AgioBlur dan jadikan WhatsApp Web lebih aman di tempat umum.',
    proPrice: 'Rp 29.000 IDR',
    footer: '© 2026 AgioBlur. Alat privasi visual independen untuk WhatsApp Web.'
  },
  tr: {
    navInstall: 'Yükle',
    navUpgrade: 'Pro Sürümüne Geç',
    eyebrow: 'MERAKLI GÖZLERE KARŞI',
    headline: 'Sohbetiniz sizin kalır.',
    lede: 'Birisi ekranınızı görmeden önce WhatsApp Web\'deki mesajları, isimleri, fotoğrafları ve hassas bilgileri otomatik olarak bulanıklaştırın.',
    install: 'Ücretsiz yükle',
    proCta: 'Pro\'yu Keşfet',
    trust: ['Tarayıcıda yerel', '10 dil', 'Ücretsiz + Pro'],
    trustText: ['Konuşma takibi yok', 'Küresel kullanıma hazır arayüz', 'Ücretsiz başlayın, gelişmiş kontrolleri açın'],
    featuresTitle: 'Net koruma, hızlı kontrol',
    featuresText: 'Free ve Pro araçları ayrıdır; neyin aktif olduğu ve neyin açılabileceği nettir.',
    features: [
      ['Fotoğraflar ve adlar', 'Sohbet listeleri ve başlıklardaki görsel ayrıntıları gizleyin.'],
      ['Mesajlar ve medya', 'Pro ile metinleri, görselleri, videoları ve dosya önizlemelerini koruyun.'],
      ['Veri filtreleri', 'Mesajlarda kimlik, e-posta, telefon, kart ve ödeme anahtarlarını tespit edin.']
    ],
    pricingTitle: 'Koruma seviyenizi seçin',
    pricingText: 'Free temel korumayı sunar. Pro iş, destek ve ortak alanlar için gelişmiş gizliliği açar.',
    free: 'Ücretsiz',
    pro: 'Pro',
    freeDesc: 'Günlük hızlı gizlilik.',
    proDesc: 'Hassas konuşmalar için.',
    freeItems: ['Profil fotoğrafları', 'Adlar ve numaralar', 'Yazma alanı', 'Katı sansür modu'],
    proItems: ['Mesajlar ve medya', 'Hassas veri filtreleri', 'Fake Data modu', 'PIN ve özel yoğunluk'],
    startFree: 'Ücretsiz başla',
    buyPro: 'Pro satın al',
    privacyTitle: 'Varsayılan gizlilik',
    privacyText: 'Uzantı tarayıcıda yerel sınıflar ve filtreler uygular. Pro erişimi, uzantıya sır koymadan imzalı makbuzla doğrulanır.',
    privacyItems: ['Manifest V3 ve sıkı CSP', 'Açık anahtarla Premium makbuz doğrulama', 'Sınırlı çevrimdışı tolerans'],
    faqTitle: 'Sık sorulan sorular',
    faqs: [
      ['Neler ücretsiz kalır?', 'Profil fotoğrafları, adlar/numaralar, yazma alanı ve katı sansür modu Free’de kalır.'],
      ['Pro neyi açar?', 'Mesajlar, medya, veri filtreleri, Fake Data, güvenlik PIN’i ve özel bulanıklık yoğunluğu.'],
      ['Uzantı sohbetlerimi okur mu?', 'Hayır. Görsel koruma WhatsApp Web’de yerel çalışır; sohbetler analiz için gönderilmez.'],
      ['Kaç cihaz kullanabilirim?', 'Pro lisansı en fazla 3 bağlı cihaz için planlandı.'],
      ['Bilgisayar değiştirirsem?', 'Yeni tarayıcıda etkinleştirmek için e-posta ile cihaz sıfırlama isteyebilirsiniz.'],
      ['Çevrimdışı çalışır mı?', 'Pro kısa süreli imzalı makbuz ve sınırlı çevrimdışı tolerans kullanır.']
    ],
    finalTitle: 'Ekranınız her şeyi açığa vurmak zorunda değil.',
    finalText: 'AgioBlur\'u yükleyerek WhatsApp Web\'i halka açık alanlarda daha güvenli hale getirin.',
    proPrice: '₺59 TRY',
    footer: '© 2026 AgioBlur. WhatsApp Web için bağımsız bir görsel gizlilik aracı.'
  },
  hi: {
    navInstall: 'इंस्टॉल करें',
    navUpgrade: 'Upgrade Pro',
    eyebrow: 'ताक-झांक करने वालों के खिलाफ',
    headline: 'आपकी बातचीत आपकी ही रहती है।',
    lede: 'किसी के आपकी स्क्रीन देखने से पहले WhatsApp Web पर संदेशों, नामों, फ़ोटो और संवेदनशील जानकारी को स्वचालित रूप से धुंधला करें।',
    install: 'मुफ्त में इंस्टॉल करें',
    proCta: 'Pro को जानें',
    trust: ['Browser में local', '10 भाषाएं', 'Free + Pro'],
    trustText: ['Conversations tracking नहीं', 'Global use के लिए interface', 'Free शुरू करें और advanced controls खोलें'],
    featuresTitle: 'Clear protection, fast control',
    featuresText: 'Free और Pro tools अलग हैं ताकि user समझ सके क्या active है और क्या unlock हो सकता है।',
    features: [
      ['Photos और names', 'Chat list और headers में visual details छिपाएं।'],
      ['Messages और media', 'Pro में text, images, videos और file previews protect करें।'],
      ['Sensitive data filters', 'Messages में IDs, e-mails, phones, cards और payment keys detect करें।']
    ],
    pricingTitle: 'अपना protection level चुनें',
    pricingText: 'Free basic privacy देता है। Pro work, support और shared spaces के लिए advanced privacy खोलता है।',
    free: 'Free',
    pro: 'Pro',
    freeDesc: 'Daily quick privacy.',
    proDesc: 'Sensitive conversations के लिए.',
    freeItems: ['Profile photos', 'Names और numbers', 'Typing field', 'Solid censor mode'],
    proItems: ['Messages और media', 'Sensitive-data filters', 'Fake Data mode', 'PIN और custom intensity'],
    startFree: 'Free शुरू करें',
    buyPro: 'Pro खरीदें',
    privacyTitle: 'Privacy by default',
    privacyText: 'Extension browser में local classes और filters लगाता है। Pro access signed receipt से validate होता है, बिना extension में secret रखने के।',
    privacyItems: ['Manifest V3 और strict CSP', 'Public-key verification वाला Premium receipt', 'Limited offline tolerance'],
    faqTitle: 'अक्सर पूछे जाने वाले सवाल',
    faqs: [
      ['Free में क्या रहेगा?', 'Profile photos, names/numbers, typing field और solid censor mode Free में उपलब्ध रहेंगे।'],
      ['Pro क्या unlock करता है?', 'Messages, media, data filters, Fake Data, security PIN और custom blur intensity।'],
      ['क्या extension मेरी chats पढ़ता है?', 'नहीं। Visual protection WhatsApp Web में local चलती है; chats analysis के लिए नहीं भेजी जातीं।'],
      ['कितने devices इस्तेमाल कर सकता हूं?', 'Pro license अधिकतम 3 linked devices के लिए planned है।'],
      ['Computer बदलने पर क्या होगा?', 'नए browser में activate करने के लिए e-mail device reset request कर सकते हैं।'],
      ['क्या offline काम करता है?', 'Pro short-lived signed receipt और limited offline tolerance इस्तेमाल करता है।']
    ],
    finalTitle: 'आपकी स्क्रीन को सब कुछ दिखाने की आवश्यकता नहीं है।',
    finalText: 'AgioBlur इंस्टॉल करें और सार्वजनिक रूप से WhatsApp Web को सुरक्षित बनाएं।',
    proPrice: '₹149 INR',
    footer: '© 2026 AgioBlur. WhatsApp Web के लिए एक स्वतंत्र दृश्य गोपनीयता उपकरण.'
  },
  ar: {
    navInstall: 'تثبيت',
    navUpgrade: 'الترقية إلى Pro',
    eyebrow: 'ضد العيون المتطفلة',
    headline: 'محادثتك تبقى لك.',
    lede: 'قم تلقائيًا بتعتيم الرسائل والأسماء والصور والمعلومات الحساسة على WhatsApp Web قبل أن يرى أي شخص شاشتك.',
    install: 'تثبيت مجاني',
    proCta: 'اكتشف Pro',
    trust: ['محلي داخل المتصفح', '10 لغات', 'مجاني + Pro'],
    trustText: ['بدون تتبع للمحادثات', 'واجهة جاهزة للاستخدام العالمي', 'ابدأ مجاناً وافتح أدوات متقدمة'],
    featuresTitle: 'حماية واضحة وتحكم سريع',
    featuresText: 'تم فصل أدوات Free وPro حتى يعرف المستخدم ما هو نشط وما يمكن فتحه.',
    features: [
      ['الصور والأسماء', 'إخفاء التفاصيل المرئية من قوائم المحادثات والرؤوس.'],
      ['الرسائل والوسائط', 'مع Pro يمكنك حماية النصوص والصور والفيديوهات ومعاينات الملفات.'],
      ['فلاتر البيانات', 'اكتشاف المعرفات والبريد والهاتف والبطاقات ومفاتيح الدفع داخل الرسائل.']
    ],
    pricingTitle: 'اختر مستوى الحماية',
    pricingText: 'Free يغطي الأساسيات. Pro يفتح خصوصية متقدمة للعمل والدعم والمساحات المشتركة.',
    free: 'مجاني',
    pro: 'Pro',
    freeDesc: 'خصوصية سريعة يومياً.',
    proDesc: 'للمحادثات الحساسة.',
    freeItems: ['صور الملف الشخصي', 'الأسماء والأرقام', 'حقل الكتابة', 'وضع حجب صلب'],
    proItems: ['الرسائل والوسائط', 'فلاتر البيانات الحساسة', 'وضع Fake Data', 'PIN وشدة مخصصة'],
    startFree: 'ابدأ مجاناً',
    buyPro: 'شراء Pro',
    privacyTitle: 'الخصوصية افتراضياً',
    privacyText: 'تطبق الإضافة فلاتر محلية داخل المتصفح. يتم التحقق من Pro بإيصال موقّع بدون وضع أسرار داخل الإضافة.',
    privacyItems: ['Manifest V3 وCSP صارمة', 'إيصال Premium يتحقق بمفتاح عام', 'سماحية محدودة دون اتصال'],
    faqTitle: 'أسئلة شائعة',
    faqs: [
      ['ما الذي يبقى مجانياً؟', 'صور الملف الشخصي والأسماء/الأرقام وحقل الكتابة ووضع الحجب الصلب تبقى في Free.'],
      ['ماذا يفتح Pro؟', 'الرسائل والوسائط وفلاتر البيانات وFake Data وPIN الأمان وشدة تمويه مخصصة.'],
      ['هل تقرأ الإضافة محادثاتي؟', 'لا. الحماية البصرية تعمل محلياً في WhatsApp Web ولا تُرسل محادثاتك للتحليل.'],
      ['كم جهازاً يمكنني استخدامه؟', 'تم التخطيط لترخيص Pro حتى 3 أجهزة مرتبطة.'],
      ['ماذا لو غيرت الكمبيوتر؟', 'يمكنك طلب إعادة ضبط الأجهزة عبر البريد لتفعيل الترخيص في متصفح جديد.'],
      ['هل يعمل Pro دون اتصال؟', 'يستخدم Pro إيصالاً موقّعاً قصير المدة وسماحية محدودة دون اتصال.']
    ],
    finalTitle: 'لا يجب أن تكشف شاشتك كل شيء.',
    finalText: 'قم بتثبيت AgioBlur واجعل WhatsApp Web أكثر أمانًا في الأماكن العامة.',
    proPrice: '$2.99 USD',
    footer: '© 2026 AgioBlur. أداة خصوصية بصرية مستقلة لـ WhatsApp Web.'
  }
};

function contentFor(locale) {
  return CONTENT[locale] || CONTENT.en;
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
  const currentLanguage = LANGUAGES.find(([code]) => code === locale) || LANGUAGES[1];

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
            <div class="language-picker">
              <button class="language-trigger" type="button" aria-haspopup="listbox" aria-expanded="false">
                <span>${currentLanguage[1]}</span>
              </button>
              <div class="language-menu" role="listbox" hidden>
                ${LANGUAGES.map(([code, label]) => `<button type="button" role="option" aria-selected="${code === locale}" data-lang="${code}"><span>${label}</span></button>`).join('')}
              </div>
            </div>
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
              ${t.trust.map((item, index) => `<div class="trust-item"><span>${index + 1}</span><strong>${item}</strong><small>${t.trustText[index]}</small></div>`).join('')}
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
                <div class="plan-price"><strong>${t.proPrice}</strong><span></span></div>
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

  const languagePicker = document.querySelector('.language-picker');
  const trigger = document.querySelector('.language-trigger');
  const menu = document.querySelector('.language-menu');

  trigger?.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!expanded));
    menu.hidden = expanded;
  });

  menu?.addEventListener('click', event => {
    const button = event.target.closest('[data-lang]');
    if (!button) return;
    location.href = `../${button.dataset.lang}/`;
  });

  document.addEventListener('click', event => {
    if (languagePicker?.contains(event.target)) return;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (menu) menu.hidden = true;
  });
}

render();
