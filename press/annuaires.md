# Sillon : fiches pour les annuaires

Textes prêts à copier, en anglais (ces sites sont anglophones). Les visuels sont dans `press/visuels/`, `press/captures/` et `press/video/`.

Ordre conseillé, un site à la fois pour pouvoir répondre aux commentaires :

1. **AlternativeTo** : fiche permanente, aucun timing à respecter. À faire en premier.
2. **Hacker News (Show HN)** : un mardi ou un mercredi, vers 15 h (heure de Paris). Rester disponible 3 ou 4 heures pour répondre.
3. **Product Hunt** : un mardi, mis en ligne à 9 h (heure de Paris, soit minuit à San Francisco). Prévenir quelques personnes la veille, sans demander de votes : c'est contraire aux règles.

Le tableau de bord (`admin.html`) montre ensuite d'où viennent les nouveaux visiteurs : Hacker News et Product Hunt y ont chacun leur ligne.

---

## AlternativeTo (alternativeto.net)

Bouton « Suggest new app », puis ajouter Sillon comme alternative à Radiooooo, Forgotify, Radio Garden et Every Noise at Once.

- **Name** : Sillon
- **Website** : https://sillon.cloud
- **Platforms** : Online, Android (PWA), iPhone (PWA)
- **License** : Free, Open Source
- **Tags** : music-discovery, random, no-algorithm, privacy-focused, no-account, progressive-web-app

**Short description (max 140 caractères)**

> A random track by a random artist, drawn from the whole catalogue. No algorithm, no popularity, no account.

**Full description**

> Sillon plays a 30-second preview of a random track by a random artist, pulled from the entire Deezer catalogue (Apple Music as a fallback). You never hear the same artist twice.
>
> There is no algorithm, no play counts, no follower numbers and no popularity sorting. Saving a track only bookmarks it for you: it never changes what comes next.
>
> Features: swipe feed, blind listening (guess before you reveal), share a track as a link or a story image, today's track (the same random pick for everyone), monthly recap exported to any streaming service, sync between devices without an account.
>
> Free, no ads, no cookies, open source.

---

## Hacker News : Show HN

**Title (max 80 caractères)**

> Show HN: Sillon – a random track by a random artist, no algorithm

**URL** : https://sillon.cloud

**First comment (à poster juste après, depuis ton compte)**

> Hi HN. I built Sillon because every recommendation feed I use keeps circling back to what I already like.
>
> It does one thing: it plays a 30-second preview of a truly random track. A GitHub Action draws random IDs across Deezer's whole catalogue every night (about 4.4 billion possible IDs, most of them empty), keeps the ones that are actually music, and publishes a pool of ~15,000 tracks as static JSON. The page then picks from that pool and fetches a fresh preview. If Deezer stops answering, it falls back to random lookups in the iTunes catalogue.
>
> The hard part was the filter, not the randomness: a random draw is mostly audiobook chapters, white noise, "relaxing rain" farms and karaoke. The filter is plain rules (genres, label patterns, title patterns in a dozen languages). A "not music" button sends the track for review; reports are only used to fix the filter, never to ban an artist.
>
> Deliberate choices: no play counts or popularity signal anywhere, not even hidden; saving a track never affects the draw; no account (sync uses a random code, only its SHA-256 hash is stored); anonymous aggregate stats with an opt-out.
>
> Stack: one HTML file, no framework, GitHub Pages, GitHub Actions for the pool, Supabase for reports and sync. Code: https://github.com/flantechnique/Sillon
>
> I'd love to hear the weirdest thing it plays for you.

---

## Product Hunt

- **Name** : Sillon
- **Tagline (max 60 caractères)** : `A random track by a random artist. No algorithm.`
- **Links** : https://sillon.cloud · https://github.com/flantechnique/Sillon
- **Topics** : Music, Open Source, Privacy
- **Pricing** : Free
- **Thumbnail (240×240)** : `press/producthunt/ph-icone-240.gif` (le disque qui tourne)
- **Gallery (1270×760)**, dans cet ordre : `press/producthunt/ph-1-random.png`, `ph-2-lottery.png`, `ph-3-guess.png`, `ph-4-people.png`, `ph-5-together.png`
- **Video** : la démo `press/video/sillon-demo-en-v3.mp4`, à mettre en ligne sur la chaîne YouTube (en non répertoriée si besoin) pour coller son lien

**Description (max 260 caractères)**

> Sillon plays a random track by a random artist from the whole catalogue. No algorithm, no play counts, never the same artist twice. Listen blind, save what you love, share it as a story. Free, no account, no ads.

**Maker comment**

> Hey Product Hunt! Streaming apps are great at giving you more of what you already like. I wanted the opposite: a slot machine for music, where the only thing that matters is the next 30 seconds.
>
> Every track in Sillon is drawn at random from the full catalogue. No charts, no follower counts, nothing that says "this one is popular". Your saved tracks are just bookmarks: they never steer the draw.
>
> Try blind listening: cover, title and artist stay hidden until you reveal them. Then tell me what you guessed.
>
> It's free and open source, with no account, no ads and no cookies.
