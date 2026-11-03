import Dexie from 'dexie';

const db = new Dexie('SolaceGardenDB');

db.version(1).stores({
  items: '++id, name, createdAt'
});

export default db;
