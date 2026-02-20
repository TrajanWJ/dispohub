import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';
import { mkdirSync, existsSync, copyFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isVercel = !!process.env.VERCEL;

// On Vercel, use /tmp for writable storage; locally use data/ subdir
const dataDir = isVercel ? '/tmp' : join(__dirname, 'data');
if (!isVercel) {
  mkdirSync(dataDir, { recursive: true });
}

// On Vercel, seed from bundled snapshot if /tmp/db.json doesn't exist
const dbPath = join(dataDir, 'db.json');
const localSnapshot = join(__dirname, 'data', 'db.json');
if (isVercel && !existsSync(dbPath) && existsSync(localSnapshot)) {
  copyFileSync(localSnapshot, dbPath);
}

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

const db = await JSONFilePreset(dbPath, defaultData);

export default db;
