import { describe, expect, it } from 'vitest';
import { InterpretationError, validateSuggestion } from '../src/services/interpretation.js';

describe('validação da sugestão do serviço', () => {
  it('mantém ausências como null para confirmação humana', () => {
    expect(validateSuggestion({ produto: 'banana' })).toEqual({
      produto: 'banana', quantidade: null, unidade: null, localidade: null, disponivelAte: null, observacoes: null,
    });
  });

  it('recusa quantidade negativa e data fora de ISO', () => {
    expect(() => validateSuggestion({ quantidade: -1 })).toThrow(InterpretationError);
    expect(() => validateSuggestion({ disponivelAte: 'sexta' })).toThrow(InterpretationError);
  });

  it('recusa tipos, limites, unidade, data impossível e campo desconhecido', () => {
    expect(() => validateSuggestion({ quantidade: '30' })).toThrow(InterpretationError);
    expect(() => validateSuggestion({ quantidade: 1_000_000.001 })).toThrow(InterpretationError);
    expect(() => validateSuggestion({ quantidade: 1.2345 })).toThrow(InterpretationError);
    expect(() => validateSuggestion({ unidade: 'tonelada' })).toThrow(InterpretationError);
    expect(() => validateSuggestion({ disponivelAte: '2026-02-30' })).toThrow(InterpretationError);
    expect(() => validateSuggestion({ certificacao: 'orgânica' })).toThrow(InterpretationError);
  });

  it('limpa textos vazios sem inventar valores', () => {
    expect(validateSuggestion({ produto: '  ', observacoes: '  ' })).toMatchObject({
      produto: null,
      observacoes: null,
    });
  });
});
