# Sillon

Un titre au hasard, d'un artiste au hasard. Rien d'autre que la musique.

Sillon tire des titres au hasard dans tout le catalogue Deezer et en joue un extrait de 30 secondes. Aucun chiffre de popularité, aucun algorithme : les titres gardés servent seulement à les retrouver et n'influencent jamais le tirage.

Application web statique, installable sur téléphone.

## Fonctionnement

| Élément | Rôle | Où |
|---|---|---|
| `index.html` | L'appli | GitHub Pages |
| `filter.js` | Filtre « est-ce de la musique ? », partagé par l'appli et le tirage | — |
| `pool/` | Réserve de titres tirés au hasard et filtrés | régénérée chaque jour par `.github/workflows/pool.yml` |
| `tools/build-pool.js` | Script de tirage (Node 18+, sans dépendance) | GitHub Actions ou n'importe quel ordinateur |
| Signalements | Table `sillon_reports` + fonction `sillon_blocklist()` | Supabase (projet top-youtube) |
| Synchronisation | Table `sillon_sync` + fonctions `sillon_sync_get/put` : une ligne par code, identifiée par l'empreinte SHA-256 du code (le code ne quitte jamais les appareils) | Supabase (projet top-youtube) |

Sources audio, dans l'ordre :
1. **Deezer** : réserve (1 requête par titre), puis tirage direct si la réserve est vide.
2. **Apple Music** : prend le relais automatiquement pendant 10 minutes si Deezer refuse ou ne répond plus. Même tirage au hasard (200 identifiants par requête), même catalogue grand public.

Si Supabase ne répond pas, l'appli fonctionne quand même (pas de liste d'exclusion, signalements perdus).

## Règles à respecter

- **Deezer** : seulement les extraits de 30 s, jamais de stockage de l'audio, crédit « Deezer » avec lien sur chaque titre. La réserve ne contient que des identifiants. Respecter ~50 requêtes / 5 s par adresse IP (le tirage est réglé à 8/s).
- **Apple Music** (iTunes Search API) : extraits seulement, jamais mis en cache ; sur chaque titre Apple, le badge officiel « Listen on Apple Music » non modifié (`badges/`, récupéré sur toolbox.marketingtools.apple.com) avec lien direct vers le titre, et la mention « Provided courtesy of iTunes » ; ~20 requêtes / minute par adresse IP. Les extraits doivent servir à promouvoir le titre, jamais un autre produit.
- **GitHub Pages** : pas d'usage commercial, ~100 Go de bande passante par mois.

## Mesure d'audience

Anonyme et sans identifiant : chaque téléphone envoie au plus un « passage » par jour (avec la date de sa première visite, pour la rétention par cohortes) et des compteurs groupés (titres écoutés, écoutés jusqu'au bout, gardés, partagés, liens ouverts, écoutes à l'aveugle, signalements). Fonction `sillon_track`, tables `sillon_daily` et `sillon_cohort`, lisibles par l'administrateur seulement. Synthèse : vues `sillon_stats` (par jour) et `sillon_retention` (retour à 7 jours). Désactivable dans « À propos » (toucher le logo).

## Veille des conditions

Chaque lundi, `.github/workflows/terms.yml` lance `tools/watch-terms.js` : il relit les conditions de Deezer (guidelines, terms of use) et la page de l'API Apple, en garde le texte dans `tools/terms/`, et ouvre une *issue* GitHub (notification par e-mail) si l'une a changé. Le diff du commit montre ce qui a bougé.

Point clé des conditions Deezer (section IV) : usage **strictement non commercial**. Aucun revenu, publicité, don, lien affilié ni contrepartie lié au service ou aux titres.

## Plan B

Tout est portable : l'appli ne dépend que de chemins relatifs.

- **Si GitHub Pages ferme l'accès** : glisser le dossier sur Netlify Drop (app.netlify.com/drop) ou Cloudflare Pages. Rien à modifier.
- **Si GitHub Actions s'arrête** : lancer le tirage ailleurs (ordinateur, serveur, autre service de tâches planifiées), puis publier le dossier `pool/` avec l'appli :
  ```
  node tools/build-pool.js
  ```
  Options : `TARGET` (nombre de nouveaux titres, 2500), `MAX_MINUTES` (100), `RATE` (requêtes/s, 8).
- **Si Deezer coupe l'accès** : Apple Music prend le relais tout seul. Pour en faire la source principale, inverser l'ordre dans `findTrack()`.
- **Si Supabase disparaît** : recréer les tables avec les migrations `sillon_*` (projet top-youtube), changer `SB_URL` et `SB_KEY` dans `index.html` et `tools/build-pool.js`.

## Langues

Interface en français si le téléphone est en français, en anglais sinon (dictionnaire `STR` en tête du script de `index.html`). `?lang=fr` ou `?lang=en` dans l'adresse force une langue.

## Lancer en local

```
py -m http.server 8660
```
