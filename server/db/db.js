import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');
mkdirSync(dataDir, { recursive: true });

const defaultData = {
  users: [],
  deals: [],
  offers: [],
  transactions: [],
  ratings: [],
  contracts: [],
  subscriptions: [],
  notifications: [],
  education: []
};

const db = await JSONFilePreset(join(dataDir, 'db.json'), defaultData);

export default db;
