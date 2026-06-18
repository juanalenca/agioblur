# AgioBlur | WhatsApp Privacy Blur

<div align="center">
  <img src="icons/icon128.png" alt="AgioBlur Logo" width="128" />
</div>

<br />

**AgioBlur** é uma extensão de navegador focada em privacidade para usuários do WhatsApp Web. Através de um design arquitetural reativo, ela censura visualmente (através de *blur*) conteúdos sensíveis como fotos de perfil, nomes de contatos, mensagens recebidas/enviadas, mídias (fotos e vídeos) e o próprio campo de digitação. 

O foco central desta ferramenta é garantir a privacidade física contra *shoulder surfers* e curiosos enquanto o usuário utiliza o WhatsApp Web em ambientes públicos, corporativos ou compartilhados.

---

## 🚀 Funcionalidades

- **Controle Granular por Categoria:** Escolha o que você deseja censurar (Fotos, Nomes, Mensagens, Mídias, Campo de Texto).
- **Filtros Inteligentes (PII / LGPD):** Ocultação cirúrgica e automática de CPFs, E-mails, Cartões de Crédito, Telefones e Chaves Pix misturados no meio dos textos.
- **Suporte Global (i18n):** Tradução nativa adaptável para 5 idiomas (Português, Inglês, Espanhol, Hindi e Indonésio).
- **Tarja Preta (Solid Mode):** Substitua o efeito de *blur* clássico por uma tarja preta sólida para ocultação absoluta.
- **Modo Fake Data:** Mascare nomes de contatos e textos de mensagens substituindo-os por nomes aleatórios de acordo com a cultura local (ex: João, John, Juan, Budi, राहुल).
- **Segurança Criptografada:** Defina uma senha (criptografada em SHA-256) para impedir que terceiros desativem a extensão ou usem o *hover* do mouse para ler as mensagens.

---

## 🧠 Estudo de Caso (Case Study) e Arquitetura

O AgioBlur foi construído utilizando as melhores práticas para WebExtensions (Manifest V3), enfrentando e solucionando desafios técnicos profundos em torno da reatividade de frameworks modernos como o React (utilizado nativamente no WhatsApp Web).

### 1. Arquitetura Modular

A extensão adota um padrão de arquitetura dividida, separando estritamente as responsabilidades:

- **Storage e Estado Global:** Comunicação isolada via `chrome.storage.local`. A lógica não lê o estado diretamente do DOM. Sempre que uma chave é atualizada, ouvintes (listeners) propagam a mudança do *Popup* para o *Content Script*.
- **Manipulação de DOM Estrita:** O módulo de DOM atua como uma máquina de estado puro. Recebe o estado do módulo pai e aplica classes CSS de forma performática.
- **Content Scripts:** `constants.js`, `state.js`, `dom.js`, `main.js`.
- **Popup Scripts:** `constants.js`, `state.js`, `ui.js`, `storage.js`, `main.js`.

### 2. Desafio Técnico: Instabilidade de Seletores no React

**O Problema:** 
O WhatsApp Web sofre alterações frequentes em sua estrutura HTML e classes. Utilizar seletores CSS muito específicos ou baseados em classes minificadas (como `.x1y2z3`) causava quebras constantes na extensão. Além disso, o React recria o DOM com frequência.

**A Solução:** 
Implementamos seletores baseados em propriedades semânticas nativas do WhatsApp Web, como os atributos `data-testid`, `role` e comportamentos fixos (ex: `img[draggable="false"]` em áreas de avatares). Para evitar vazamentos de memória e sobreposições, a extensão trabalha primariamente aplicando classes no nó raiz do elemento, em vez de tentar embrulhar textos.

### 3. Desafio Técnico: Performance e "Jank" com MutationObserver

**O Problema:** 
O WhatsApp Web renderiza dezenas de mensagens por segundo ao rolar o histórico de um chat ativo. Um `MutationObserver` escutando a tag `<body>` para cada alteração na árvore e varrendo a página inteira com `querySelectorAll` derrubava o framerate a 5fps, causando lentidão extrema (*jank*).

**A Solução:**
- **Observadores Focados:** Em vez de observar o `document.body`, criamos a função `findAndObserveContainers()` que escuta as montagens de React (`[data-testid="conversation-panel-body"]`, `#pane-side`) e prende o `MutationObserver` apenas nessas subárvores.
- **De-bounce de Varredura:** O `scanAndApply` analisa apenas os nós afetados inseridos no lote `addedNodes`, ignorando os já renderizados.
- **Pooling Inteligente e IdleCallbacks:** Implementamos um fallback usando `requestIdleCallback()` que faz re-scans lentos a cada 2 segundos quando a CPU está ociosa, consertando *fringe cases* sem bloquear a renderização (60fps garantido).

### 4. Controle de Privacidade com PIN e Hover Lock

Para a funcionalidade de Bloqueio por Senha, foi necessário impedir que um espião apagasse as regras CSS no DevTools. A solução consistiu em amarrar a classe pai `.wpb-locked` diretamente no `<body>`. Quando o PIN está ativo, o *hover* do CSS é desligado. O PIN em si nunca fica salvo em texto puro; nós utilizamos a API **SubtleCrypto** (Web Crypto API) nativa do navegador para "hashear" a senha em **SHA-256**.

### 5. Blindagem Absoluta (Strict CSP)

Para garantir que a extensão pudesse passar no crivo mais alto de segurança da Chrome Web Store, o projeto foi arquitetado sem dependências ou importações externas. No `manifest.json`, aplicamos uma **Política de Segurança de Conteúdo (CSP) Hiper-Restritiva** (`script-src 'self'; object-src 'none'; base-uri 'none';`), mitigando em 100% ataques de injeção de scripts (XSS).

---

## 🛠️ DevOps e Integração Contínua (CI/CD)

Este projeto utiliza **GitHub Actions** para automação de processos, assegurando qualidade de código e empacotamento ágil para *releases*:

- **ESLint Pipeline:** A cada `push` ou PR na branch `main`, a action verifica o código buscando inconsistências em relação aos guias de estilo rígidos definidos (ESLint 9.x com análise sintática de módulos e globais).
- **Auto Release Build:** Ao criar uma Tag Git (`v*`), o GitHub Action processa e empacota a extensão, removendo arquivos de testes, fontes locais `.git` e documentação de desenvolvedor, anexando o `agioblur-vX.X.X.zip` diretamente na aba *Releases*, pronto para upload na Chrome Web Store.

---

## 📥 Como Instalar (Desenvolvimento)

1. Baixe a versão compactada (`.zip`) em **Releases** ou clone este repositório.
2. Acesse `chrome://extensions` (ou `edge://extensions`) em seu navegador.
3. Ative o **Modo do Desenvolvedor** no canto superior direito.
4. Clique em **Carregar sem compactação** (Load unpacked) e selecione a pasta raiz da extensão.
5. Acesse o [WhatsApp Web](https://web.whatsapp.com) e o AgioBlur estará ativo!

---

## Licença

Este projeto está sob a licença **PolyForm Noncommercial 1.0.0**. O código fonte está disponível para fins de estudo, testes e contribuições. O uso comercial, redistribuição paga ou cópias com fins lucrativos são estritamente proibidos.

Essa configuração garante a segurança jurídica necessária para prosseguir com o desenvolvimento dos módulos Premium (como o Modo Fake Data e Bloqueio por PIN) sem o risco de clonagem comercial desautorizada.
