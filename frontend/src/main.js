import './styles.css';
import { registerSW } from 'virtual:pwa-register';
import { LocalRepository } from './data/database.js';
import { createOffer, groupOffers, validateOffer } from './domain/offers.js';
import { interpretOffer } from './services/interpretation.js';
import { escapeHtml, lotCard, offerCard } from './ui/templates.js';

const repository = new LocalRepository();
const state = {
  view: 'home',
  offers: [],
  profile: null,
  editing: null,
  suggestion: false,
  busy: false,
  message: null,
  isListening: false,
};

let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    state.isListening = false;
    state.view = 'new';
    state.editing = { ...(state.editing ?? {}), sourceText: transcript };
    state.message = { type: 'success', text: `Voz capturada: "${transcript}". Clique em "Interpretar com Gemma".` };
    render();
  };

  recognition.onerror = () => {
    state.isListening = false;
    state.message = { type: 'error', text: 'Não foi possível ouvir a voz. Tente falar novamente ou digite no campo de texto.' };
    render();
  };

  recognition.onend = () => {
    if (state.isListening) {
      state.isListening = false;
      render();
    }
  };
}

const app = document.querySelector('#app');

registerSW({
  onNeedRefresh() {
    state.message = { type: 'info', text: 'Há uma atualização pronta. Reabra o aplicativo quando puder.' };
    render();
  },
  onOfflineReady() {
    state.message = { type: 'success', text: 'Aplicativo pronto para funcionar sem internet.' };
    render();
  },
});

function connectionLabel() {
  return navigator.onLine
    ? '<span aria-hidden="true">●</span> Com internet'
    : '<span aria-hidden="true">○</span> Modo Offline — dados seguros localmente';
}

function layout(content) {
  const isOffline = !navigator.onLine;
  return `
    ${isOffline ? `
      <div class="offline-banner" role="status">
        <span aria-hidden="true">⚠️</span>
        <span>Você está offline. Suas ofertas e lotes continuam salvos e acessíveis neste aparelho.</span>
      </div>` : ''}
    <header class="app-header">
      <a class="brand" href="#home" data-view="home" aria-label="SemeIA, ir para o início">
        <img class="brand-icon" src="/assets/semeia/app-icon.png" alt="" />
        <span><strong>Seme<span>IA</span></strong><small>Agricultura Familiar Amazônica</small></span>
      </a>
      <span class="connection ${navigator.onLine ? 'is-online' : 'is-offline'}" role="status">${connectionLabel()}</span>
    </header>
    <main id="conteudo" tabindex="-1" style="display: flex; flex-direction: column; gap: 1.5rem;">
      ${state.message ? `<div class="toast toast-${state.message.type}" role="status">${escapeHtml(state.message.text)}<button type="button" data-dismiss aria-label="Fechar aviso">×</button></div>` : ''}
      ${content}
    </main>
    <button class="voice-fab ${state.isListening ? 'is-listening' : ''}" type="button" id="voice-fab-btn" aria-label="Falar com a SemeIA por voz">
      <img class="voice-fab-icon" src="/assets/semeia/icons/assistente-ia.png" alt="" />
      <span>${state.isListening ? 'Ouvindo…' : 'Falar oferta'}</span>
    </button>
    <nav class="bottom-nav" aria-label="Navegação principal">
      ${navButton('home', '⌂', 'Início')}
      ${navButton('roça', '⌁', 'Roça')}
      ${navButton('mercado', '↗', 'Mercado')}
      ${navButton('comunidade', '●●', 'Comunidade')}
    </nav>`;
}

function navButton(view, icon, label) {
  const roçaViews = ['roça', 'new', 'offers', 'lots'];
  const active = state.view === view || (view === 'roça' && roçaViews.includes(state.view));
  return `<button type="button" data-view="${view}" ${active ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</button>`;
}

