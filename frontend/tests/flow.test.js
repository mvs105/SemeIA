import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase, LocalRepository } from '../src/data/database.js';
import { createOffer, groupOffers, validateOffer } from '../src/domain/offers.js';
import { validateSuggestion } from '../src/services/interpretation.js';

let database;
afterEach(async () => database?.delete());

describe('fluxo principal integrado', () => {
  it('valida sugestão, exige domínio válido, persiste e forma lote', async () => {
    database = createDatabase(`flow-${crypto.randomUUID()}`);
    const repository = new LocalRepository(database);
    const suggestion = validateSuggestion({
      produto: 'macaxeira', quantidade: 30, unidade: 'kg', localidade: 'Comunidade Val Paraíso',
      disponivelAte: '2026-07-24', observacoes: null,
    });
    expect(validateOffer(suggestion)).toEqual({});

    await repository.saveOffer(createOffer(suggestion, { id: 'nova' }));
    await repository.saveOffer(createOffer({ ...suggestion, quantidade: 20 }, { id: 'existente' }));
    const lots = groupOffers(await repository.listOffers());
    expect(lots).toHaveLength(1);
    expect(lots[0].quantidade).toBe(50);
  });
});

