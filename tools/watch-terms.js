// Veille des conditions d'utilisation des sources : récupère chaque page, en garde le texte brut
// dans tools/terms/, et signale (code de sortie 2) si l'une a changé depuis la dernière fois.
// Lancé chaque semaine par .github/workflows/terms.yml ; utilisable en local : node tools/watch-terms.js
const fs = require('fs');
const path = require('path');

const PAGES = {
  'deezer-guidelines': 'https://developers.deezer.com/guidelines',
  'deezer-terms': 'https://developers.deezer.com/termsofuse',
  'apple-search-api': 'https://performance-partners.apple.com/search-api',
};
const DIR = path.join(__dirname, 'terms');

// Texte lisible et stable : sans scripts, styles, balises ni espaces superflus.
function toText(html) {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  const changed = [];
  for (const [name, url] of Object.entries(PAGES)) {
    let text;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Sillon terms watcher; +https://github.com/flantechnique/Sillon)' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      text = toText(await res.text());
    } catch (e) {
      console.warn(`${name} : page indisponible (${e.message}), ignorée cette fois`);
      continue;
    }
    if (text.length < 500) { console.warn(`${name} : contenu trop court, ignoré`); continue; }
    const file = path.join(DIR, name + '.txt');
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before !== text) {
      fs.writeFileSync(file, text);
      if (before !== null) changed.push(`${name} (${url})`);
      console.log(`${name} : ${before === null ? 'enregistrée' : 'MODIFIÉE'}`);
    } else console.log(`${name} : inchangée`);
  }
  if (changed.length) {
    fs.writeFileSync(path.join(DIR, 'CHANGED'), changed.join('\n'));
    process.exitCode = 2;
  }
}

main().catch(e => { console.error(e); process.exit(1); });