function homeView() {
  const available = state.offers.filter((offer) => offer.status === 'disponivel').length;
  const lots = groupOffers(state.offers).length;
  const firstName = state.profile?.nome ? escapeHtml(state.profile.nome.split(' ')[0]) : null;

  return `
    <section class="hero">
      <div>
        <h1>${firstName ? `Bom dia, ${firstName}!` : 'Bem-vindo ao SemeIA'}</h1>
        <p>Registre sua produção em linguagem natural, organize suas ofertas e forme lotes coletivos com outros produtores da sua comunidade.</p>
        <button class="button button-primary button-large" type="button" data-view="new">Cadastrar nova oferta</button>
      </div>
      <div class="hero-summary" aria-label="Resumo das ofertas">
        <div><strong>${available}</strong><span>ofertas ativas</span></div>
        <div><strong>${lots}</strong><span>lotes coletivos</span></div>
      </div>
    </section>

    <section class="section-grid section-grid-single">
      <article class="panel">
        <div class="section-heading">
          <div><p class="eyebrow">Dispositivo local</p><h2>Perfil do Produtor</h2></div>
          <img class="soft-icon" src="/assets/semeia/icons/producao.png" alt="" />
        </div>
        <form id="profile-form" class="compact-form">
          <label>Seu nome<input name="nome" maxlength="80" value="${escapeHtml(state.profile?.nome)}" placeholder="Ex.: José Silva" required></label>
          <label>Local<input name="local" maxlength="100" value="${escapeHtml(state.profile?.local)}" placeholder="Ex.: Local Val Paraíso" required></label>
          <label>Contato <span class="optional">opcional</span><input name="contato" maxlength="80" value="${escapeHtml(state.profile?.contato)}" placeholder="Telefone ou recado"></label>
          <button class="button button-secondary" type="submit">Salvar perfil</button>
        </form>
      </article>
    </section>

    <section class="quick-grid">
      <div class="quick-card" data-view="roça">
        <div class="quick-card-header">
          <img class="quick-icon" src="/assets/semeia/icons/cultivo.png" alt="" />
          <h3>Minha Roça</h3>
        </div>
        <p>Registre a produção e acompanhe suas ofertas e lotes.</p>
      </div>
      <div class="quick-card" data-view="mercado">
        <div class="quick-card-header">
          <img class="quick-icon" src="/assets/semeia/icons/comercializacao.png" alt="" />
          <h3>Mercado</h3>
        </div>
        <p>Veja oportunidades demonstrativas e prepare sua venda.</p>
      </div>
      <div class="quick-card" data-view="comunidade">
        <div class="quick-card-header">
          <img class="quick-icon" src="/assets/semeia/icons/comunidade.png" alt="" />
          <h3>Comunidade</h3>
        </div>
        <p>Acompanhe trocas e ações coletivas da região.</p>
      </div>
      <div class="quick-card" data-view="aprender">
        <div class="quick-card-header">
          <img class="quick-icon" src="/assets/semeia/icons/capacitacao.png" alt="" />
          <h3>Capacitação</h3>
        </div>
        <p>Aprenda a cadastrar e organizar uma oferta clara.</p>
      </div>
    </section>

    <section class="daily-highlight">
      <div>
        <p class="eyebrow">Dica para vender melhor</p>
        <h2>Descreva sua produção do seu jeito</h2>
        <p>Diga o produto, a quantidade, o local e até quando pode entregar. A SemeIA organiza os campos e você confirma antes de salvar.</p>
        <br>
        <button class="button button-sun" type="button" data-view="new">Registrar com a SemeIA <span aria-hidden="true">→</span></button>
      </div>
      <img src="/assets/semeia/icons/assistente-ia.png" alt="" />
    </section>;`
}

function roçaView() {
  const available = state.offers.filter((offer) => offer.status === 'disponivel').length;
  const lots = groupOffers(state.offers).length;
  return `
    <section class="page-intro page-intro-row">
      <div><p class="eyebrow">Minha produção</p><h1>Minha Roça</h1><p>Registre o que colheu, acompanhe suas ofertas e participe de lotes coletivos.</p></div>
      <button class="button button-primary" type="button" data-view="new">+ Nova oferta</button>
    </section>
    <section class="crop-overview">
      <div><p class="eyebrow">Resumo neste aparelho</p><h2>Sua produção organizada</h2><p>Os dados continuam disponíveis mesmo quando a internet oscila.</p></div>
      <div class="crop-stats"><span><strong>${available}</strong> ofertas ativas</span><span><strong>${lots}</strong> lotes formados</span></div>
    </section>
    <section class="feature-grid">
      <article class="portal-card"><img src="/assets/semeia/icons/producao.png" alt="" /><div><p class="eyebrow">Produção</p><h2>Cadastrar colheita</h2><p>Fale ou escreva uma oferta e revise os dados sugeridos pela IA.</p></div><button class="button button-primary" type="button" data-view="new">Cadastrar</button></article>
      <article class="portal-card"><img src="/assets/semeia/icons/cultivo.png" alt="" /><div><p class="eyebrow">No aparelho</p><h2>Minhas ofertas</h2><p>Consulte, edite ou encerre registros salvos localmente.</p></div><button class="button button-secondary" type="button" data-view="offers">Ver ofertas</button></article>
      <article class="portal-card"><img src="/assets/semeia/icons/comunidade.png" alt="" /><div><p class="eyebrow">Venda coletiva</p><h2>Lotes da comunidade</h2><p>Veja ofertas compatíveis agrupadas por produto, local e semana.</p></div><button class="button button-secondary" type="button" data-view="lots">Ver lotes</button></article>
    </section>`;
}

