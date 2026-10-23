// Titre du jour : un titre de la réserve tiré au hasard, le même pour tout le monde jusqu'au lendemain.
// Aucun critère de popularité : un simple tirage. Lancé chaque matin après la réserve (pool.yml).
const fs = require('fs');
const path = require('path');

const POOL_DIR = path.join(__dirname, '..', 'pool');
const read = f => JSON.parse(fs.readFileSync(path.join(POOL_DIR, f), 'utf8'));

const idx = read('index.json');
const prev = (() => { try { return read('daily.json'); } catch { return null; } })();
const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }); // AAAA-MM-JJ

if (prev?.day === day && !process.env.FORCE) { console.log('Titre du jour déjà tiré :', prev.i); process.exit(0); }

const rows = read(Math.floor(Math.random() * idx.chunks) + '.json').filter(r => r.a !== prev?.a);
const r = rows[Math.floor(Math.random() * rows.length)];
fs.writeFileSync(path.join(POOL_DIR, 'daily.json'), JSON.stringify({ day, i: r.i, a: r.a }));
console.log('Titre du jour :', day, r.i);
