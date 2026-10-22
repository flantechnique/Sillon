// Filtre « est-ce de la musique ? », partagé entre l'appli (navigateur) et le tirage de la réserve (Node, GitHub Actions).
// Écarte livres audio, contes, podcasts et fermes à musique d'ambiance.
(function (root) {
  const MAX_TRACK_ID = 4400000000; // les IDs de titres Deezer existent jusqu'à ~4,4 milliards (mesuré le 22/10/2026)

  const EXCLUDED_GENRES = new Set([457, 95]); // Livres audio, Jeunesse
  const HEAVY_GENRES = new Set([464, 152, 116, 85]); // Metal, Rock, Rap, Alternative
  // Textes lus et podcasts : repérés sur artiste, album et label, quel que soit le genre.
  const SPOKEN = new RegExp([
    'podcast', '[ée]pisode', 'chapitre', 'chapter', 'kapitel', 'cap[ií]tulo', 'capitolo', 'hoofdstuk', 'rozdzia[łl]',
    'livre audio', 'audio ?books?', 'audiolibro', 'h[öo]rbuch', 'h[öo]rspiel', 'lesung', 'sermon', 'pr[ée]dication', 'conf[ée]rence',
    // russe : livre audio, éditeurs de livres audio (\b ne marche pas avec le cyrillique)
    'аудиокниг', 'эксмо', '(^|[^а-яё])аст([^а-яё]|$)', 'азбука-аудиокнига', 'ардис',
  ].join('|'), 'i');
  // Fermes à fond sonore reconnaissables dans tous les genres (le lo-fi y est souvent classé « Rap »).
  const AMBIENCE_ANY_GENRE = /lo-?fi|\bbgm\b|sounds? of nature|nature sounds?|white noise|asmr|binaural|\d{3} ?hz|sleep music|relaxing music|meditation music|spa music|まったり|のんびり|リラックス|睡眠|作業用|勉強用|ヒーリング|癒し|轻音乐|助眠|冥想|放松|수면|힐링|명상/i;
  // Fermes à musique d'ambiance : même repérage (leur genre dit souvent « Pop » ou « Electro »).
  const AMBIENCE = new RegExp([
    'sleep', 'sommeil', 'schlaf', 'dormir', 'relax', 'd[ée]tente', 'entspann', 'medita', 'm[ée]ditation', 'mindful', 'yoga', '\\bspa\\b',
    'massage', 'reiki', 'chakra', '\\bzen\\b', 'calm', 'sooth', 'apais', 'healing', 'gu[ée]rison', 'insomni', 'hypno', 'affirmation',
    'therap', 'white noise', 'brown noise', 'pink noise', 'bruit blanc', 'rain sounds?', 'bruit de (la )?pluie', 'nature sounds?', 'sons? de la nature',
    'ocean waves', 'thunderstorm', 'asmr', 'binaural', 'solfeggio', '\\d{3} ?hz', 'frequenc', 'fr[ée]quence',
    'study music', 'focus music', 'for (study|studying|focus|work|reading)', 'study ?& ?focus', 'lo-?fi beats', 'beats to', 'concentration', 'lullab', 'berceuse', 'for babies', 'pour b[ée]b[ée]', 'background music', "musique d'ambiance",
    'ambiance music', 'relajant', 'relaxant', 'rilassant', '\\bbgm\\b', 'chill ?out music', 'chill music', 'caf[ée] music', 'coffee shop',
    '(music|musique|m[uú]sica|musik) (for|pour|para|per|zum|zur) ', 'lounge music', 'spa music', 'piano bar', 'karaoke', 'karaok[ée]',
  ].join('|'), 'i');
  // Titres seuls : uniquement les marqueurs non ambigus (une chanson peut s'appeler « Rain » ou « Sleep »).
  const NOT_MUSIC_TITLE = /podcast|[ée]pisode \d|(chapitre|chapter|kapitel|hoofdstuk|cap[ií]tulo|capitolo|rozdzia[łl]|luku|kapittel) \d|^часть \d|^глава \d|white noise|bruit blanc|asmr|binaural|\d{3} ?hz|sleep music|relaxing music|karaok/i;

  const normLabel = l => String(l || '').trim().toLowerCase();

  // blocks : { artists: Set<string>, labels: Set<string> } — exclusions décidées après relecture des signalements.
  function isBlocked(track, album, blocks) {
    return !!blocks && (blocks.artists.has(String(track.artist.id)) || blocks.labels.has(normLabel(album.label)));
  }

  // track : objet /track de Deezer ; album : objet /album (pour genre_id, genres, label).
  function isMusic(track, album, blocks) {
    if (isBlocked(track, album, blocks)) return false;
    if (EXCLUDED_GENRES.has(album.genre_id)) return false;
    if (((album.genres && album.genres.data) || []).some(g => EXCLUDED_GENRES.has(g.id))) return false;
    if (track.duration && (track.duration > 900 || track.duration < 45)) return false;
    const name = track.artist.name || '';
    if (name.length > 45 || (name.match(/,/g) || []).length >= 2) return false; // noms-catalogues à mots-clés
    const catalog = [name, album.title, album.label].join(' | ');
    if (SPOKEN.test(catalog) || AMBIENCE_ANY_GENRE.test(catalog)) return false;
    // Pas de musique d'ambiance en metal, rock, rap ou alternatif : on n'y cherche pas ces mots (« Sleep » y est un vrai titre).
    if (!HEAVY_GENRES.has(album.genre_id) && AMBIENCE.test(catalog)) return false;
    if (NOT_MUSIC_TITLE.test(track.title || '')) return false;
    return true;
  }

  const randomId = () => Math.floor(Math.random() * MAX_TRACK_ID) + 1;

  const api = { MAX_TRACK_ID, SPOKEN, AMBIENCE, normLabel, isBlocked, isMusic, randomId };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SillonFilter = api;
})(typeof window !== 'undefined' ? window : globalThis);
