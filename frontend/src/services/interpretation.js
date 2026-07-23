import { ACCEPTED_UNITS, MAX_QUANTITY, isIsoDate } from '../domain/offers.js';

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const ALLOWED_FIELDS = ['produto', 'quantidade', 'unidade', 'localidade', 'disponivelAte', 'observacoes'];
const TEXT_LIMITS = { produto: 80, localidade: 120, observacoes: 300 };

export class InterpretationError extends Error {
  constructor(message, code = 'IA_INDISPONIVEL') {
    super(message);
    this.name = 'InterpretationError';
    this.code = code;
  }
}

export function validateSuggestion(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new InterpretationError('A sugestão recebida não pôde ser conferida.', 'RESPOSTA_IA_INVALIDA');
  }
  const unknownFields = Object.keys(data).filter((key) => !ALLOWED_FIELDS.includes(key));
  if (unknownFields.length) {
    throw new InterpretationError('A sugestão contém campos não permitidos.', 'RESPOSTA_IA_INVALIDA');
  }
  const clean = Object.fromEntries(ALLOWED_FIELDS.map((key) => [key, data[key] ?? null]));
  for (const [field, maximumLength] of Object.entries(TEXT_LIMITS)) {
    if (clean[field] !== null && typeof clean[field] !== 'string') {
      throw new InterpretationError('A sugestão contém um texto inválido.', 'RESPOSTA_IA_INVALIDA');
    }
    if (typeof clean[field] === 'string') {
      clean[field] = clean[field].trim() || null;
      if (clean[field]?.length > maximumLength) {
        throw new InterpretationError('A sugestão contém um texto longo demais.', 'RESPOSTA_IA_INVALIDA');
      }
    }
  }
  if (clean.quantidade !== null && (typeof clean.quantidade !== 'number'
    || !Number.isFinite(clean.quantidade)
    || clean.quantidade <= 0
    || clean.quantidade > MAX_QUANTITY
    || decimalPlaces(clean.quantidade) > 3)) {
    throw new InterpretationError('A quantidade sugerida não é válida.', 'RESPOSTA_IA_INVALIDA');
  }
  if (clean.unidade !== null && (typeof clean.unidade !== 'string' || !ACCEPTED_UNITS.includes(clean.unidade))) {
    throw new InterpretationError('A unidade sugerida não é válida.', 'RESPOSTA_IA_INVALIDA');
  }
  if (clean.disponivelAte !== null && (typeof clean.disponivelAte !== 'string' || !isIsoDate(clean.disponivelAte))) {
    throw new InterpretationError('A data sugerida não é válida.', 'RESPOSTA_IA_INVALIDA');
  }
  return clean;
}

function decimalPlaces(value) {
  const normalized = String(value).toLowerCase();
  if (normalized.includes('e-')) return Number(normalized.split('e-')[1]);
  return normalized.includes('.') ? normalized.split('.')[1].length : 0;
}

function localIsoDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function interpretOffer(text, { apiUrl = DEFAULT_API_URL, timeoutMs = 65000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${apiUrl}/interpretacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: text, dataReferencia: localIsoDate() }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new InterpretationError(
        body?.mensagem || 'Não foi possível interpretar agora. Continue pelo formulário manual.',
        body?.codigo,
      );
    }
    return validateSuggestion(body);
  } catch (error) {
    if (error instanceof InterpretationError) throw error;
    throw new InterpretationError('Não foi possível interpretar agora. Seu texto foi mantido; continue pelo formulário manual.');
  } finally {
    clearTimeout(timeout);
  }
}
