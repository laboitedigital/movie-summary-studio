# Guide de déploiement — VPS (Hostinger / DigitalOcean)

Ce guide suppose un VPS Ubuntu 22.04 ou 24.04, avec au moins **2 vCPU / 4 Go RAM**
(l'encodage vidéo ffmpeg consomme du CPU — sur un VPS à 1 vCPU, ce sera lent).

---

## 1. Créer le VPS

- **Hostinger VPS** : plan KVM 2 (2 vCPU / 8 Go) est confortable. Choisis Ubuntu 24.04 LTS comme image.
- **DigitalOcean** : Droplet "Basic" 2 vCPU / 4 Go (~24$/mois) ou un Droplet CPU-Optimized si tu veux pousser plus de rendus en parallèle plus tard.

Note l'adresse IP publique du serveur une fois créé.

---

## 2. Connexion initiale et sécurisation de base

```bash
ssh root@TON_IP_VPS

# Mise à jour du système
apt update && apt upgrade -y

# Créer un utilisateur non-root (recommandé)
adduser popol
usermod -aG sudo popol

# Pare-feu de base
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

Reconnecte-toi ensuite avec `ssh popol@TON_IP_VPS` pour la suite.

---

## 3. Installer Node.js, ffmpeg et les outils nécessaires

```bash
# Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# ffmpeg + ffprobe (essentiel — sans ça le rendu vidéo échoue)
sudo apt install -y ffmpeg

# Vérifier
node --version
ffmpeg -version

# Git, Nginx, PM2
sudo apt install -y git nginx
sudo npm install -g pm2
```

---

## 4. Déployer le code

**Option A — via git (recommandé si tu mets ton projet sur GitHub/GitLab) :**
```bash
cd ~
git clone TON_REPO_GIT movie-summary-studio
cd movie-summary-studio
```

**Option B — via transfert direct du zip (depuis ton ordi) :**
```bash
# Sur ton ordi local, dans le dossier du zip :
scp youtube-movie-summary-generator-ameliore.zip popol@TON_IP_VPS:~/

# Sur le VPS :
sudo apt install -y unzip
unzip youtube-movie-summary-generator-ameliore.zip
mv project movie-summary-studio
cd movie-summary-studio
```

---

## 5. Configurer les clés API

```bash
cp .env.example .env
nano .env
```

Remplis au minimum `GEMINI_API_KEY`. Ajoute `CLAUDE_API_KEY` si tu veux utiliser Claude pour la génération de script, et `CLIP_CAFE_API_KEY` si tu as une clé Scrapestack pour fiabiliser la recherche de clips.

---

## 6. Installer les dépendances et builder

```bash
npm install
npm run build
```

---

## 7. Lancer avec PM2 (garde le serveur actif en continu)

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # suit les instructions affichées pour démarrer PM2 au boot du serveur
```

Commandes utiles :
```bash
pm2 status              # voir si l'app tourne
pm2 logs movie-summary-studio   # voir les logs en direct (utile pour déboguer ffmpeg)
pm2 restart movie-summary-studio
```

---

## 8. Configurer Nginx (reverse proxy)

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/movie-summary-studio
sudo nano /etc/nginx/sites-available/movie-summary-studio
# -> remplace "video.tondomaine.com" par ton vrai sous-domaine

sudo ln -s /etc/nginx/sites-available/movie-summary-studio /etc/nginx/sites-enabled/
sudo nginx -t          # vérifie qu'il n'y a pas d'erreur de syntaxe
sudo systemctl reload nginx
```

---

## 9. Pointer ton domaine (DNS chez Hostinger)

Dans le panneau Hostinger (DNS de ton domaine) :
- Ajoute un enregistrement **A** :
  - Nom : `video` (ou le sous-domaine que tu veux, ex: `studio`)
  - Valeur : l'IP de ton VPS
  - TTL : par défaut

Attends quelques minutes à quelques heures pour la propagation DNS (souvent c'est rapide, 5-15 min).

---

## 10. Activer le HTTPS (gratuit, via Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d video.tondomaine.com
```

Certbot configure automatiquement Nginx pour le HTTPS et renouvelle le certificat automatiquement.

---

## 11. Tester

Va sur `https://video.tondomaine.com` et :
1. Génère un script (vérifie que la clé Gemini/Claude fonctionne)
2. Génère une narration TTS
3. Cherche et assigne un extrait Clip.Cafe
4. Lance l'export final — surveille `pm2 logs` en parallèle pour voir le rendu ffmpeg progresser en temps réel

---

## Dépannage rapide

| Problème | Cause probable |
|---|---|
| "Le rendu vidéo a échoué" | ffmpeg/ffprobe pas installés ou pas dans le PATH — vérifie avec `which ffmpeg` |
| Erreur 413 (payload trop large) | Augmenter `client_max_body_size` dans la config Nginx |
| Rendu très lent | VPS sous-dimensionné en CPU — vise 2 vCPU minimum |
| App inaccessible après reboot du VPS | `pm2 startup` n'a pas été configuré correctement — relance l'étape 7 |
| Téléchargement de clip échoue (403/404) | Le scraping de Clip.Cafe est fragile par nature — le fallback automatique vers le catalogue de secours ou une image prend le relais |
