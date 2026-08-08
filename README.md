<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dd5e38b2-db2a-41a7-8cb1-ee4fe194aa03

## Run Locally

**Prerequisites:**  Node.js, **ffmpeg + ffprobe installed and available in your system PATH**


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Rendu vidéo réel (ffmpeg)

L'export final de la vidéo (bouton "Compiler la Vidéo Summary") effectue un **vrai rendu côté serveur** via `ffmpeg` :
- Téléchargement des extraits Clip.Cafe assignés (ou de l'image de référence en mode Ken Burns si activée)
- Découpage de chaque extrait à un maximum de 7 secondes continues (anti-Content ID), avec possibilité d'assigner plusieurs extraits courts par segment ("beats")
- Effets visuels anti-détection optionnels (miroir, léger zoom, filtre couleur) — activés par défaut
- Narration TTS comme seule piste audio (l'audio original des extraits est retiré)
- Incrustation optionnelle des sous-titres jaunes style cinéma
- Concatenation finale en MP4 (H.264 / AAC, 1920x1080)

**Important :** votre serveur de déploiement doit avoir `ffmpeg` et `ffprobe` installés (`apt install ffmpeg` sur Ubuntu/Debian, ou l'équivalent sur votre hébergeur). Sans ça, le rendu échouera avec un message d'erreur explicite.

## Extraction de bande-annonce officielle (yt-dlp)

La fonctionnalité "Bande-annonce officielle" dans la recherche d'extraits permet de coller un lien YouTube
et d'en extraire soi-même un passage (max 20s) à associer à un beat. Cette fonctionnalité nécessite **yt-dlp**
installé sur le serveur et accessible dans le PATH :

```bash
pip install yt-dlp --break-system-packages
# Vérifier l'installation :
yt-dlp --version
```

Sans `yt-dlp` installé, cette fonctionnalité spécifique échouera avec un message d'erreur explicite — le reste
de l'application (génération de script, recherche Clip.Cafe, export ffmpeg) continue de fonctionner normalement.

Si votre reverse proxy (Nginx, Hostinger, etc.) a un timeout HTTP court, ce n'est pas un problème : le rendu se fait en tâche de fond (`POST /api/render/start` retourne immédiatement un `jobId`, puis le frontend interroge `GET /api/render/status/:jobId` toutes les 1.5s jusqu'à la fin).

Les fichiers rendus sont stockés dans `render-output/` (exclu de git) et nettoyés automatiquement après 24h.