function mercadoView() {
  return `
    <section class="page-intro"><p class="eyebrow">Mercado e oportunidades</p><h1>Venda com mais organização</h1><p>Esta área demonstra como oportunidades e referências de comercialização poderão aparecer no SemeIA.</p></section>
    <section class="market-opportunity">
      <img src="/assets/semeia/icons/comercializacao.png" alt="" />
      <div><p class="eyebrow">Oportunidade da semana</p><h2>Feira da Economia Solidária</h2><p>Sábado, das 7h às 13h · exemplo para apresentação do protótipo.</p></div>
      <button class="button button-primary" type="button" data-view="offers">Ver o que posso oferecer</button>
    </section>
    <div class="section-heading portal-heading"><div><p class="eyebrow">Referências fictícias</p><h2>Produtos da demonstração</h2></div></div>
    <section class="market-list">
      ${marketRow('Açaí', 'Lata de 14 kg', 'R$ 92,00', 'comercializacao.png')}
      ${marketRow('Macaxeira', 'Quilo', 'R$ 4,80', 'producao.png')}
      ${marketRow('Farinha', 'Quilo', 'R$ 12,80', 'cultivo.png')}
    </section>
    <section class="feature-grid compact-feature-grid">
      <article class="portal-card"><div><p class="eyebrow">Preço justo</p><h2>Organize seus custos</h2><p>Anote produção, transporte, embalagem e tempo de trabalho antes de negociar.</p></div><button class="button button-secondary" type="button" data-view="aprender">Aprender como</button></article>
      <article class="portal-card"><div><p class="eyebrow">Mais volume</p><h2>Venda em conjunto</h2><p>Confira os lotes coletivos formados com ofertas compatíveis.</p></div><button class="button button-secondary" type="button" data-view="lots">Ver lotes</button></article>
    </section>`;
}

function marketRow(product, unit, price, icon) {
  return `<article class="market-row"><img src="/assets/semeia/icons/${icon}" alt="" /><div><strong>${product}</strong><span>${unit}</span></div><div><strong>${price}</strong><span>valor fictício</span></div></article>`;
}

function comunidadeView() {
  return `
    <section class="page-intro"><p class="eyebrow">Comunidade</p><h1>Ninguém produz sozinho</h1><p>Uma visão demonstrativa das trocas entre famílias produtoras, associações e cooperativas.</p></section>
    <section class="community-event"><img src="/assets/semeia/icons/comunidade.png" alt="" /><div><p class="eyebrow">Encontro fictício</p><h2>Roda de conversa sobre comercialização</h2><p>Sexta-feira, às 16h · Associação Semeia.</p></div><button class="button button-primary" type="button" data-view="roça">Preparar minha oferta</button></section>
    <section class="community-feed">
      <article class="community-post"><span class="member-avatar">MR</span><div><strong>Maria Ribeiro</strong><small>Produtora · exemplo</small><p>Tenho macaxeira disponível nesta semana. Quem mais vai entregar na sexta?</p><button class="button button-quiet" type="button" data-view="lots">Conferir lotes</button></div></article>
      <article class="community-post"><span class="member-avatar member-avatar-green">AP</span><div><strong>Associação do Panorama</strong><small>Cooperativa · exemplo</small><p>Estamos reunindo ofertas para completar o transporte coletivo.</p><button class="button button-quiet" type="button" data-view="offers">Ver minhas ofertas</button></div></article>
    </section>`;
}

