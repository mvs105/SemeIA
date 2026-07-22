import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createDatabase, LocalRepository } from '../src/data/database.js';

let database;

afterEach(async () => {
  if (database) await database.delete();
});

describe('repositório local IndexedDB', () => {
  it('salva, lista, atualiza e exclui uma oferta sem backend', async () => {
    database = createDatabase(`test-${crypto.randomUUID()}`);
    const repository = new LocalRepository(database);
    const offer = {
      id: 'oferta-1', produtorId: 'produtor-local', produto: 'Banana', quantidade: 12, unidade: 'kg',
      localidade: 'Comunidade Exemplo', disponivelAte: null, observacoes: null, status: 'disponivel',
      syncStatus: 'local', criadaEm: '2026-07-22T10:00:00Z', atualizadaEm: '2026-07-22T10:00:00Z',
    };

    await repository.saveOffer(offer);
    expect(await repository.listOffers()).toHaveLength(1);
    await repository.saveOffer({ ...offer, quantidade: 18, atualizadaEm: '2026-07-22T11:00:00Z' });
    expect((await repository.getOffer('oferta-1')).quantidade).toBe(18);
    await repository.deleteOffer('oferta-1');
    expect(await repository.listOffers()).toEqual([]);
  });

  it('prepara dados fictícios sem duplicar', async () => {
    database = createDatabase(`test-${crypto.randomUUID()}`);
    const repository = new LocalRepository(database);
    const demo = { id: 'demo', produto: 'Macaxeira', atualizadaEm: '2026-07-22T10:00:00Z' };
    await repository.prepareDemo(demo);
    await repository.prepareDemo(demo);
    expect(await repository.listOffers()).toHaveLength(1);
    expect((await repository.getProfile()).nome).toBe('Rosa Lima');
  });
});

