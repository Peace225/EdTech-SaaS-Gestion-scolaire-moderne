# 🎓 EdTech SaaS - Portail de Gestion Scolaire Moderne

> Une plateforme de gestion scolaire complète, sécurisée et intuitive, conçue avec un design *Dark Premium (Glassmorphism)*. Idéale pour les établissements éducatifs modernes.

Développé par **Light Energy Digital** - Abidjan, Côte d'Ivoire 🇨🇮.

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-6.12-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🌟 À propos du projet

Ce projet est une solution **SaaS** complète visant à digitaliser et fluidifier la gestion quotidienne des établissements scolaires. Il offre des interfaces dédiées pour chaque acteur de l'écosystème éducatif, garantissant un accès sécurisé et personnalisé aux données (notes, absences, facturation, devoirs).

### 🚀 Fonctionnalités Clés par Rôle

#### 🛡️ Administration (ADMIN)
- **Tableau de bord global** : Vue d'ensemble des statistiques de l'école.
- **Gestion des utilisateurs** : Création et gestion des comptes (Profs, Élèves, Parents).
- **Scolarité & Facturation** : Suivi des paiements en FCFA, génération de reçus PDF avec code QR de vérification.
- **Organisation académique** : Gestion des classes, des matières et affectation des professeurs.

#### 👨‍🏫 Espace Enseignant (TEACHER)
- **Gestion des cours & supports** : Partage de documents avec les classes.
- **Évaluations & Devoirs** : 
  - Création de Devoirs Maison (dépôt de fichiers).
  - Création d'Interrogations en Ligne (chronométrées de 20 à 30 min).
- **Suivi des copies** : Réception, correction et notation des travaux rendus.
- **Saisie des notes** : Génération automatisée des moyennes.

#### 👨‍🎓 Portail Élève (STUDENT)
- **Tableau de bord personnel** : Suivi de l'évolution scolaire.
- **Espace de travail** : Accès aux cours, supports et exercices.
- **Devoirs & Compositions** : Réalisation de quiz en ligne avec compte à rebours ou dépôt de fichiers (PDF, Word).
- **Bulletins & Notes** : Consultation des notes par matière et des moyennes trimestrielles.

#### 👨‍👩‍👧 Portail Parent (PARENT)
- **Vue Famille** : Accès centralisé aux dossiers de tous les enfants rattachés au parent.
- **Suivi Pédagogique** : Visualisation des bulletins, des dernières notes et des absences non justifiées.
- **Gestion Financière** : Suivi des factures impayées et téléchargement des reçus de paiement officiels.

---

## 🛠️ Stack Technique

* **Framework :** Next.js 16 (App Router, Server Actions, Turbopack)
* **Base de données :** PostgreSQL
* **ORM :** Prisma 6
* **Authentification :** Auth.js (NextAuth v5) avec gestion stricte des rôles (RBAC)
* **Design / UI :** Tailwind CSS (Interface Glassmorphism Dark Premium), Lucide React (Icônes)
* **Génération PDF & QR Code :** `pdf-lib`, `qrcode`

---

## 💻 Installation & Démarrage local

### 1. Prérequis
- Node.js (v18 ou supérieur)
- PostgreSQL (en local ou hébergé via Supabase/Vercel)

### 2. Cloner le projet
```bash
git clone [https://github.com/Peace225/EdTech-SaaS-Gestion-scolaire-moderne.git](https://github.com/Peace225/EdTech-SaaS-Gestion-scolaire-moderne.git)
cd EdTech-SaaS-Gestion-scolaire-moderne