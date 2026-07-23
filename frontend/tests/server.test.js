import { afterEach, describe, expect, it, vi } from 'vitest';
import { interpretWithOllama, parseAndValidateAiResponse } from '../../server/interpreter.js';

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_MODEL;
});

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

  it('calls the local Gemma model through Ollama', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          produto: 'macaxeira',
          quantidade: 30,
          unidade: 'kg',
          localidade: 'Comunidade Val Paraíso',
          disponivelAte: '2026-07-06',
          observacoes: null,
        }),
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await interpretWithOllama(
      'Tenho 30 quilos de macaxeira para entregar até sexta na comunidade Val Paraíso.',
      '2026-07-22',
    );

    expect(result.produto).toBe('macaxeira');
    expect(result.disponivelAte).toBe('2026-07-24');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/generate',
      expect.objectContaining({ method: 'POST' }),
    );
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.model).toBe('gemma2:2b');
  });
});
