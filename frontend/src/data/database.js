import Dexie from 'dexie';

export function createDatabase(name = 'semeia-local') {
  const database = new Dexie(name);
  database.version(1).stores({
    producers: '&id,nome,comunidade',
    offers: '&id,produtorId,produto,status,syncStatus,disponivelAte,criadaEm,atualizadaEm',
  });
  return database;
}

export const db = createDatabase();

export class LocalRepository {
  constructor(database = db) {
    this.database = database;
  }

  listOffers() {
    return this.database.offers.orderBy('atualizadaEm').reverse().toArray();
  }

  getOffer(id) {
    return this.database.offers.get(id);
  }

  saveOffer(offer) {
    return this.database.offers.put(offer);
  }

  deleteOffer(id) {
    return this.database.offers.delete(id);
  }

  getProfile() {
    return this.database.producers.get('produtor-local');
  }

  saveProfile(profile) {
    return this.database.producers.put({ ...profile, id: 'produtor-local' });
  }
}

