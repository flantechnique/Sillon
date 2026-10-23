// Titre du jour : un titre de la réserve tiré au hasard, le même pour tout le monde jusqu'au lendemain.
// Aucun critère de popularité : un simple tirage. Lancé chaque matin après la réserve (pool.yml).
// Il sert aussi de devinette : on garde son genre et son année pour les réponses.
const fs = require('fs');
const path = require('path');

const POOL_DIR = path.join(__dirname, '..', 'pool');
const FIRST_DAY = Date.UTC(2026, 9, 23); // devinette n°1
// Genres proposés dans la devinette (ceux de Deezer, sans livres audio ni jeunesse) : même liste que GENRES dans index.html
const GENRES = [132, 116, 152, 113, 165, 85, 106, 466, 144, 129, 52, 84, 98, 173, 464, 169, 153, 197, 2, 12, 16, 75, 81];
const read = f => JSON.parse(fs.readFileSync(path.join(POOL_DIR, f), 'utf8'));
const pick = a => a[Math.floor(Math.random() * a.length)];

(async () => {
  const idx = read('index.json');
  const prev = (() => { try { return read('daily.json'); } catch { return null; } })();
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }); // AAAA-MM-JJ
  if (prev?.day === day && !process.env.FORCE) { console.log('Titre du jour déjà tiré :', prev.i); return; }
  const n = Math.round((Date.parse(day) - FIRST_DAY) / 86400000) + 1;

  const rows = [];
  for (let k = 0; k < idx.chunks; k++) rows.push(...read(k + '.json'));
  const candidates = rows.filter(r => GENRES.includes(r.g) && r.a !== prev?.a);
  // On vérifie l'extrait et l'année auprès de Deezer : la devinette a besoin des deux.
  for (let tries = 0; tries < 30; tries++) {
    const r = pick(candidates);
    try {
      const tr = await (await fetch('https://api.deezer.com/track/' + r.i, { headers: { 'User-Agent': 'Sillon/1.0 (+https://github.com/flantechnique/Sillon)' } })).json();
      const y = +(tr.release_date || tr.album?.release_date || '').slice(0, 4);
      if (!tr.preview || !(y >= 1930 && y <= new Date().getFullYear())) continue;
      fs.writeFileSync(path.join(POOL_DIR, 'daily.json'), JSON.stringify({ day, n, i: r.i, a: r.a, g: r.g, y }));
      console.log('Titre du jour :', day, 'n°' + n, r.i, r.g, y);
      return;
    } catch (e) { console.warn('essai raté :', e.message); }
  }
  console.error('Aucun titre du jour trouvé'); process.exitCode = 1;
})();
