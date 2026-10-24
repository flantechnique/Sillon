// Retire de la réserve actuelle les artistes repérés comme fermes à contenu (voir farm.js).
// Usage : node tools/clean-farms.js   (à lancer une fois, quand la règle change ; le tirage quotidien l'applique ensuite aux nouveaux titres)
const fs = require('fs');
const path = require('path');
const { farmCheck } = require('./farm.js');

const POOL_DIR = path.join(__dirname, '..', 'pool');
const CHUNK = 1000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function dz(p) {
  await sleep(140); // ~7 requêtes/s, sous la limite de Deezer
  const res = await fetch('https://api.deezer.com' + p, { headers: { 'User-Agent': 'Sillon/1.0 (+https://github.com/flantechnique/Sillon)' } });
  const j = await res.json();
  if (j.error && j.error.code === 4) { await sleep(5000); return dz(p); } // quota : on patiente
  return j.error ? null : j;
}

(async () => {
  const idx = JSON.parse(fs.readFileSync(path.join(POOL_DIR, 'index.json'), 'utf8'));
  const rows = [];
  for (let n = 0; n < idx.chunks; n++) rows.push(...JSON.parse(fs.readFileSync(path.join(POOL_DIR, n + '.json'), 'utf8')));
  let farms = new Set();
  try { farms = new Set(JSON.parse(fs.readFileSync(path.join(POOL_DIR, 'farms.json'), 'utf8'))); } catch {}
  const artists = [...new Set(rows.map(r => r.a))].filter(a => !farms.has(a));
  let done = 0;
  for (const a of artists) {
    try { if (await farmCheck(dz, a)) farms.add(a); } catch {}
    if (++done % 250 === 0) console.log(`${done}/${artists.length} artistes vérifiés, ${farms.size} fermes`);
  }
  const kept = rows.filter(r => !farms.has(r.a));
  for (const f of fs.readdirSync(POOL_DIR)) if (/^\d+\.json$/.test(f)) fs.rmSync(path.join(POOL_DIR, f));
  const chunks = Math.ceil(kept.length / CHUNK);
  for (let n = 0; n < chunks; n++) fs.writeFileSync(path.join(POOL_DIR, n + '.json'), JSON.stringify(kept.slice(n * CHUNK, (n + 1) * CHUNK)));
  fs.writeFileSync(path.join(POOL_DIR, 'index.json'), JSON.stringify({ updated: new Date().toISOString(), count: kept.length, chunks })); // nouvelle date : les navigateurs rechargent la réserve
  fs.writeFileSync(path.join(POOL_DIR, 'farms.json'), JSON.stringify([...farms]));
  console.log(`Réserve : ${rows.length} → ${kept.length} titres (${rows.length - kept.length} retirés, ${farms.size} fermes connues)`);
})().catch(e => { console.error(e); process.exit(1); });