function aprenderView() {
  return `
    <section class="page-intro"><p class="eyebrow">Capacitação</p><h1>Conhecimento que ajuda a vender</h1><p>Conteúdos curtos para usar o SemeIA e organizar melhor suas ofertas.</p></section>
    <section class="learning-hero"><img src="/assets/semeia/icons/capacitacao.png" alt="" /><div><p class="eyebrow">Guia rápido</p><h2>Como criar uma oferta clara</h2><p>Aprenda quais informações ajudam a IA e os compradores a entender sua produção.</p></div><button class="button button-primary" type="button" data-view="guia">Começar</button></section>
    <section class="lesson-list">
      <article><span>01</span><div><strong>Diga o nome do produto</strong><small><br />Exemplo: macaxeira, açaí ou farinha</small></div></article>
      <article><span>02</span><div><strong>Informe quantidade e unidade</strong><small><br />Exemplo: 30 quilos ou 4 caixas</small></div></article>
      <article><span>03</span><div><strong>Confirme local e prazo</strong><small><br />Revise tudo antes de salvar no aparelho</small></div></article>
    </section>`;
}

function guiaView() {
  return `
    <section class="page-intro"><button class="back-link" type="button" data-view="aprender">← Voltar para capacitação</button><p class="eyebrow">Guia em 3 passos</p><h1>Registre uma oferta completa</h1><p>Uma frase simples já é suficiente para começar.</p></section>
    <section class="guide-example"><span>Exemplo</span><p>“Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso.”</p></section>
    <section class="guide-steps">
      <article><span>1</span><div><h2>Fale ou escreva</h2><p>Use palavras do seu dia a dia. Não é preciso preencher tudo de uma vez.</p></div></article>
      <article><span>2</span><div><h2>Confira a sugestão</h2><p>A SemeIA organiza produto, quantidade, unidade, local e prazo.</p></div></article>
      <article><span>3</span><div><h2>Confirme antes de salvar</h2><p>Corrija qualquer informação e só então grave a oferta no aparelho.</p></div></article>
    </section>
    <button class="button button-primary button-large" type="button" data-view="new">Cadastrar minha oferta</button>`;
}

function offerFormView() {
  const offer = state.editing ?? {};
  const isEditing = Boolean(offer.id);
  return `
    <section class="page-intro">
      <button class="back-link" type="button" data-view="offers">← Voltar para ofertas</button>
      <p class="eyebrow">${isEditing ? 'Atualizar registro' : 'Assistente inteligente SemeIA'}</p>
      <h1>${isEditing ? 'Editar oferta' : 'O que você colheu hoje?'}</h1>
      <p>Escreva como fala ou use o botão de microfone para ditar sua oferta.</p>
    </section>
    <section class="form-shell">
      <div class="natural-input">
        <label for="offer-text"><span class="step-number">1</span> Descreva sua oferta em linguagem natural</label>
        <textarea id="offer-text" rows="3" maxlength="500" placeholder="Ex.: Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso.">${escapeHtml(offer.sourceText)}</textarea>
        <div class="input-footer">
          <span>A IA extrai o produto, quantidade, unidade e localidade.</span>
          <button class="button button-ai" type="button" data-interpret ${state.busy ? 'disabled' : ''}>
            ${state.busy ? '<span class="spinner" aria-hidden="true"></span> Interpretando…' : '✦ Extrair com Gemma'}
          </button>
        </div>
      </div>
      <div class="divider"><span>ou revise os dados abaixo</span></div>
      <form id="offer-form" novalidate>
        <div class="form-heading"><span class="step-number">2</span><div><h2>Confirmação humana</h2><p>${state.suggestion ? 'Sugestão da IA — confira os campos antes de gravar.' : 'Preencha ou ajuste as informações.'}</p></div></div>
        ${state.suggestion ? '<div class="ai-notice" role="status">✦ Os campos abaixo foram preenchidos pela IA. Verifique e confirme.</div>' : ''}
        <div class="field-grid">
          ${field('produto', 'Produto', offer.produto, 'Macaxeira', 'text', true, 'maxlength="80"')}
          ${field('quantidade', 'Quantidade', offer.quantidade, '30', 'number', true, 'min="0.001" max="1000000" step="0.001" inputmode="decimal"')}
          <label>Unidade<select name="unidade" required><option value="">Selecione</option>${['kg', 'g', 'unidade', 'caixa'].map((unit) => `<option value="${unit}" ${offer.unidade === unit ? 'selected' : ''}>${unit}</option>`).join('')}</select><span class="field-error" data-error="unidade"></span></label>
          ${field('localidade', 'Comunidade / Local de entrega', offer.localidade ?? state.profile?.comunidade, 'Comunidade Val Paraíso', 'text', true, 'maxlength="120"')}
          ${field('disponivelAte', 'Disponível até', offer.disponivelAte, '', 'date')}
          ${field('observacoes', 'Observações', offer.observacoes, 'Ex.: orgânico, colhido no dia', 'text', false, 'maxlength="300"')}
        </div>
        <label class="check-row"><input type="checkbox" name="confirmed" required><span>Conferi os dados e autorizo o registro desta oferta no aparelho.</span></label>
        <span class="field-error confirmation-error" data-error="confirmed"></span>
        <div class="form-actions"><button class="button button-quiet" type="button" data-view="offers">Cancelar</button><button class="button button-primary button-large" type="submit">${isEditing ? 'Salvar alterações' : 'Gravar oferta no aparelho'}</button></div>
      </form>
    </section>`;
}

