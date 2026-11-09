# SOFRACO — site vitrine

Site one-page interactif pour le Groupe SOFRACO (Société Française de Courtage, Bordeaux, depuis 1987).

- **Hero WebGL** (Three.js) : prisme en verre qui décompose un faisceau de lumière blanche en spectre, réactif à la souris, au clic et au scroll.
- **Motion design** (GSAP + ScrollTrigger + Lenis) : préchargeur, reveal des titres, manifeste mot à mot, compteurs, galerie horizontale épinglée, cartes en tilt 3D, curseur custom, boutons magnétiques, marquee sensible à la vitesse de scroll.
- 100 % statique, aucune étape de build : les librairies sont dans `assets/vendor/`.

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Déployable tel quel sur GitHub Pages, Netlify, Vercel, etc.

## Structure

```
index.html
assets/css/style.css
assets/js/scene.js   # scène 3D (module ES, Three.js)
assets/js/main.js    # interactions & animations au scroll
assets/vendor/       # three 0.160, gsap 3.12.5, lenis 1.1.13
```
