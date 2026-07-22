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
};

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
    : '<span aria-hidden="true">○</span> Sem internet — dados locais disponíveis';
}

function nextFriday() {
  const date = new Date();
  const days = (5 - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function layout(content) {
  return `
    <header class="app-header">
      <a class="brand" href="#home" data-view="home" aria-label="SemeIA, ir para o início">
        <span class="brand-seed" aria-hidden="true">S</span>
        <span><strong>SemeIA</strong><small>Ofertas da comunidade</small></span>
      </a>
      <span class="connection ${navigator.onLine ? 'is-online' : 'is-offline'}" role="status">${connectionLabel()}</span>
    </header>
    <main id="conteudo" tabindex="-1">${state.message ? `<div class="toast toast-${state.message.type}" role="status">${escapeHtml(state.message.text)}<button type="button" data-dismiss aria-label="Fechar aviso">×</button></div>` : ''}${content}</main>
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
  return `
    <section class="hero">
      <div>
        <p class="eyebrow">Produção local, força coletiva</p>
        <h1>${state.profile?.nome ? `Olá, ${escapeHtml(state.profile.nome.split(' ')[0])}.` : 'Olá! Vamos começar?'}</h1>
        <p>Registre o que você tem para oferecer. Seus dados ficam disponíveis neste aparelho, mesmo quando a internet falha.</p>
        <button class="button button-primary button-large" type="button" data-view="new">Cadastrar nova oferta <span aria-hidden="true">→</span></button>
      </div>
      <div class="hero-summary" aria-label="Resumo das ofertas">
        <div><strong>${available}</strong><span>ofertas disponíveis</span></div>
        <div><strong>${lots}</strong><span>lotes formados</span></div>
      </div>
    </section>
    <section class="section-grid">
      <article class="panel">
        <div class="section-heading"><div><p class="eyebrow">Neste aparelho</p><h2>Meu perfil</h2></div><span class="soft-icon" aria-hidden="true">☺</span></div>
        <form id="profile-form" class="compact-form">
          <label>Seu nome<input name="nome" maxlength="80" value="${escapeHtml(state.profile?.nome)}" placeholder="Ex.: Rosa Lima" required></label>
          <label>Comunidade<input name="comunidade" maxlength="100" value="${escapeHtml(state.profile?.comunidade)}" placeholder="Ex.: Comunidade Val Paraíso" required></label>
          <label>Contato <span class="optional">opcional</span><input name="contato" maxlength="80" value="${escapeHtml(state.profile?.contato)}" placeholder="Telefone ou referência"></label>
          <button class="button button-secondary" type="submit">Salvar perfil</button>
        </form>
      </article>
      <article class="panel panel-demo">
        <p class="eyebrow">Roteiro do hackathon</p>
        <h2>Prepare uma demonstração</h2>
        <p>Carregue uma oferta fictícia de 20 kg de macaxeira. Depois, cadastre mais 30 kg para ver um lote de 50 kg.</p>
        <button class="button button-quiet" type="button" data-demo>Preparar demonstração</button>
      </article>
    </section>`;
}

function offerFormView() {
  const offer = state.editing ?? {};
  const isEditing = Boolean(offer.id);
  return `
    <section class="page-intro">
      <button class="back-link" type="button" data-view="offers">← Voltar para ofertas</button>
      <p class="eyebrow">${isEditing ? 'Atualizar registro' : 'Cadastro em duas etapas'}</p>
      <h1>${isEditing ? 'Editar oferta' : 'O que você tem para oferecer?'}</h1>
      <p>Você pode escrever como fala ou preencher os campos manualmente.</p>
    </section>
    <section class="form-shell">
      <div class="natural-input">
        <label for="offer-text"><span class="step-number">1</span> Descreva sua oferta <span class="optional">opcional</span></label>
        <textarea id="offer-text" rows="3" maxlength="500" placeholder="Ex.: Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso.">${escapeHtml(offer.sourceText)}</textarea>
        <div class="input-footer"><span>O texto só é enviado quando você pedir.</span><button class="button button-ai" type="button" data-interpret ${state.busy ? 'disabled' : ''}>${state.busy ? '<span class="spinner" aria-hidden="true"></span> Interpretando…' : '✦ Interpretar com Gemma'}</button></div>
      </div>
      <div class="divider"><span>ou preencha manualmente</span></div>
      <form id="offer-form" novalidate>
        <div class="form-heading"><span class="step-number">2</span><div><h2>Confira os dados</h2><p>${state.suggestion ? 'Sugestão da IA — confira cada campo antes de salvar.' : 'Informe os dados que você souber.'}</p></div></div>
        ${state.suggestion ? '<div class="ai-notice" role="status">✦ Estes campos foram sugeridos pela IA e ainda não foram salvos.</div>' : ''}
        <div class="field-grid">
          ${field('produto', 'Produto', offer.produto, 'Macaxeira', 'text', true, 'maxlength="80"')}
          ${field('quantidade', 'Quantidade', offer.quantidade, '30', 'number', true, 'min="0.001" max="1000000" step="0.001" inputmode="decimal"')}
          <label>Unidade<select name="unidade" required><option value="">Selecione</option>${['kg', 'g', 'unidade', 'caixa'].map((unit) => `<option value="${unit}" ${offer.unidade === unit ? 'selected' : ''}>${unit}</option>`).join('')}</select><span class="field-error" data-error="unidade"></span></label>
          ${field('localidade', 'Comunidade ou local de entrega', offer.localidade ?? state.profile?.comunidade, 'Comunidade Val Paraíso', 'text', true, 'maxlength="120"')}
          ${field('disponivelAte', 'Disponível até', offer.disponivelAte, '', 'date')}
          ${field('observacoes', 'Observações', offer.observacoes, 'Ex.: colhida no dia da entrega', 'text', false, 'maxlength="300"')}
        </div>
        <label class="check-row"><input type="checkbox" name="confirmed" required><span>Conferi os dados e quero salvar esta oferta neste aparelho.</span></label>
        <span class="field-error confirmation-error" data-error="confirmed"></span>
        <div class="form-actions"><button class="button button-quiet" type="button" data-view="offers">Cancelar</button><button class="button button-primary button-large" type="submit">${isEditing ? 'Salvar alterações' : 'Salvar oferta no aparelho'}</button></div>
      </form>
    </section>`;
}

function field(name, label, value = '', placeholder = '', type = 'text', required = false, extra = '') {
  return `<label>${label}${required ? '' : ' <span class="optional">opcional</span>'}<input name="${name}" type="${type}" value="${escapeHtml(value)}" placeholder="${placeholder}" ${required ? 'required' : ''} ${extra}><span class="field-error" data-error="${name}"></span></label>`;
}

function offersView() {
  return `
    <section class="page-intro page-intro-row"><div><p class="eyebrow">Guardadas no navegador</p><h1>Minhas ofertas</h1><p>${state.offers.length ? `${state.offers.length} registro${state.offers.length === 1 ? '' : 's'} neste aparelho.` : 'Nenhuma oferta cadastrada ainda.'}</p></div><button class="button button-primary" type="button" data-view="new">+ Nova oferta</button></section>
    <div class="local-explainer"><span aria-hidden="true">▣</span><div><strong>Seus dados estão neste aparelho</strong><p>A sincronização entre dispositivos ainda não faz parte deste protótipo.</p></div></div>
    <section class="card-list" aria-live="polite">${state.offers.length ? state.offers.map(offerCard).join('') : emptyState('Ainda não há ofertas', 'Cadastre o primeiro produto para começar.', 'new')}</section>`;
}

function lotsView() {
  const lots = groupOffers(state.offers);
  return `
    <section class="page-intro"><p class="eyebrow">Pequenas ofertas, mais alcance</p><h1>Lotes coletivos</h1><p>O SemeIA reúne ofertas disponíveis do mesmo produto, comunidade, tipo de unidade e semana.</p></section>
    <div class="rule-strip"><span aria-hidden="true">✓</span><p><strong>Cálculo transparente:</strong> a IA não soma nem decide os lotes. As regras são fixas e testadas.</p></div>
    <section class="card-list lot-list">${lots.length ? lots.map(lotCard).join('') : emptyState('Nenhum lote formado', 'São necessárias pelo menos duas ofertas compatíveis. Prepare a demonstração e adicione a segunda oferta.', 'new')}</section>`;
}

function emptyState(title, text, view) {
  return `<div class="empty-state"><span aria-hidden="true">⌁</span><h2>${title}</h2><p>${text}</p><button class="button button-secondary" type="button" data-view="${view}">Cadastrar oferta</button></div>`;
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
  document.querySelector('[data-demo]')?.addEventListener('click', prepareDemo);
  document.querySelector('[data-interpret]')?.addEventListener('click', interpretText);
  document.querySelector('#offer-form')?.addEventListener('submit', saveOffer);
  document.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => editOffer(button.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteOffer(button.dataset.delete)));
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
    state.message = { type: 'success', text: 'Perfil salvo neste aparelho.' };
  } catch {
    state.profile = data;
    state.message = { type: 'error', text: 'Não foi possível salvar o perfil. Os campos foram mantidos; tente novamente.' };
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
    state.message = { type: 'success', text: 'Demonstração preparada com dados fictícios. Agora cadastre mais 30 kg de macaxeira.' };
  } catch {
    state.message = { type: 'error', text: 'Não foi possível preparar os dados fictícios neste aparelho.' };
  }
  render();
}

async function interpretText() {
  const textarea = document.querySelector('#offer-text');
  const text = textarea.value.trim();
  if (text.length < 3) {
    state.message = { type: 'error', text: 'Escreva uma frase sobre sua oferta antes de interpretar.' };
    render();
    return;
  }
  const currentForm = document.querySelector('#offer-form');
  const preserved = Object.fromEntries(new FormData(currentForm));
  state.editing = { ...(state.editing ?? {}), ...preserved, sourceText: text };
  state.busy = true;
  state.message = { type: 'info', text: 'Interpretando com Gemma no serviço local…' };
  render();
  try {
    const suggestion = await interpretOffer(text);
    state.editing = { ...state.editing, ...Object.fromEntries(Object.entries(suggestion).filter(([, value]) => value !== null)), sourceText: text };
    state.suggestion = true;
    state.message = { type: 'success', text: 'Sugestão recebida. Confira todos os campos antes de salvar.' };
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
    state.message = { type: 'success', text: 'Oferta salva neste aparelho.' };
  } catch {
    state.editing = { ...state.editing, ...data, sourceText: document.querySelector('#offer-text')?.value ?? '' };
    state.message = { type: 'error', text: 'Não foi possível salvar. Seus dados foram mantidos; tente novamente.' };
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
    state.message = { type: 'success', text: 'Oferta excluída deste aparelho.' };
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