function field(name, label, value = '', placeholder = '', type = 'text', required = false, extra = '') {
  return `<label>${label}${required ? '' : ' <span class="optional">opcional</span>'}<input name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${placeholder}" ${required ? 'required' : ''} ${extra}><span class="field-error" data-error="${name}"></span></label>`;
}

function offersView() {
  return `
    <section class="page-intro page-intro-row">
      <div>
        <p class="eyebrow">Armazenamento Local (Offline-First)</p>
        <h1>Minhas Ofertas</h1>
        <p>${state.offers.length ? `${state.offers.length} registro${state.offers.length === 1 ? '' : 's'} guardado${state.offers.length === 1 ? '' : 's'} neste dispositivo.` : 'Nenhuma oferta cadastrada ainda.'}</p>
      </div>
      <button class="button button-primary" type="button" data-view="new">+ Nova oferta</button>
    </section>
    <div class="local-explainer">
      <span aria-hidden="true">🔒</span>
      <div>
        <strong>Operação 100% Offline</strong>
        <p>Seus registros ficam salvos com segurança no navegador.</p>
      </div>
    </div>
    <section class="card-list" aria-live="polite">
      ${state.offers.length ? state.offers.map(offerCard).join('') : emptyState('Ainda não há ofertas', 'Cadastre a primeira oferta agrícola para iniciar.', 'new')}
    </section>`;
}

function lotsView() {
  const lots = groupOffers(state.offers);
  return `
    <section class="page-intro">
      <p class="eyebrow">Agrupamento Comunitário</p>
      <h1>Lotes Coletivos</h1>
      <p>Pequenas ofertas da mesma comunidade e produto são reunidas automaticamente para atender demandas maiores de compradores.</p>
    </section>
    <div class="rule-strip">
      <span aria-hidden="true">⚙️</span>
      <p><strong>Regra Determinística:</strong> O agrupamento utiliza lógica transparente baseada em produto, comunidade e semana de entrega.</p>
    </div>
    <section class="card-list lot-list">
      ${lots.length ? lots.map(lotCard).join('') : emptyState('Nenhum lote formado', 'São necessárias pelo menos duas ofertas compatíveis da mesma comunidade. Clique em "Preparar dados de teste" para simular.', 'new')}
    </section>`;
}

function emptyState(title, text, view) {
  return `<div class="empty-state"><span aria-hidden="true">🌱</span><h2>${title}</h2><p>${text}</p><button class="button button-secondary" type="button" data-view="${view}">Cadastrar oferta</button></div>`;
}

function render() {
  const views = {
    home: homeView,
    roça: roçaView,
    mercado: mercadoView,
    comunidade: comunidadeView,
    aprender: aprenderView,
    guia: guiaView,
    new: offerFormView,
    offers: offersView,
    lots: lotsView,
  };
  app.innerHTML = layout((views[state.view] ?? homeView)());
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach((element) => element.addEventListener('click', () => navigate(element.dataset.view)));
  document.querySelector('[data-dismiss]')?.addEventListener('click', () => { state.message = null; render(); });
  document.querySelector('#profile-form')?.addEventListener('submit', saveProfile);
  document.querySelector('[data-interpret]')?.addEventListener('click', interpretText);
  document.querySelector('#offer-form')?.addEventListener('submit', saveOffer);
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => editOffer(button.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteOffer(button.dataset.delete)));

  const voiceBtn = document.querySelector('#voice-fab-btn');
  if (voiceBtn) {
    voiceBtn.addEventListener('click', toggleVoiceRecognition);
  }
}

