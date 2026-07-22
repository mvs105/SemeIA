import { describe, expect, it } from 'vitest';
import { interpretRuleBasedFallback, parseAndValidateAiResponse } from '../../server/interpreter.js';

describe('Server interpreter logic', () => {
  it('parses valid AI JSON response', () => {
    const raw = `\`\`\`json
{
  "produto": "macaxeira",
  "quantidade": 30,
  "unidade": "kg",
  "localidade": "Comunidade Val Paraíso",
  "disponivelAte": "2026-07-24",
  "observacoes": null
}
\`\`\``;
    const result = parseAndValidateAiResponse(raw);
    expect(result).toEqual({
      produto: 'macaxeira',
      quantidade: 30,
      unidade: 'kg',
      localidade: 'Comunidade Val Paraíso',
      disponivelAte: '2026-07-24',
      observacoes: null,
    });
  });

  it('normalizes unit aliases like quilos -> kg', () => {
    const raw = JSON.stringify({
      produto: 'banana',
      quantidade: 10,
      unidade: 'quilos',
      localidade: null,
      disponivelAte: null,
      observacoes: null,
    });
    expect(parseAndValidateAiResponse(raw).unidade).toBe('kg');
  });

  it('extracts offer details with rule-based fallback', () => {
    const text = 'Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso.';
    const result = interpretRuleBasedFallback(text, '2026-07-22');
    expect(result.produto).toBe('macaxeira');
    expect(result.quantidade).toBe(30);
    expect(result.unidade).toBe('kg');
    expect(result.localidade).toBe('Comunidade Val Paraíso');
    expect(result.disponivelAte).toBe('2026-07-24');
  });
});
