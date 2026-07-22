const STATUS_LABELS = {
  local: 'Salva neste aparelho',
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatDate(value) {
  if (!value) return 'Sem data definida';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function formatQuantity(value) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value);
}

export function offerCard(offer) {
  return `
    <article class="offer-card">
      <div class="card-heading">
        <div>
          <p class="eyebrow">${offer.status === 'disponivel' ? 'Oferta disponível' : 'Oferta encerrada'}</p>
          <h3>${escapeHtml(offer.produto)}</h3>
        </div>
        <span class="status-badge status-${escapeHtml(offer.syncStatus)}"><span aria-hidden="true">●</span> ${STATUS_LABELS[offer.syncStatus] ?? 'Estado desconhecido'}</span>
      </div>
      <dl class="offer-facts">
        <div><dt>Quantidade</dt><dd>${formatQuantity(offer.quantidade)} ${escapeHtml(offer.unidade)}</dd></div>
        <div><dt>Local</dt><dd>${escapeHtml(offer.localidade)}</dd></div>
        <div><dt>Disponível até</dt><dd>${formatDate(offer.disponivelAte)}</dd></div>
      </dl>
      ${offer.observacoes ? `<p class="note">${escapeHtml(offer.observacoes)}</p>` : ''}
      <div class="card-actions">
        <button class="button button-quiet" type="button" data-edit="${offer.id}">Editar</button>
        <button class="button button-danger" type="button" data-delete="${offer.id}">Excluir</button>
      </div>
    </article>`;
}

export function lotCard(lot) {
  return `
    <article class="lot-card">
      <div class="lot-mark" aria-hidden="true">${lot.ofertas.length}</div>
      <div>
        <p class="eyebrow">Lote coletivo · ${lot.ofertas.length} ofertas</p>
        <h3>${escapeHtml(lot.produto)}</h3>
        <p class="lot-total">${formatQuantity(lot.quantidade)} ${escapeHtml(lot.unidade)} reunidos</p>
        <p>${escapeHtml(lot.localidade)} · semana de ${formatDate(lot.semanaInicio)}</p>
      </div>
    </article>`;
}
