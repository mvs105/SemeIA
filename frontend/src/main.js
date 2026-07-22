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

function nextFriday() {
  const date = new Date();
  const days = (5 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
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
        <span class="brand-icon" aria-hidden="true">🌱</span>
        <span><strong>SemeIA</strong><small>Agricultura Familiar Amazônica</small></span>
      </a>
      <span class="connection ${navigator.onLine ? 'is-online' : 'is-offline'}" role="status">${connectionLabel()}</span>
    </header>
    <main id="conteudo" tabindex="-1">
      ${state.message ? `<div class="toast toast-${state.message.type}" role="status">${escapeHtml(state.message.text)}<button type="button" data-dismiss aria-label="Fechar aviso">×</button></div>` : ''}
      ${content}
    </main>
    <button class="voice-fab ${state.isListening ? 'is-listening' : ''}" type="button" id="voice-fab-btn" aria-label="Falar com a SemeIA por voz">
      <span class="voice-fab-icon" aria-hidden="true">${state.isListening ? '🎙️' : '🎤'}</span>
      <span>${state.isListening ? 'Ouvindo…' : 'Falar oferta'}</span>
    </button>
    <nav class="bottom-nav" aria-label="Navegação principal">
      ${navButton('home', '⌂', 'Início')}
      ${navButton('new', '+', 'Nova oferta')}
      ${navButton('offers', '▤', 'Ofertas')}
      ${navButton('lots', '◎', 'Lotes')}
    </nav>`;
}

function navButton(view, icon, label) {
  const active = state.view === view;
  return `<button type="button" data-view="${view}" ${active ? 'aria-current="page"' : ''}><span aria-hidden="true">${icon}</span>${label}</button>`;
}

function homeView() {
  const available = state.offers.filter((offer) => offer.status === 'disponivel').length;
  const lots = groupOffers(state.offers).length;
  const firstName = state.profile?.nome ? escapeHtml(state.profile.nome.split(' ')[0]) : null;

  return `
    <section class="hero">
      <div>
        <p class="eyebrow">Conectando o saber tradicional à inteligência artificial</p>
        <h1>${firstName ? `Bom dia, ${firstName}!` : 'Bem-vindo ao SemeIA'}</h1>
        <p>Registre sua produção em linguagem natural, organize suas ofertas e forme lotes coletivos com outros produtores da sua comunidade.</p>
        <button class="button button-primary button-large" type="button" data-view="new">Cadastrar nova oferta <span aria-hidden="true">→</span></button>
      </div>
      <div class="hero-summary" aria-label="Resumo das ofertas">
        <div><strong>${available}</strong><span>ofertas ativas</span></div>
        <div><strong>${lots}</strong><span>lotes coletivos</span></div>
      </div>
    </section>

    <!-- Cards de Acesso Rápido -->
    <section class="quick-grid">
      <div class="quick-card" data-view="new">
        <div class="quick-card-header">
          <span class="quick-icon" aria-hidden="true">🌾</span>
          <h3>Minha Lavoura</h3>
        </div>
        <p>Registre excedentes de colheita rapidamente por texto ou voz.</p>
      </div>
      <div class="quick-card" data-view="lots">
        <div class="quick-card-header">
          <span class="quick-icon" aria-hidden="true">📦</span>
          <h3>Lotes Coletivos</h3>
        </div>
        <p>Reúna ofertas da mesma comunidade para atender compradores.</p>
      </div>
      <div class="quick-card" data-view="offers">
        <div class="quick-card-header">
          <span class="quick-icon" aria-hidden="true">🤝</span>
          <h3>Comercialização</h3>
        </div>
        <p>Consulte e gerencie todos os seus produtos cadastrados localmente.</p>
      </div>
      <div class="quick-card" data-demo>
        <div class="quick-card-header">
          <span class="quick-icon" aria-hidden="true">💡</span>
          <h3>Demonstração</h3>
        </div>
        <p>Carregue dados fictícios de teste para apresentar o protótipo.</p>
      </div>
    </section>

    <section class="section-grid">
      <article class="panel">
        <div class="section-heading">
          <div><p class="eyebrow">Aparelho local</p><h2>Perfil do Produtor</h2></div>
          <span class="soft-icon" aria-hidden="true">👨‍🌾</span>
        </div>
        <form id="profile-form" class="compact-form">
          <label>Seu nome<input name="nome" maxlength="80" value="${escapeHtml(state.profile?.nome)}" placeholder="Ex.: João Silva" required></label>
          <label>Comunidade<input name="comunidade" maxlength="100" value="${escapeHtml(state.profile?.comunidade)}" placeholder="Ex.: Comunidade Val Paraíso" required></label>
          <label>Contato <span class="optional">opcional</span><input name="contato" maxlength="80" value="${escapeHtml(state.profile?.contato)}" placeholder="Telefone ou recado"></label>
          <button class="button button-secondary" type="submit">Salvar perfil</button>
        </form>
      </article>
      <article class="panel panel-demo">
        <p class="eyebrow">Roteiro do Hackathon</p>
        <h2>Simulação Offline</h2>
        <p>Carregue uma oferta de 20 kg de macaxeira. Em seguida, cadastre mais 30 kg para observar a formação automática de um lote de 50 kg.</p>
        <button class="button button-quiet" type="button" data-demo>Preparar dados de teste</button>
      </article>
    </section>`;
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
        <p>Seus registros ficam salvos com segurança no navegador através do IndexedDB/Dexie.</p>
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
  const views = { home: homeView, new: offerFormView, offers: offersView, lots: lotsView };
  app.innerHTML = layout((views[state.view] ?? homeView)());
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach((element) => element.addEventListener('click', () => navigate(element.dataset.view)));
  document.querySelector('[data-dismiss]')?.addEventListener('click', () => { state.message = null; render(); });
  document.querySelector('#profile-form')?.addEventListener('submit', saveProfile);
  document.querySelectorAll('[data-demo]').forEach((el) => el.addEventListener('click', prepareDemo));
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

async function prepareDemo() {
  const date = nextFriday();
  try {
    await repository.prepareDemo({
      id: 'oferta-demo-macaxeira', produtorId: 'produtor-demo', produto: 'Macaxeira', quantidade: 20, unidade: 'kg',
      localidade: 'Comunidade Val Paraíso', disponivelAte: date, observacoes: 'Dado fictício para demonstração.',
      status: 'disponivel', syncStatus: 'local', criadaEm: new Date().toISOString(), atualizadaEm: new Date().toISOString(),
    });
    await refresh();
    state.message = { type: 'success', text: 'Demonstração preparada! Adicione mais 30 kg de macaxeira para formar um lote coletivo.' };
  } catch {
    state.message = { type: 'error', text: 'Não foi possível preparar os dados de teste neste aparelho.' };
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

