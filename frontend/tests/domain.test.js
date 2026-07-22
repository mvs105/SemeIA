import { describe, expect, it } from 'vitest';
import { groupOffers, normalizeProduct, normalizeUnit, validateOffer } from '../src/domain/offers.js';

const base = {
  status: 'disponivel',
  syncStatus: 'local',
  localidade: 'Comunidade Val Paraíso',
  disponivelAte: '2026-07-24',
};

describe('normalização e validação', () => {
  it('normaliza acentos, sinônimos de produto e unidade', () => {
    expect(normalizeProduct(' Mandioca ')).toBe('macaxeira');
    expect(normalizeUnit('Quilos')).toBe('kg');
  });

  it('recusa quantidade igual a zero', () => {
    expect(validateOffer({ produto: 'banana', quantidade: 0, unidade: 'kg', localidade: 'X' })).toMatchObject({
      quantidade: expect.any(String),
    });
  });

  it('recusa quantidade excessiva, precisão excessiva e data impossível', () => {
    const valid = { produto: 'banana', unidade: 'kg', localidade: 'Comunidade Exemplo' };
    expect(validateOffer({ ...valid, quantidade: 1_000_000.001 })).toHaveProperty('quantidade');
    expect(validateOffer({ ...valid, quantidade: 1.2345 })).toHaveProperty('quantidade');
    expect(validateOffer({ ...valid, quantidade: 1, disponivelAte: '2026-02-30' })).toHaveProperty('disponivelAte');
  });
});

describe('formação determinística de lotes', () => {
  it('soma kg e g do mesmo produto, comunidade e semana', () => {
    const lots = groupOffers([
      { ...base, id: '1', produto: 'Macaxeira', quantidade: 30, unidade: 'kg' },
      { ...base, id: '2', produto: 'mandioca', quantidade: 20000, unidade: 'g', disponivelAte: '2026-07-26' },
    ]);
    expect(lots).toHaveLength(1);
    expect(lots[0].quantidade).toBe(50);
    expect(lots[0].unidade).toBe('kg');
  });

  it('não agrupa comunidade, semana, unidade ou status incompatível', () => {
    const offers = [
      { ...base, id: '1', produto: 'Macaxeira', quantidade: 10, unidade: 'kg' },
      { ...base, id: '2', produto: 'Macaxeira', quantidade: 2, unidade: 'caixa' },
      { ...base, id: '3', produto: 'Macaxeira', quantidade: 5, unidade: 'kg', localidade: 'Outra comunidade' },
      { ...base, id: '4', produto: 'Macaxeira', quantidade: 5, unidade: 'kg', disponivelAte: '2026-08-03' },
      { ...base, id: '5', produto: 'Macaxeira', quantidade: 5, unidade: 'kg', status: 'encerrada' },
    ];
    expect(groupOffers(offers)).toEqual([]);
  });

  it('produz o mesmo lote independentemente da ordem de entrada', () => {
    const first = { ...base, id: 'a', produto: 'Macaxeira', quantidade: 10, unidade: 'kg' };
    const second = { ...base, id: 'b', produto: 'mandioca', quantidade: 5000, unidade: 'g' };
    expect(groupOffers([second, first])).toEqual(groupOffers([first, second]));
  });
});
