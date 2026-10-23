// Vérifie que Sillon fonctionne de bout en bout, vu d'Internet. Lancé toutes les 6 heures par health.yml.
// Code de sortie 0 : tout va bien ; 2 : au moins un problème (le détail est écrit dans tools/HEALTH.md).
const fs = require('fs');
const path = require('path');

const SITE = 'https://sillon.cloud/';
const SB_URL = 'https://nqigjixiqtaavfscqhag.supabase.co';
const SB_KEY = 'sb_publishable_il0mHmr3JCISQaX-QeevDg_tKOmG3E4';
const UA = { 'User-Agent': 'Sillon-health/1.0 (+https://github.com/flantechnique/Sillon)' };

async function get(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try { return await fetch(url, { ...opts, headers: { ...UA, ...opts.headers }, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

const checks = {
  async 'Site en ligne'() {
    const r = await get(SITE);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    if (!(await r.text()).includes('Sillon')) throw new Error('page inattendue');
  },
  async 'Réserve de titres à jour'() {
    const idx = await (await get(SITE + 'pool/index.json')).json();
    const age = (Date.now() - new Date(idx.updated)) / 3600000;
    if (age > 36) throw new Error(`dernier tirage il y a ${Math.round(age)} h (le tirage quotidien a dû échouer)`);
    if (idx.count < 1000) throw new Error(`seulement ${idx.count} titres en réserve`);
  },
  async 'Titre du jour'() {
    const d = await (await get(SITE + 'pool/daily.json')).json();
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' });
    if (d.day !== today && d.day !== yesterday) throw new Error('pas renouvelé depuis le ' + d.day);
  },
  async 'API Deezer et extraits'() {
    const idx = await (await get(SITE + 'pool/index.json')).json();
    const rows = await (await get(SITE + 'pool/0.json?v=' + encodeURIComponent(idx.updated))).json();
    let ok = 0;
    for (const r of rows.slice(0, 5)) {
      const tr = await (await get('https://api.deezer.com/track/' + r.i)).json();
      if (tr.error?.code === 4) throw new Error('Deezer refuse les requêtes (quota)');
      if (!tr.preview) continue;
      const p = await get(tr.preview, { method: 'HEAD' });
      if (p.ok) ok++;
    }
    if (!ok) throw new Error('aucun extrait lisible sur 5 titres de la réserve');
  },
  async 'Apple Music (secours)'() {
    const r = await get('https://itunes.apple.com/lookup?country=FR&id=1440857781');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    if (!(await r.json()).resultCount) throw new Error('réponse vide');
  },
  async 'Supabase (signalements, synchro, mesure)'() {
    const r = await get(SB_URL + '/rest/v1/rpc/sillon_blocklist', { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok) throw new Error('HTTP ' + r.status + (r.status === 540 || r.status === 503 ? ' (projet en pause ?)' : ''));
  },
};

(async () => {
  const failed = [];
  for (const [name, fn] of Object.entries(checks)) {
    try { await fn(); console.log('ok  ', name); }
    catch (e) { console.log('ÉCHEC', name, '-', e.message); failed.push(`- **${name}** : ${e.message}`); }
  }
  const out = path.join(__dirname, 'HEALTH.md');
  if (failed.length) {
    fs.writeFileSync(out, `Vérification du ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC :\n\n${failed.join('\n')}\n\nLe plan B est décrit dans le README (section « Plan B »).\n`);
    process.exit(2);
  }
  fs.rmSync(out, { force: true });
})();
