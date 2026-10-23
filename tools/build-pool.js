// Tire au hasard des titres Deezer, garde ceux qui sont de la musique et les ajoute à la réserve (pool/).
// Lancé chaque jour par GitHub Actions ; utilisable en local : node tools/build-pool.js
//   TARGET=nombre de nouveaux titres (défaut 2500), MAX_MINUTES=durée max (défaut 100), RATE=requêtes/s (défaut 8).
const fs = require('fs');
const path = require('path');
const { isMusic, isBlocked, normLabel, randomId } = require('../filter.js');

const TARGET = +process.env.TARGET || 2500;
const MAX_MINUTES = +process.env.MAX_MINUTES || 100;
const RATE = +process.env.RATE || 8; // Deezer tolère ~50 requêtes / 5 s : on reste en dessous
const POOL_MAX = 15000;              // la réserve garde les plus récents (environ une semaine de tirages)
const CHUNK = 1000;
const POOL_DIR = path.join(__dirname, '..', 'pool');
const SB_URL = 'https://nqigjixiqtaavfscqhag.supabase.co';
const SB_KEY = 'sb_publishable_il0mHmr3JCISQaX-QeevDg_tKOmG3E4';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const deadline = Date.now() + MAX_MINUTES * 60000;

// Limiteur : une requête toutes les 1000/RATE ms, toutes tâches confondues.
let nextSlot = Date.now();
async function slot() {
  const wait = nextSlot - Date.now();
  nextSlot = Math.max(nextSlot, Date.now()) + 1000 / RATE;
  if (wait > 0) await sleep(wait);
}

let pause = 0; // ralentissement global quand Deezer refuse
async function dz(p) {
  await slot();
  if (pause) await sleep(pause);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch('https://api.deezer.com' + p, { signal: ctrl.signal, headers: { 'User-Agent': 'Sillon/1.0 (+https://github.com/flantechnique/Sillon)' } });
    if (!res.ok) throw Object.assign(new Error('http ' + res.status), { refused: true });
    const data = await res.json();
    if (data.error) {
      if (data.error.code === 4) throw Object.assign(new Error('quota'), { refused: true });
      return null; // « no data » : l'ID n'existe pas
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError' || e.cause) e.refused = true;
    throw e;
  } finally { clearTimeout(t); }
}

function readPool() {
  try {
    const idx = JSON.parse(fs.readFileSync(path.join(POOL_DIR, 'index.json'), 'utf8'));
    const rows = [];
    for (let n = 0; n < idx.chunks; n++) rows.push(...JSON.parse(fs.readFileSync(path.join(POOL_DIR, n + '.json'), 'utf8')));
    return rows;
  } catch { return []; }
}

async function loadBlocks() {
  const blocks = { artists: new Set(), labels: new Set() };
  try {
    const res = await fetch(SB_URL + '/rest/v1/rpc/sillon_blocklist', { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: '{}' });
    for (const { kind, value } of await res.json()) (kind === 'artist' ? blocks.artists : blocks.labels).add(value);
  } catch (e) { console.warn('liste d\'exclusion indisponible :', e.message); }
  return blocks;
}

async function main() {
  const old = readPool();
  const blocks = await loadBlocks();
  const artists = new Set(old.map(r => r.a));
  const fresh = [];
  const stats = { calls: 0, tracks: 0, rejected: 0, refused: 0 };
  let refusedInRow = 0;

  async function worker() {
    while (fresh.length < TARGET && Date.now() < deadline && refusedInRow < 30) {
      try {
        stats.calls++;
        const tr = await dz('/track/' + randomId());
        refusedInRow = 0; pause = 0;
        if (!tr || !tr.preview || !tr.artist || artists.has(tr.artist.id)) continue;
        stats.tracks++;
        stats.calls++;
        const al = await dz('/album/' + tr.album.id);
        if (!al) continue;
        const album = { ...tr.album, ...al };
        if (!isMusic(tr, album, blocks) || artists.has(tr.artist.id)) { stats.rejected++; continue; }
        artists.add(tr.artist.id);
        fresh.push({ i: tr.id, a: tr.artist.id, g: album.genre_id, l: album.label || '' });
        if (fresh.length % 100 === 0) console.log(`${fresh.length} titres (${stats.calls} requêtes)`);
      } catch (e) {
        if (!e.refused) continue;
        stats.refused++; refusedInRow++;
        pause = Math.min(60000, 2000 * refusedInRow); // on lève le pied, de plus en plus
      }
    }
  }
  await Promise.all(Array.from({ length: RATE }, worker));

  // Les plus récents d'abord, puis les anciens encore valides ; l'exclusion actuelle s'applique aussi aux anciens.
  const kept = [...fresh, ...old.filter(r => !isBlocked({ artist: { id: r.a } }, { label: r.l }, blocks))].slice(0, POOL_MAX);
  for (let i = kept.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [kept[i], kept[j]] = [kept[j], kept[i]]; }

  // On remplace les morceaux de la réserve, sans toucher au titre du jour (daily.json)
  fs.mkdirSync(POOL_DIR, { recursive: true });
  for (const f of fs.readdirSync(POOL_DIR)) if (/^\d+\.json$/.test(f)) fs.rmSync(path.join(POOL_DIR, f));
  const chunks = Math.ceil(kept.length / CHUNK);
  for (let n = 0; n < chunks; n++) fs.writeFileSync(path.join(POOL_DIR, n + '.json'), JSON.stringify(kept.slice(n * CHUNK, (n + 1) * CHUNK)));
  fs.writeFileSync(path.join(POOL_DIR, 'index.json'), JSON.stringify({ updated: new Date().toISOString(), count: kept.length, chunks }));

  console.log(`Nouveaux : ${fresh.length} | réserve : ${kept.length} | requêtes : ${stats.calls} | écartés par le filtre : ${stats.rejected}/${stats.tracks} | refus Deezer : ${stats.refused}`);
  if (refusedInRow >= 30) console.warn('Arrêt anticipé : Deezer refuse les requêtes.');
}

main().catch(e => { console.error(e); process.exit(1); });
