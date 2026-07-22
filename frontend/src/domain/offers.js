export const ACCEPTED_UNITS = ['kg', 'g', 'unidade', 'caixa'];
export const MAX_QUANTITY = 1_000_000;

const PRODUCT_ALIASES = new Map([
  ['mandioca', 'macaxeira'],
  ['aipim', 'macaxeira'],
]);

const UNIT_ALIASES = new Map([
  ['quilo', 'kg'],
  ['quilos', 'kg'],
  ['kilograma', 'kg'],
  ['kilogramas', 'kg'],
  ['grama', 'g'],
  ['gramas', 'g'],
  ['unidades', 'unidade'],
  ['caixas', 'caixa'],
]);

export function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ');
}

export function normalizeProduct(value) {
  const normalized = normalizeText(value);
  return PRODUCT_ALIASES.get(normalized) ?? normalized;
}

export function normalizeUnit(value) {
  const normalized = normalizeText(value);
  return UNIT_ALIASES.get(normalized) ?? normalized;
}

export function validateOffer(input) {
  const errors = {};
  const quantidade = Number(input.quantidade);
  const unidade = normalizeUnit(input.unidade);

  const product = String(input.produto ?? '').trim();
  const locality = String(input.localidade ?? '').trim();
  const notes = String(input.observacoes ?? '').trim();

  if (!product) errors.produto = 'Informe o produto.';
  else if (product.length > 80) errors.produto = 'Use no máximo 80 caracteres.';
  if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > MAX_QUANTITY || decimalPlaces(quantidade) > 3) {
    errors.quantidade = 'Use uma quantidade maior que zero, com até três casas decimais.';
  }
  if (!ACCEPTED_UNITS.includes(unidade)) errors.unidade = 'Escolha uma unidade válida.';
  if (!locality) errors.localidade = 'Informe a comunidade ou local de entrega.';
  else if (locality.length > 120) errors.localidade = 'Use no máximo 120 caracteres.';
  if (input.disponivelAte && !isIsoDate(input.disponivelAte)) {
    errors.disponivelAte = 'Use uma data válida.';
  }
  if (notes.length > 300) errors.observacoes = 'Use no máximo 300 caracteres.';
  return errors;
}

function decimalPlaces(value) {
  const normalized = String(value).toLowerCase();
  if (normalized.includes('e-')) return Number(normalized.split('e-')[1]);
  return normalized.includes('.') ? normalized.split('.')[1].length : 0;
}

export function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function mondayOf(dateString) {
  if (!isIsoDate(dateString)) return null;
  const date = new Date(`${dateString}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function toComparableQuantity(offer) {
  const unit = normalizeUnit(offer.unidade);
  const quantity = Number(offer.quantidade);
  if (unit === 'g') return { amount: quantity / 1000, unit: 'kg' };
  return { amount: quantity, unit };
}

export function groupOffers(offers) {
  const groups = new Map();

  for (const offer of offers) {
    if (offer.status !== 'disponivel' || !offer.disponivelAte) continue;
    const comparable = toComparableQuantity(offer);
    const keyParts = [
      normalizeProduct(offer.produto),
      comparable.unit,
      normalizeText(offer.localidade),
      mondayOf(offer.disponivelAte),
    ];
    if (keyParts.some((part) => !part)) continue;
    const key = keyParts.join('|');
    const current = groups.get(key) ?? {
      id: key,
      produto: normalizeProduct(offer.produto),
      localidade: offer.localidade.trim(),
      unidade: comparable.unit,
      semanaInicio: keyParts[3],
      quantidade: 0,
      ofertas: [],
    };
    current.quantidade += comparable.amount;
    current.ofertas.push(offer);
    groups.set(key, current);
  }

  return [...groups.values()]
    .filter((group) => group.ofertas.length >= 2)
    .map((group) => ({
      ...group,
      quantidade: Number(group.quantidade.toFixed(3)),
      ofertas: [...group.ofertas].sort((a, b) => String(a.id).localeCompare(String(b.id), 'pt-BR')),
    }))
    .sort((a, b) => b.quantidade - a.quantidade
      || a.produto.localeCompare(b.produto, 'pt-BR')
      || normalizeText(a.localidade).localeCompare(normalizeText(b.localidade), 'pt-BR')
      || a.semanaInicio.localeCompare(b.semanaInicio)
      || a.unidade.localeCompare(b.unidade, 'pt-BR'));
}

export function createOffer(input, previous = {}) {
  const now = new Date().toISOString();
  return {
    id: previous.id ?? crypto.randomUUID(),
    produtorId: input.produtorId || previous.produtorId || 'produtor-local',
    produto: String(input.produto).trim(),
    quantidade: Number(input.quantidade),
    unidade: normalizeUnit(input.unidade),
    localidade: String(input.localidade).trim(),
    disponivelAte: input.disponivelAte || null,
    observacoes: String(input.observacoes ?? '').trim() || null,
    status: input.status || previous.status || 'disponivel',
    syncStatus: previous.syncStatus || 'local',
    criadaEm: previous.criadaEm || now,
    atualizadaEm: now,
  };
}