function toggleVoiceRecognition() {
  if (recognition) {
    if (state.isListening) {
      recognition.stop();
      state.isListening = false;
      render();
    } else {
      try {
        recognition.start();
        state.isListening = true;
        state.message = { type: 'info', text: 'Ouvindo... Fale sua oferta (ex: "Tenho 30 quilos de macaxeira")' };
        render();
      } catch {
        state.isListening = false;
        render();
      }
    }
  } else {
    state.view = 'new';
    state.message = { type: 'info', text: 'Digite sua oferta abaixo para a IA interpretar.' };
    render();
    setTimeout(() => {
      document.querySelector('#offer-text')?.focus();
    }, 100);
  }
}

function navigate(view) {
  state.view = view;
  state.message = null;
  if (view === 'new' && !state.editing) state.suggestion = false;
  if (view !== 'new') state.editing = null;
  render();
  document.querySelector('#conteudo')?.focus();
}

async function refresh() {
  [state.offers, state.profile] = await Promise.all([repository.listOffers(), repository.getProfile()]);
}

async function saveProfile(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await repository.saveProfile(data);
    await refresh();
    state.message = { type: 'success', text: 'Perfil do produtor salvo neste aparelho.' };
  } catch {
    state.profile = data;
    state.message = { type: 'error', text: 'Não foi possível salvar o perfil. Tente novamente.' };
  }
  render();
}

async function interpretText() {
  const textarea = document.querySelector('#offer-text');
  const text = textarea?.value?.trim() ?? '';
  if (text.length < 3) {
    state.message = { type: 'error', text: 'Escreva uma frase sobre sua oferta antes de interpretar.' };
    render();
    return;
  }
  const currentForm = document.querySelector('#offer-form');
  const preserved = currentForm ? Object.fromEntries(new FormData(currentForm)) : {};
  state.editing = { ...(state.editing ?? {}), ...preserved, sourceText: text };
  state.busy = true;
  state.message = { type: 'info', text: 'Interpretando texto com o modelo Gemma…' };
  render();
  try {
    const suggestion = await interpretOffer(text);
    state.editing = { ...state.editing, ...Object.fromEntries(Object.entries(suggestion).filter(([, value]) => value !== null)), sourceText: text };
    state.suggestion = true;
    state.message = { type: 'success', text: 'Sugestão gerada pela IA! Verifique cada campo e confirme antes de gravar.' };
  } catch (error) {
    state.message = { type: 'error', text: error.message };
  } finally {
    state.busy = false;
    render();
  }
}

async function saveOffer(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const errors = validateOffer(data);
  if (!data.confirmed) errors.confirmed = 'Confirme que revisou os dados.';
  document.querySelectorAll('[data-error]').forEach((node) => { node.textContent = errors[node.dataset.error] ?? ''; });
  if (Object.keys(errors).length) {
    form.querySelector('[data-error]:not(:empty)')?.parentElement?.querySelector('input,select')?.focus();
    return;
  }
  const offer = createOffer({ ...data, produtorId: 'produtor-local' }, state.editing ?? {});
  try {
    await repository.saveOffer(offer);
    await refresh();
    state.editing = null;
    state.suggestion = false;
    state.view = 'offers';
    state.message = { type: 'success', text: 'Oferta gravada com sucesso neste aparelho!' };
  } catch {
    state.editing = { ...state.editing, ...data, sourceText: document.querySelector('#offer-text')?.value ?? '' };
    state.message = { type: 'error', text: 'Não foi possível salvar a oferta. Seus dados foram mantidos; tente novamente.' };
  }
  render();
}

async function editOffer(id) {
  try {
    state.editing = await repository.getOffer(id);
    if (!state.editing) throw new Error('Oferta não encontrada');
    state.suggestion = false;
    state.view = 'new';
  } catch {
    state.message = { type: 'error', text: 'Não foi possível abrir esta oferta neste aparelho.' };
  }
  render();
}

async function deleteOffer(id) {
  if (!window.confirm('Excluir esta oferta deste aparelho? Esta ação não pode ser desfeita.')) return;
  try {
    await repository.deleteOffer(id);
    await refresh();
    state.message = { type: 'success', text: 'Oferta excluída do aparelho.' };
  } catch {
    state.message = { type: 'error', text: 'Não foi possível excluir esta oferta. Tente novamente.' };
  }
  render();
}

window.addEventListener('online', render);
window.addEventListener('offline', render);

refresh().then(render).catch(() => {
  app.innerHTML = '<main class="fatal"><h1>Não foi possível abrir os dados locais</h1><p>Recarregue o aplicativo. Se o problema continuar, verifique o espaço disponível no aparelho.</p></main>';
});

