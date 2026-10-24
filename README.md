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
1. **Deezer** : réserve (1 requête par titre). Si la réserve est épuisée, Apple Music prend le relais.
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

## Devinette du jour

Chaque matin, après le tirage de la réserve, `tools/pick-daily.js` choisit au hasard un titre de la réserve (avec un genre connu et une année) et l'écrit dans `pool/daily.json`. Le même pour tout le monde jusqu'au lendemain, sans aucun critère de popularité. On l'écoute à l'aveugle, on devine le genre et la décennie parmi quatre choix (les mêmes pour tous : ils dépendent seulement du jour), puis on révèle. Le résultat se partage comme un Wordle (`■` juste, `□` raté). La série de jours joués d'affilée (un jour manqué toléré) reste sur le téléphone. Lien direct : `https://sillon.cloud/?jour` (`?today` en anglais).

## Côté social, sans compteurs

Rien de public : pas de profil, pas de chiffre, pas de classement. Seulement des liens qu'on choisit d'envoyer.

- **Un mot avec le partage** : `&m=` dans le lien d'un titre, affiché sur l'accueil de celui qui le reçoit.
- **Platine** (`?platine=CODE`) : tous ceux qui ouvrent le même lien entendent la même suite de titres, dans le même ordre (tirage à graine fixe, historique personnel ignoré, un tirage à la fois).
- **Partager son bac** (`?bac=id.id.id`) : les 20 derniers titres gardés, joués en premier chez l'ami, puis le hasard reprend.
- **Merci à l'artiste** : depuis la liste, un message tout prêt copié et une recherche de ses pages (Deezer ne fournit pas les réseaux des artistes).
- **Carnet de fouilles** : genres et décennies explorés, titre le plus ancien. Privé, synchronisé avec le code.
- **Image du mois** : depuis Exporter, une image au format story avec le nombre de titres gardés et leurs pochettes.

## Surveillance

Toutes les 6 heures, `.github/workflows/health.yml` lance `tools/health.js` : site en ligne, réserve tirée depuis moins de 36 h, titre du jour renouvelé, extraits Deezer lisibles, Apple Music et Supabase qui répondent. Au premier problème, une *issue* « alerte » est ouverte (notification par e-mail) ; les échecs suivants s'y ajoutent en commentaire, et elle se ferme toute seule quand tout repart.

## Tableau de bord

`admin.html` : visites, écoutes, partages, provenance des nouveaux visiteurs, retour à 7 jours, signalements regroupés par label et liste d'exclusion. Lecture seule. Il s'ouvre avec un lien secret (`admin.html#k=…`, conservé hors du dépôt) ; la base ne garde que l'empreinte SHA-256 de la clé (table `sillon_admin`, fonction `sillon_admin_data`). Pour changer de clé : remplacer l'empreinte dans `sillon_admin`.

## Mentions légales et données

`legal.html` (français et anglais, lien dans « À propos ») : éditeur Flan Technique, anonyme à titre non professionnel (LCEN art. 6, III, 2), hébergeurs, et politique de confidentialité. Durées annoncées et appliquées chaque nuit par la tâche `sillon-purge-daily` (pg_cron, fonction `sillon_purge`) : synchronisation supprimée après 12 mois sans utilisation, signalements après 24 mois. Si une donnée change, mettre la page à jour.

## Langues

Interface en français si le téléphone est en français, en anglais sinon (dictionnaire `STR` en tête du script de `index.html`). `?lang=fr` ou `?lang=en` dans l'adresse force une langue.

## Kit presse

`press/` : logos (PNG, SVG), visuels réseaux FR/EN, captures d'écran FR/EN, textes de présentation (`press/textes.md`) et archive `press/sillon-kit-presse.zip`. Page en ligne : https://sillon.cloud/press/

## Lancer en local

```
py -m http.server 8660
```
