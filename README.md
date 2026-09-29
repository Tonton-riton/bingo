# 🎮 BINGO CARRIÈRE MANAGER (100% SIMULATION)

Plateforme web interactive et temps réel conçue pour vos sessions de jeu et lives Twitch / YouTube sur **EA Sports FC / FIFA (Mode Carrière Entraîneur)**.

Directement synchronisé avec la grille officielle de 25 défis :
- **25 Défis Carrière** (Défense, Attaque, Transferts, Formation, Finance, Tactique).
- **Points de base** : de 1 à 5 pts selon la difficulté.
- **Bonus Sprint** : **+5 points** par ligne, colonne ou diagonale complétée.
- **Grand Chelem** : **+10 points** si les 25 cases sont validées.
- **Temps réel ultra-rapide** : via WebSockets (Socket.io) avec sons dynamiques et confettis.

---

## 🚀 Démarrage Rapide

### Option 1 : Double-clic (Recommandé sur Windows)
Double-cliquez simplement sur le fichier **`start.bat`**.  
Le serveur se lance et votre navigateur s'ouvre automatiquement sur l'accueil !

### Option 2 : En ligne de commande
```bash
npm start
```
Puis ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000).

---

## 📱 Les Différentes Interfaces

| Interface | URL | Description |
| :--- | :--- | :--- |
| 🏠 **Accueil & Hub** | `http://localhost:3000/` | Tableau de bord avec aperçu du duel et sélecteur de mode. |
| ⚽ **Joueur 1 (Streamer)** | `http://localhost:3000/player.html?p=1` | Grille interactive pour voir et cocher vos défis, voir votre score et vos lignes actives. |
| 🔥 **Joueur 2 (Rival / Invité)** | `http://localhost:3000/player.html?p=2` | Grille interactive pour votre adversaire (accessible depuis son smartphone ou PC sur le réseau). |
| 📺 **Vue Spectateur Live** | `http://localhost:3000/spectator.html` | Vue grand écran avec les 2 grilles côte à côte, la barre de duel en direct et le fil d'activité. |
| 🎥 **Overlay OBS Studio** | `http://localhost:3000/obs.html` | Overlay transparent à intégrer dans OBS Studio / Streamlabs avec alertes animées. |

---

## 🎥 Intégration dans OBS Studio / Streamlabs

Pour afficher le bingo sur votre live :

1. Dans OBS Studio, ajoutez une source **Navigateur (Browser Source)**.
2. Cochez **"URL locale"** ou entrez l'adresse :
   - Pour la barre HUD Scoreboard : `http://localhost:3000/obs.html?mode=hud` (Largeur : `850`, Hauteur : `110`)
   - Pour la grille compacte de Joueur 1 : `http://localhost:3000/obs.html?mode=grid&p=1` (Largeur : `440`, Hauteur : `440`)
   - Pour les alertes seules par-dessus le jeu : `http://localhost:3000/obs.html?mode=alerts` (Largeur : `600`, Hauteur : `150`)
3. Le fond est **100% transparent** par défaut !
4. Dès que vous cochez un défi sur votre smartphone ou PC, une alerte esports animée apparaît en direct sur votre stream !

---

## ⚙️ Fonctionnalités Clés

- **Système de Profil & Comptes** : Bouton "Profil & Club" pour changer votre pseudo, votre club (ex: *AS Saint-Étienne*, *Paris FC*), votre emoji et configurer un code PIN anti-troll.
- **Calculateur Automatique** : Calcul instantané des points de base, détection des lignes horizontales, verticales et diagonales avec attribution automatique des **+5 pts de bonus sprint** et détection du Grand Chelem.
- **Sons et Confettis intégrés** : Effets sonores procéduraux via Web Audio API (aucun fichier audio manquant) et confettis festifs lors des bingos !
- **Sauvegarde persistante** : Toutes vos coches sont sauvegardées automatiquement dans `data/game_state.json` en cas de coupure ou de rafraîchissement.
- **Bouton Réinitialiser** : Permet de remettre à zéro la partie en un clic pour une nouvelle saison.
