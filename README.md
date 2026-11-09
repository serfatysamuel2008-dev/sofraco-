# Groupe Sofraco — refonte du site vitrine

Proposition de refonte de [sofraco.com](https://sofraco.com) : même identité (logo officiel, orange #f59c00 / #ee7203 / #e74011, typo Epilogue), mêmes contenus, mêmes liens — avec une mise en scène plus moderne et animée.

## Contenu repris du site original
- Navigation complète (À propos, Devenir courtier + sous-pages, Trouver un courtier, Expert-comptable, Solutions du dirigeant, Solutions collectives, Nos actions, Accès Membre, Actualités, Rejoignez-nous) — tous les liens pointent vers les pages réelles de sofraco.com.
- Textes officiels : présentation du Groupe, citation, retraite / prévoyance / santé / épargne (dirigeant & collectif), méthode d'analyse et de diagnostic, devenir courtier, relation expert-comptable, carte des courtiers, 3 dernières actualités, actions RSE.
- Chiffres : depuis 1987, +300 cabinets, 100 000 dirigeants, +60 compagnies.
- Contact : 05 57 35 57 35 · info@sofraco.com · LinkedIn · mentions légales.
- Photos du site original (dossier `assets/img/`).

## Animations (GSAP + ScrollTrigger + Lenis)
Chargement avec les chevrons du logo, titres révélés ligne par ligne, photo du hero dévoilée, chiffres animés, lecture mot à mot, citation qui se colore, onglets Dirigeant / Collectif, carte de France avec cabinets qui pulsent, parallaxe, boutons magnétiques, bandeau défilant. Respecte `prefers-reduced-motion`.

## Lancer en local
```bash
python3 -m http.server 8000   # puis http://localhost:8000
```
100 % statique, aucune étape de build.
