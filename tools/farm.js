// Fermes à contenu (souvent de la musique générée par IA) : repérées à leur cadence de publication,
// jamais à leur popularité (ni fans ni écoutes). Règle : apparu en 2022 ou après ET plus de 20 albums par an.
// Mesuré le 24/10/2026 sur 90 artistes de la réserve : 8 écartés, tous des fermes évidentes ;
// les artistes anciens et prolifiques (rééditions, compilations) ne sont pas concernés.
const FARM_SINCE = 2022;
const FARM_RATE = 20;

// dz(path) : requête Deezer (renvoie l'objet JSON, ou null si l'ID n'existe pas).
async function farmCheck(dz, artistId) {
  const ar = await dz('/artist/' + artistId);
  const n = (ar && ar.nb_album) || 0;
  if (n <= FARM_RATE) return false; // moins de 21 albums : jamais une ferme selon la règle
  // L'ordre des albums n'est pas strictement chronologique : on prend la plus ancienne date des 25 derniers.
  const page = await dz(`/artist/${artistId}/albums?index=${Math.max(0, n - 25)}&limit=25`);
  const years = ((page && page.data) || []).map(a => +String(a.release_date || '').slice(0, 4)).filter(y => y > 1900);
  if (!years.length) return false;
  const first = Math.min(...years);
  if (first < FARM_SINCE) return false;
  const active = new Date().getFullYear() - first + 1;
  return n / active > FARM_RATE;
}

module.exports = { farmCheck, FARM_SINCE, FARM_RATE };
