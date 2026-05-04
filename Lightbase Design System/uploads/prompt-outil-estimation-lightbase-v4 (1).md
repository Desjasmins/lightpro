# Prompt v4 — Outil d'estimation budgétaire Lightbase
## Mise aux normes et conversion DEL — éclairage sportif municipal

> **Version** : 4.0 — kick-off ready. Toutes les questions résiduelles ont été assignées ou tranchées.  
> **Changement majeur depuis v3** : l'installation est explicitement exclue du périmètre de l'outil. Le bilan budgétaire couvre uniquement luminaires, accessoires, ingénierie et contrôle.  
> **Sources intégrées** :
> - Brief client initial (workflow 11 étapes)
> - Décisions client (AWS, FR/EN, backend v1, Cognito, Loi 25)
> - Formation IES RP-6-22 / AGI32 — DeLight Co., Vincent Lévesque ing. (automne 2023)
> - Soumission UMQ Parcs DeLight (2023) — grille de prix réelle, 100+ parcs
> - Brochure produit LIGHTPRO OM v3 FR (Lightbase, 2025)  
> 
> Les rares blocs `[À CONFIRMER]` restants sont marqués en gras.

---

## 1. Rôle et mission

Tu es un développeur full-stack senior. Ta mission est de concevoir, développer et déployer sur **AWS (région ca-central-1)** un **outil web bilingue (FR/EN)** d'estimation budgétaire, accessible par lien partageable, qui permet à un ingénieur municipal ou à un représentant de municipalité d'obtenir une **évaluation budgétaire automatisée** pour la mise aux normes et la conversion DEL de l'éclairage de terrains sportifs, à partir des produits **Lightbase Lightpro OM** (gammes OM300 et OM400).

L'outil produit un **bilan budgétaire** comparant deux scénarios (remplacement 1 pour 1 et conformité IES RP-6-22) que l'utilisateur peut télécharger en PDF et utiliser pour amorcer une discussion commerciale.

---

## 2. Persona et contexte d'usage

- **Utilisateur cible** : ingénieur municipal, gestionnaire d'infrastructures sportives, ou représentant de municipalité.
- **Niveau technique** : à l'aise avec le web, mais non spécialiste de l'éclairage. Vocabulaire et choix par défaut doivent guider sans présumer.
- **Objectif** : ordre de grandeur budgétaire crédible pour un parc en moins de 15 minutes, sans visite terrain.
- **Contexte** : desktop principalement (cartographie + placement de fûts), tablette acceptable.

---

## 3. Identité visuelle, langue et ton

### 3.1 Langage visuel — aligné sur la brochure Lightpro OM v3
- **Palette dominante** : gris chauds (warm grey), noir profond, blanc cassé, accents subtils. Aucune couleur saturée en dehors des photos sportives.
- **Photographie** : nocturne sportive (terrains illuminés, athlètes en mouvement), captures aériennes de parcs, vues 3D du produit sur fond gris, plans techniques fins.
- **Typographie** : sans-serif géométrique pour les titres en majuscules espacées (ex. « LIGHTPRO OM », « CARACTÉRISTIQUES »), corps de texte léger et aéré, hiérarchie marquée par la graisse plutôt que par la couleur.
- **Logo** : icône grille 3×3 noire, mot-symbole « lightbase » bas-de-casse fin, toujours en pied de page.
- **Composants** : cartes plates (pas d'ombre prononcée), grandes images pleine largeur, beaucoup d'espace blanc, séparateurs horizontaux fins.
- **À proscrire** : dégradés colorés, ombres portées marquées, icônes flat-design génériques, emojis, accent lines sous les titres.

### 3.2 Réutilisation des assets de la brochure
Les images suivantes (extraites de `LIGHTPRO-OM-BROCHURE_V3_FR.pdf`) doivent être réutilisées dans l'outil :
- **Page 1 (couverture)** : duo Lightpro OM Quadruple — utilisable en hero de la page d'atterrissage.
- **Page 5 — athlète sur piste éclairée** : illustration des sections « pourquoi convertir au DEL ».
- **Page 6 — stade nocturne** : page de bilan / rapport.
- **Page 7 — silhouette de mât** : section « applications par sport ».
- **Page 9 — modules OM300 et OM400** : section catalogue produit.
- **Pages 11, 12, 13, 14, 15, 16** : vues éclatées et accessoires (visière, support, bras, laser) pour la section « options ».
- **Pages 22, 23** : exemples de rapports photométriques et configurations de braquettes — section « livrables d'une étude détaillée ».
- **Pages 27, 28, 29** : distributions polaires et tableaux EPA — section « ingénierie ».

### 3.3 Bilingue FR/EN
- Sélecteur de langue persistant en en-tête.
- URL préfixée `/fr/...` et `/en/...`, balises `hreflang` dans le `<head>`.
- Fichiers de traduction JSON (`fr.json`, `en.json`) chargés via `react-i18next`.
- Langue par défaut : français (Québec).
- Glossaire technique bilingue maintenu cohérent (ex. : *fût* / *pole*, *traverse* / *crossarm*, *éclairement* / *illuminance*).

### 3.4 Ton éditorial
Professionnel, technique mais accessible, factuel. Aucun emoji. Phrases courtes. Vocabulaire métier respecté (les utilisateurs sont ingénieurs).

### 3.5 Marque commerciale
- Marque grand public : **Lightbase**.
- Ligne produit : **Lightpro OM**.
- Codes internes : `DLLP-OM300-...` (DeLight LightPro). Ces codes apparaissent dans les fiches techniques téléchargeables et dans le PDF de bilan, mais l'interface utilise « Lightpro OM » dans les textes.

---

## 4. Stack technique et infrastructure AWS

### 4.1 Frontend
- **Framework** : React 18 + TypeScript + Vite.
- **Styling** : Tailwind CSS, configuré avec les tokens issus de la brochure Lightpro (palette, typographie, espacements).
- **i18n** : `react-i18next`.
- **Cartographie** : Google Maps JavaScript API (vue satellite, zoom 19 par défaut) + Drawing Library (polygone, calcul d'aire) + Places Autocomplete (biais Québec).
- **Capture d'écran** : `html2canvas` sur le conteneur de la carte → upload S3.
- **Placement de fûts** : drag-and-drop sur l'image capturée (`react-dnd` ou Konva.js pour gestion canvas).
- **Génération PDF** : `pdfmake` côté client, mise en page calquée sur les rapports DeLight (cf. page 22 de la brochure).

### 4.2 Backend
- **Runtime** : Node.js 20 + TypeScript.
- **Pattern** : API REST sur **AWS Lambda + API Gateway**. Un handler par ressource (`/projects`, `/fields`, `/poles`, `/calculate`, `/quote`).
- **Validation** : `zod` pour tous les schémas d'entrée.
- **Moteur de calcul photométrique** : Lambda dédiée, abaques IES RP-6-22 et catalogue produit versionnés en JSON (voir §9 et §7).

### 4.3 Authentification
- **AWS Cognito** (User Pool en `ca-central-1`).
- Email + mot de passe, MFA optionnel, SSO Google en option.
- JWT vérifié par API Gateway (Cognito Authorizer).
- Avant création de compte : projet en `sessionStorage` côté client.

### 4.4 Persistance
- **Aurora Serverless v2 PostgreSQL** (`ca-central-1`) pour projets, terrains, fûts, résultats, devis.
- **S3** (bucket privé, `ca-central-1`, chiffrement KMS) pour screenshots de parcs et PDF générés.
- Sauvegardes automatiques quotidiennes, rétention 30 jours.

### 4.5 Déploiement
- **IaC** : AWS CDK (TypeScript).
- **Frontend** : S3 + CloudFront, certificat ACM, SPA fallback.
- **Domaine** : `estimateur.lightbase.ca` (sous-domaine).
- **CI/CD** : GitHub Actions → environnements `dev`, `staging`, `prod`.
- **Observabilité** : CloudWatch Logs, métriques personnalisées (nb d'estimations générées, taux de conversion en compte), alarmes erreurs Lambda.

### 4.6 Conformité Loi 25 (Québec)
- Données stockées en `ca-central-1` exclusivement.
- Politique de confidentialité FR/EN dans le pied de page.
- Routes `/account/data/export`, `/account/data/delete` pour droits d'accès / rectification / suppression.
- Consentement explicite à l'inscription (case non pré-cochée).
- Registre des incidents et notification 72h.

---

## 5. Flux utilisateur — Parcours principal (11 étapes)

### Étape 1 — Accès via lien partagé
URL publique sans authentification. Page d'atterrissage : valeur de l'outil en 3 lignes, hero avec image Lightpro OM Quadruple (page 1 de la brochure), CTA principal « Démarrer une estimation » / « Start an estimate ».

### Étape 2 — Documentation des solutions Lightpro OM
Section « Nos solutions » consultable depuis la navigation. Présentation de la gamme :

- **Lightpro OM300** — module Simple, Double, Quadruple — disponible immédiatement.
- **Lightpro OM400** — module Simple — disponible ; modules Double et Quadruple disponibles fin 2025.

Pour chaque produit : photo principale, fiche caractéristiques, fiche PDF téléchargeable, fichiers IES (photométrie) téléchargeables par optique.

Voir §7 pour le catalogue détaillé qui doit alimenter cette section.

### Étape 3 — Sélection du parc
Champ adresse civique avec **Google Places Autocomplete** (biais Québec). Carte dynamique vue satellite centrée à zoom 19. Coordonnées GPS sauvegardées.

### Étape 4 — Création du projet et des terrains sportifs

**Création du projet** : nom, municipalité (auto-rempli depuis l'adresse), nom du contact, courriel.

**Création d'un ou plusieurs terrains** (un à la fois). Pour chaque terrain :

- **Type d'activité** (liste fermée — voir §8) : Baseball, Soccer, Football, Tennis (1/2/3/4/6 courts), Basketball, Patinoire, Patinoire/Dek Hockey, Patinoire/Basketball, Pétanque, Piscine, Skate Parc, Badminton, Stationnement, Jeux d'enfants, Glissade hivernale, Éclairage de service, Autre (TBD).
- **Niveau / catégorie** → détermine la classe IES RP-6 :
  - Récréatif / amateur → **Classe IV**
  - Compétitif / élite → **Classe III**
  - Semi-pro → **Classe II**
  - Professionnel → **Classe I**
  - Service / aucun niveau → **NA**
- **Tracé du périmètre** (polygone Google Maps Drawing) → surface en m² calculée via `google.maps.geometry.spherical.computeArea`.
- **Cas particulier baseball** : tracer **deux périmètres** (intérieur *infield* et extérieur *outfield*), conformément à la slide 15 de la formation.
- **Capture d'écran de la vue globale** : bouton « Capturer la vue » → upload S3 → image de référence pour l'étape 5.

### Étape 5 — Création et positionnement des fûts

Pour chaque fût, panneau latéral avec :

- **Type de fût** : Bois, Acier, Béton, Aluminium, Installation murale, Autre.
- **Hauteur** (m) — typiquement 12 à 70 m d'après les données UMQ.
- **Type de montage** : Projecteur sur traverse / Projecteur fixé sur fût.
- **Nombre de traverses** par fût (0 à 4).
- **Nombre de luminaires existants** sur le fût.
- **Puissance unitaire** des luminaires existants (W).
- **Tension d'alimentation** : 120 V, 220 V, 347 V, 480 V (slide 9 formation + brochure 277-480V).

L'utilisateur **positionne chaque fût** sur la capture d'écran via drag-and-drop d'un marqueur numéroté. Tableau des fûts visible en parallèle pour édition rapide.

### Étape 6 — Génération du calcul

Bouton « Générer l'estimation » → moteur de calcul (§9) qui produit **deux scénarios** :

**Scénario A — Remplacement 1 pour 1**
- Quantité de Lightpro = quantité de luminaires existants.
- Modèle Lightpro proposé selon puissance existante (table de correspondance §9.4).

**Scénario B — Conformité IES RP-6-22**
- Calcul de la quantité de Lightpro nécessaire pour atteindre Eavg, ratio max/min et CV de la Table A-2 (selon classe et sport).
- Application du **LLF de 0.9** (slide 17 formation).
- Peut produire **plus ou moins** de luminaires que le scénario A.

**Arbre de décision Go/NoGo** (issu du XLSX UMQ) :
- Si nb_fûts_requis ≤ nb_fûts_existants → **GO** : on peut atteindre la norme avec les fûts en place.
- Si nb_fûts_requis > nb_fûts_existants → **NoGo** : nécessite l'ajout de fûts → bandeau « Étude détaillée requise », scénario A reste disponible comme repli.

### Étape 7 — Accessoires, configuration et contrôle (par terrain)

Pour chaque terrain, l'utilisateur paramètre :

**Module Lightpro** (cf. §7.1) : Simple / Double / Quadruple selon puissance requise.

**Puissance** : M200, M300, M400, M600, M800, M1200.

**Distribution optique** (§7.3) : 15° / 30° (par défaut) / 60° / 90°.

**Température de couleur** : 3000 K / 4000 K (par défaut) / 5700 K.

**CRI** : 70 (par défaut) / 80.

**Tension** : 480 V (par défaut), 277 V, 347 V, 120 V.

**Visière anti-éblouissement** (§7.4) : VN (aucune) / VSS (courte) / VLS (longue) — combinaisons selon module.

**Type de braquette** (§7.5) : BTU (en U), BTUE (en U tenon), BTR (bras), BTE (bras extension).

**Régulation et mesure** : suggérée par défaut (donne droit aux subventions HQ-OSE).

**Architecture de contrôle Smart Lighting** (§7.6) :
- Option 1 : Contrôle de base (tout-en-un).
- Option 2 : Smart Pole.
- Option 3 : Smart Powerbox.
- Option 4 : Smart Zone (Wi-Fi TCP/IP).

**Accessoires optionnels** : laser d'alignement, supports muraux, parafoudres, capteurs lumière/pluie.

**Subvention applicable** : case à cocher « Mon organisme est admissible au programme HQ-OSE 5.1 (institutionnel — tarif G, M, L, énergie mixte) » → applique l'abattement de §10.4.

### Étape 8 — Bilan et tableau de résultats

Tableau récapitulatif **par terrain** et **total projet** :
- Quantités par produit (avec code DLLP complet).
- Prix unitaire budgétaire.
- Sous-totaux et total HT.
- Comparaison Scénario A vs Scénario B avec écart en %.
- Heures d'ingénierie estimées (§10.3).
- Subvention appliquée (le cas échéant).

Visualisations :
- Graphique de répartition des coûts (luminaires / accessoires / ingénierie).
- Indicateur d'économies d'énergie estimées (kWh/an, comparaison ancien vs neuf).
- Réduction GES estimée (kg CO₂/an, à partir du facteur d'émission Hydro-Québec).
- Durée de vie : L70 > 100 000 heures (~25 ans à 4 000 h/an) vs ancienne installation HID typique 15 000 heures.

**Encart « Ce que ce bilan inclut / n'inclut pas »** (visible à l'écran et reproduit dans le PDF) :

| ✓ Inclus | ✗ Non inclus |
|---|---|
| Luminaires Lightpro OM (qté, modèle, puissance) | Coût d'installation (grue, électricien, raccordement) |
| Accessoires (visières, braquettes, laser) | Démontage de l'éclairage existant |
| Système de contrôle Smart Lighting | Travaux d'alimentation électrique au site |
| Heures d'ingénierie et supervision | Mise à niveau ou remplacement des fûts existants |
| Subvention HQ-OSE 5.1 (si applicable) | Études géotechniques, structurelles, environnementales |
| | Taxes (TPS / TVQ — affichées séparément) |

Boutons :
- **Télécharger le PDF** (rapport de bilan, mise en page Lightbase).
- **Enregistrer le projet** (déclenche étape 9 si non connecté).
- **Demander un devis officiel** (envoi de l'estimation à un commercial Lightbase via SES).
- **Recommencer**.

### Étape 9 — Création de compte pour enregistrement

Modale Cognito (Hosted UI ou intégrée) : email + mot de passe + nom + organisation. Consentement Loi 25 explicite. Vérification d'email obligatoire. Le projet est ensuite associé au compte et accessible depuis `/dashboard`.

Avant création de compte : projet conservé en `sessionStorage`, reconstitué après authentification.

### Étape 10 — Notice et avertissement légal

Bandeau **persistant et visible** sur la page de bilan, et reproduit en pied de chaque page du PDF :

> *Cette estimation est générée automatiquement à des fins budgétaires préliminaires et porte uniquement sur la fourniture des luminaires, accessoires, système de contrôle et heures d'ingénierie. **Les coûts d'installation (grue, électricien, raccordement, démontage de l'existant, etc.) ne sont pas inclus** et doivent être obtenus séparément auprès d'un installateur certifié. Les quantités, configurations, niveaux d'éclairement et prix peuvent varier suite à une visite technique, une étude photométrique détaillée (AGI32 ou équivalent), une vérification de la capacité portante des fûts existants (charge au vent — voir tableaux EPA), et une analyse des contraintes spécifiques du site. Lightbase ne peut être tenue responsable d'écarts entre cette estimation et l'offre commerciale finale.*

Version EN équivalente.

### Étape 11 — Cohérence visuelle avec lightbase.ca
Voir §3. Reprendre charte, palette, typographie, voix et assets photographiques de la brochure.

---

## 6. Modèle de données

```
Projet
 ├─ id, nom, municipalité, adresse, lat, lng, créé_le, propriétaire_id
 ├─ langue (fr|en), subvention_hq_ose (bool)
 └─ Terrains[]
     ├─ id, type_activité, classe_ies (I|II|III|IV|NA)
     ├─ surface_m2, périmètre_geojson, screenshot_s3_key
     ├─ (baseball) infield_geojson, outfield_geojson
     ├─ Fûts[]
     │   ├─ id, type (bois|acier|béton|alu|mural|autre)
     │   ├─ hauteur_m, montage (traverse|fût)
     │   ├─ nb_traverses, nb_luminaires, puissance_unitaire_w
     │   ├─ tension (120|220|347|480)
     │   └─ position_xy_normalisée
     ├─ Configuration_choisie
     │   ├─ module (simple|double|quadruple)
     │   ├─ puissance (M200|...|M1200)
     │   ├─ optique (15D|30D|60D|90D)
     │   ├─ cct (3000|4000|5700), cri (70|80)
     │   ├─ tension_alim
     │   ├─ visière (VN|VSS|VLS|combinaisons)
     │   ├─ braquette (BTU|BTUE|BTR|BTE)
     │   ├─ régulation_mesure (bool)
     │   ├─ architecture_contrôle (1|2|3|4)
     │   └─ accessoires[]
     └─ Résultats
         ├─ scénario_1x1 : { code_produit, quantité, puissance_totale_w, prix_total }
         ├─ scénario_iesrp6 : { code_produit, quantité, lux_moyen_calculé, uniformité, cv, prix_total }
         ├─ verdict_gogo (go|nogo)
         ├─ heures_ingénierie, heures_supervision
         └─ économies_kwh_an, réduction_ges_kg_an
```

---

## 7. Catalogue produits Lightpro OM

> Source : brochure LIGHTPRO-OM-BROCHURE_V3_FR.pdf (2025).

### 7.1 Modules

| Module | Poids | Plage de puissance | Plage lumineuse | Dimensions (L×l×P) | Disponibilité |
|---|---|---|---|---|---|
| **OM300 Simple** | ~30 lbs (13.6 kg) | 200/300 W | 32 500 – 51 100 lm | 385 × 305 × 292 mm | Disponible |
| **OM300 Double** | ~60 lbs (27.2 kg) | 400/600 W | 57 400 – 73 000 lm | 385 × 430 × 332 mm | Disponible |
| **OM300 Quadruple** | ~120 lbs (54.4 kg) | 800/1200 W | 91 700 – 128 700 lm | 710 × 430 × 335 mm | Disponible |
| **OM400 Simple** | ~30 lbs (13.6 kg) | 200/300/400 W | 32 000 – 47 700 lm | 467 × 239 × 349 mm | Disponible |
| **OM400 Double** | — | — | — | — | Fin 2025 |
| **OM400 Quadruple** | — | — | — | — | Fin 2025 |

### 7.2 Puissances disponibles (codes M)

| Code | Puissance | Module(s) compatible(s) |
|---|---|---|
| M200 | 200 W | Simple |
| M300 | 300 W | Simple |
| M400 | 400 W | Simple (OM400), Double (combiné 2× M200) |
| M600 | 600 W | Double (2× M300) |
| M800 | 800 W | Quadruple (4× M200) |
| M1200 | 1200 W | Quadruple (4× M300) |

### 7.3 Distributions optiques

| Code | Angle | Application typique |
|---|---|---|
| 15D | 15° | Longue portée, projecteurs hauts (60+ m), grandes surfaces |
| 30D | 30° | **Par défaut** — éclairage sportif standard, 30-50 m |
| 60D | 60° | Surfaces larges et basses, courts de tennis, patinoires |
| 90D | 90° | Éclairage d'aire de jeu rapprochée, stationnements |

Fichiers IES (photométrie) téléchargeables pour chaque combinaison module × optique × visière.

### 7.4 Visières anti-éblouissement

**Module Simple** :
- VN — Aucune visière
- VSS — Visière courte
- VLS — Visière longue

**Module Double / Quadruple** (combinaisons) :
- VN+VN, VSS+VSS, VSS+VN, VLS+VSS, VLS+VN

Les visières réduisent l'éblouissement et la pollution lumineuse (conformité ULOR — slide 6 formation).

### 7.5 Braquettes de montage

| Code | Type | Usage |
|---|---|---|
| **BTU** | Braquette en U | Montage horizontal sur traverse |
| **BTUE** | Braquette en U Tenon | Montage sur tenon de fût |
| **BTR** | Braquette Bras (à droite) | Installation à une main, ajustement précis |
| **BTE** | Braquette Bras (avec extension) | Installation déportée |

Inclinaison réglable de **-60° à +115°** sur tous les modèles.

### 7.6 Architectures de contrôle Smart Lighting

| Option | Nom | Principe | Coût télécom | Cas d'usage |
|---|---|---|---|---|
| **1** | Contrôle de base (tout-en-un) | Alimentation et contrôle intégrés au luminaire | Le plus bas | Éclairage éloigné, centralisation locale non optimale |
| **2** | Smart Pole | Lightnode centralisé par fût, alim individuelle par luminaire | Faible (1 com / fût) | Fûts à plusieurs luminaires ; le boîtier sert aussi de hub télécom pour autres capteurs |
| **3** | Smart Powerbox | Alimentations DC centralisées dans powerbox + lightnode | Faible | Comme Smart Pole mais blocs d'alim plus faciles à remplacer |
| **4** | Smart Zone | Chaque fût connecté à un hub télécom via Wi-Fi TCP/IP | Optimisé | Zones étendues avec plusieurs fûts, gestion centralisée |

Toutes les options supportent : programmation horaire, capteurs lumière/pluie, surveillance d'état, alertes temps réel, sécurité intégrée.

### 7.7 Caractéristiques communes

- **CCT** : 3000 K / 4000 K / 5700 K
- **CRI** : 70 ou 80
- **Tension** : 277-480 V (V480 par défaut), 120 V et 347 V disponibles
- **Efficacité** : jusqu'à 185 lm/W
- **Durée de vie** : L70 > 100 000 heures
- **IP66 / IK08**
- **Plage de température** : -40°C à +50°C
- **Garantie** : 10 ans
- **Certifications** : DLC Premium, CE, RoHS, ETL
- **Technologie propriétaire** : OptiSinkPad™ (dissipation thermique)

### 7.8 ChromaSync (option avancée)
Adaptation dynamique de l'intensité et de la température de couleur en fonction des caméras (broadcast, photo). À proposer en option pour les terrains semi-pro et pro.

### 7.9 Données EPA (Effective Projected Area)
Critique pour valider la charge au vent sur les fûts existants. À consulter dans le PDF de bilan pour informer l'utilisateur quand le scénario B implique des modules plus lourds que l'existant.

Tableaux EPA fournis pour chaque combinaison module × visière × orientation (front/back/side/top) à 90° et vent de 150 mph (cf. brochure pages 28-29). À versionner en JSON dans le moteur de calcul.

### 7.10 Codification produit
Format complet : `DLLP-OM{300|400}-G2-VU-{xx}-{cct}-{optique}-{puissance}-{cri}-{xx}-{visière}-{braquette}-{xx}-{xx}`

Exemple : `DLLP-OM300-G2-VU-XX-40-30D-M400-70-XX-VLS-BTR-XX-XX` = Lightpro OM300, génération 2, 4000 K, 30°, 400 W, CRI 70, visière longue, braquette bras.

L'outil génère ce code automatiquement pour chaque ligne du bilan.

---

## 8. Référentiel des sports et classes IES RP-6-22

> Source : Table A-2 de la norme + valeurs cibles observées dans la soumission UMQ. À versionner en JSON.

### 8.1 Cibles par sport et par classe (lux moyens — Eavg)

| Sport | Classe I (Pro) | Classe II (Semi-pro) | Classe III (Compétitif) | Classe IV (Amateur) |
|---|---|---|---|---|
| **Baseball — infield** | — | 1000 | 500 | 300 |
| **Baseball — outfield** | — | 750 | 300 | 200 |
| **Soccer** | — | — | 300 | 200 |
| **Football** | — | — | 300 | 200 |
| **Tennis** | — | 750 | — | 300 |
| **Basketball** | — | — | — | 200 |
| **Patinoire** | — | — | 300 | 200 |
| **Patinoire / Dek Hockey** | — | — | 300 | 200 |
| **Patinoire / Basketball** | — | — | 300 | 200 |
| **Piscine** | — | — | — | 200 (eau) / 100 (deck) |
| **Badminton** | — | — | — | 300 |
| **Pétanque** | — | — | — | 50 |
| **Skate parc** | — | — | — | NA (gabarit) |
| **Stationnement** | — | — | — | NA (gabarit) |
| **Jeux d'enfants** | — | — | — | NA (gabarit) |
| **Glissade hivernale** | — | — | — | NA (gabarit) |
| **Éclairage de service** | — | — | — | NA (gabarit) |
| **Autre (TBD)** | — | — | — | NA |

Pour les sports « NA », appliquer un gabarit forfaitaire (lux par m² × surface) plutôt que la norme RP-6.

### 8.2 Ratios et coefficients (exemples Table A-2)

Pour Tennis Classe IV (slide 19) :
- Eavg : 300 lux
- Ratio max/min : 2.5
- Coefficient de variation : 0.21

`[À CONFIRMER : fournir Table A-2 complète pour toutes les combinaisons sport × classe — valeurs Eavg, max/min, CV. À défaut, reprendre les valeurs UMQ comme baseline.]`

### 8.3 Grilles de calcul (slide 14 formation)

| Sport | Espacement (m) | Hauteur de calcul (m) | Particularité |
|---|---|---|---|
| Baseball | 9.1 | 0.91 | **2 grilles** (infield + outfield) |
| Football | 9.1 | 0.91 | — |
| Soccer | 9.1 | 0.91 | — |
| Tennis | 6.1 | 0.91 | — |
| Basketball | 4.6 | 0.91 | — |
| Hockey / Patinoire | 4.3 | 0 | Mesure au sol (glace) |

Les points de calcul doivent former un quadrillage parallèle au terrain (slide 16).

---

## 9. Moteur de calcul photométrique

### 9.1 Hypothèses globales
- **Light Loss Factor (LLF)** : 0.9 (slide 17 formation).
- **Photométrie de référence** : fichiers IES fournis par Lightbase pour chaque variante.
- **Modèle de calcul** : approximation point-par-point sur la grille définie en §8.3, avec sommation des contributions de chaque luminaire (méthode du flux ponctuel — `E = I(θ) × cos³(θ) / h²`).
- **Précision attendue** : ±15% par rapport à AGI32 (l'outil est budgétaire, pas une étude détaillée). Un avertissement le rappelle.

### 9.2 Algorithme — Scénario A (Remplacement 1 pour 1)

```
pour chaque fût:
  pour chaque luminaire existant:
    quantité_lightpro += 1
    code_produit = correspondance(puissance_existante)  // table 9.4
    puissance_totale_w += puissance_lightpro
```

### 9.3 Algorithme — Scénario B (Conformité IES RP-6-22)

```
définir grille de calcul selon sport (§8.3)
récupérer cible Eavg, ratio max/min, CV (§8.1, Table A-2)
choisir modèle Lightpro de départ (par défaut: OM300 M300 30D)
calculer Eavg_initial avec n_existant × LLF × IES_distribution
boucle:
  si Eavg_calculé < Eavg_cible OR ratio > cible OR CV > cible:
    ajouter 1 luminaire (par fût existant en priorité)
    recalculer
  si tous_critères_satisfaits:
    valider
  si nb_luminaires_par_fût > capacité_fût (selon nb_traverses):
    flag "fûts supplémentaires requis" → verdict NoGo
    arrêter

retourner: { quantité, modèle, Eavg_final, ratio_final, cv_final, verdict_gogo }
```

### 9.4 Table de correspondance puissance existante → Lightpro

| Puissance existante (HID/HPS) | Lightpro recommandé (1 pour 1) |
|---|---|
| ≤ 250 W | OM300 Simple M200 |
| 251 – 400 W | OM300 Simple M300 |
| 401 – 700 W | OM300 Double M400 (2× M200) |
| 701 – 1000 W | OM300 Double M600 (2× M300) |
| 1001 – 1500 W | OM300 Quadruple M800 (4× M200) |
| > 1500 W | OM300 Quadruple M1200 (4× M300) |

`[À CONFIRMER : table de correspondance à valider par l'équipe ingénierie Lightbase — l'objectif est de maintenir au minimum l'éclairement initial.]`

### 9.5 Validation EPA (charge au vent)

Si le scénario choisi implique des modules plus lourds ou plus volumineux que l'existant, l'outil affiche un avertissement :

> *La nouvelle configuration augmente la surface exposée au vent (EPA) de X%. Une vérification de la capacité portante de chaque fût existant est requise avant installation. Voir tableau EPA dans le PDF de bilan.*

Le PDF inclut le tableau EPA pertinent (cf. brochure pages 28-29).

### 9.6 Calcul d'économies d'énergie

```
puissance_ancienne_totale = somme(puissance_existante × nb_luminaires)
puissance_nouvelle_totale = somme(puissance_lightpro × nb_lightpro)
heures_usage_an = 1500  // moyenne terrain sportif amateur
                        // [À CONFIRMER : valeur par défaut paramétrable par sport]

économies_kwh_an = (puissance_ancienne - puissance_nouvelle) × heures_usage_an / 1000
économies_$_an = économies_kwh_an × tarif_hq  // ~0.075 $/kWh tarif M
réduction_ges_kg_an = économies_kwh_an × 0.0015  // facteur HQ ~1.5 g CO2/kWh
```

---

## 10. Modèle de prix budgétaire

> Source : soumission UMQ Parcs DeLight 2023. À versionner et paramétrer en admin.

### 10.1 Prix unitaires luminaires (avant subvention, baseline 2023)

| Variante | Prix unitaire CAD |
|---|---|
| DLP-OM300-V480-GV-40-30D-M300 (sans régulation) | 269.40 $ |
| DLP-OM300-V480-GV-40-30D-M300 (avec régulation et mesure) | 404.16 $ |
| DLP-OM300-V480-GV-40-30D-M600 (sans régulation) | 525.24 $ |
| DLP-OM300-V480-GV-40-30D-M600 (avec régulation et mesure) | 787.92 $ |

`[À CONFIRMER : grille tarifaire 2026 pour OM300 M200/M400/M800/M1200, OM400, et accessoires (visières, braquettes spéciales, laser).]`

### 10.2 Coût d'installation — **EXCLU DU PÉRIMÈTRE DE L'OUTIL**

L'installation (grue, électricien, raccordement, démontage de l'existant, gestion de chantier, transport) **n'est pas estimée par l'outil**. Ces coûts varient trop en fonction du site (accès, hauteur des fûts, alimentation existante, distance au réseau, conditions hivernales) pour être budgétés de façon crédible sans visite terrain.

L'outil affiche systématiquement, à proximité de chaque total :

> *Ce montant n'inclut pas les coûts d'installation, qui devront être obtenus séparément auprès d'un installateur certifié. Lightbase peut référer des installateurs partenaires sur demande.*

Cette mention apparaît également dans le PDF de bilan et dans la notice légale (étape 10).

### 10.3 Heures d'ingénierie (formules UMQ)

Pour chaque terrain :
- `Conception (h) = Quantité_luminaires / 10`
- `Pose (h) = Quantité_luminaires × 0.25`
- `Ajustement (h) = Quantité_luminaires × 0.25`
- `Rapport (h) = Quantité_luminaires / 10`
- `Sous-total expertise = somme des quatre`
- `Supervision = 10% × sous-total expertise`
- `Total heures = sous-total + supervision`

Taux horaires :
- Concepteur (CPE) : **95 $/h**
- Ingénieur (ING) : **125 $/h**

### 10.4 Subvention HQ-OSE 5.1

Si l'utilisateur coche « Admissible HQ-OSE 5.1 (institutionnel — tarif G, M, L, énergie mixte) » :
- Abattement de **~67%** sur le coût des luminaires (calcul UMQ : 64 665 $ subvention sur 96 000 $ → 31 334 $ après subvention).
- Affichage transparent : prix avant subvention, montant subvention, prix après subvention.

`[À CONFIRMER : règle exacte de calcul de la subvention HQ-OSE 5.1 — pourcentage fixe ou plafond ? Et programmes additionnels (FÉR, écoPerformance) à mentionner ?]`

### 10.5 Total budgétaire

```
total_luminaires   = somme(qté × prix_unitaire) − subvention_HQ_OSE
total_accessoires  = somme(visières, braquettes spéciales, contrôle, laser)
total_ingénierie   = (heures_CPE × 95 $) + (heures_ING × 125 $)

TOTAL_PROJET_HT    = total_luminaires + total_accessoires + total_ingénierie
                     (HORS installation — voir §10.2)
```

Taxes (TPS 5%, TVQ 9.975%) affichées séparément, désactivables si organisme exempté.

L'écran de bilan (§5 étape 8) doit afficher la mention « **hors installation** » à côté de chaque total et sous-total.

---

## 11. Composants UI requis

- **Wizard / stepper** avec progression visuelle (étapes 3 → 8).
- **Composant carte interactive** : recherche d'adresse, vue satellite, outils de tracé polygone, calcul d'aire en direct.
- **Éditeur de positionnement de fûts** sur image (drag & drop sur screenshot).
- **Tableau de fûts** éditable.
- **Tableau de bilan** avec tri, filtre, export.
- **Sélecteur de configuration produit** (modules, puissances, optiques, visières, braquettes, contrôle) avec aperçus visuels issus de la brochure.
- **Modale d'authentification** Cognito.
- **Bandeau de notice légale** persistant.
- **Sélecteur de langue** FR/EN persistant.
- **Tableau de bord utilisateur** : liste des projets enregistrés, dates, statuts.
- **États** : chargement, erreur, vide, succès, en cours d'enregistrement.

---

## 12. Architecture AWS — vue d'ensemble

```
                    ┌─────────────────────────┐
   Utilisateur ───▶ │ CloudFront (CDN, HTTPS) │
                    └──────────┬──────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  S3 (frontend SPA)  │
                    └─────────────────────┘
                               │
                               │ appels API
                    ┌──────────▼──────────┐         ┌─────────────────┐
                    │   API Gateway       │◀────────│ Cognito User    │
                    │   (Cognito Auth)    │         │ Pool (ca-central-1)│
                    └──────────┬──────────┘         └─────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
        ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
        │ Lambda    │    │ Lambda    │    │ Lambda    │
        │ /projects │    │ /calculate│    │ /quote    │
        └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
         ┌──────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
         │ Aurora      │ │ S3        │ │ SES         │
         │ Serverless  │ │ (images,  │ │ (emails     │
         │ PostgreSQL  │ │  PDF)     │ │  devis)     │
         └─────────────┘ └───────────┘ └─────────────┘
```

Toutes les ressources en **ca-central-1** pour la conformité Loi 25.

---

## 13. Critères d'acceptation

L'outil est conforme si :

1. Un utilisateur peut compléter les 11 étapes sans assistance externe en moins de 15 minutes.
2. Le tracé du périmètre produit une **surface en m² cohérente** (vérifiée sur 3 cas de référence — terrain de baseball, soccer, tennis).
3. Les deux scénarios de calcul (1x1 et IES RP-6) produisent des résultats **différents et explicables**, avec note méthodologique consultable.
4. Le verdict Go/NoGo s'affiche correctement dans les cas où la norme exige plus de fûts.
5. Le bilan PDF est **téléchargeable et imprimable** avec mise en page Lightbase (cf. page 22 brochure).
6. La création de compte Cognito fonctionne et le projet est **persisté et récupérable** après reconnexion.
7. La notice légale est visible à l'écran et présente dans le PDF, en français et en anglais.
8. L'interface est **bilingue FR/EN** avec bascule sans perte de l'état du projet.
9. Le rendu visuel est aligné sur la charte Lightbase (cf. §3).
10. Conformité Loi 25 : routes d'export et de suppression de données fonctionnelles.
11. Aucun blocage en cas d'absence de connexion à Google Maps (message d'erreur clair).
12. Performance : génération du calcul en moins de 5 secondes pour un projet de 10 terrains.

---

## 14. Hors-périmètre (v1)

- **Coûts d'installation** (grue, électricien, raccordement, démontage existant) — voir §10.2.
- Étude photométrique détaillée point-par-point au sol (rester budgétaire).
- Génération de plans CAO ou DIALux/AGI32.
- Paiement en ligne ou conversion en commande ferme.
- Application mobile native.
- Multi-utilisateurs sur un même projet (collaboration temps réel).
- Intégration CRM / ERP Lightbase.
- Module ChromaSync configurable (mention seulement, pas de simulation).
- Calcul détaillé de pollution lumineuse / ULOR (mention de la norme).
- Mise à niveau ou remplacement des fûts existants.

---

## 15. Livrables attendus

1. Code source complet (frontend + backend + IaC), versionné et documenté (GitHub).
2. README avec : prérequis, installation locale, configuration des clés API, déploiement AWS.
3. **Jeu de données de test** : 3 projets fictifs complets (baseball amateur, soccer compétitif, tennis 4 courts).
4. Documentation utilisateur intégrée (aide contextuelle FR/EN, ~2 pages chacune).
5. Documentation admin : comment mettre à jour catalogue produit, prix, abaques IES.
6. Démonstration déployée sur `staging.estimateur.lightbase.ca` pour validation interne.
7. Plan de tests (unitaires sur le moteur de calcul, e2e sur le parcours principal).
8. Documentation Loi 25 (registre, processus de réponse aux demandes d'accès).

---

## 16. Checklist de kick-off — assignation

| # | Élément à fournir | Statut | Responsable / Source |
|---|---|---|---|
| 1 | **Table A-2 IES RP-6-22 complète** : Eavg, ratio max/min, CV pour toutes combinaisons sport × classe | À fournir | **Philippe** |
| 2 | **Grille tarifaire 2026** : OM300 toutes puissances, OM400, accessoires (visières, braquettes, laser), options Smart 1-4 | À fournir | **Maya** |
| 3 | **Table de correspondance puissance existante → Lightpro** (§9.4) | À transcrire | **Fiches techniques produit** |
| 4 | **Modèle de coût d'installation** | ✅ **Résolu** | **Exclu du périmètre de l'outil** (§10.2, §14) |
| 5 | **Subvention HQ-OSE 5.1** : règle de calcul exacte | À valider | Site **DLC** (DesignLights Consortium) |
| 6 | **Heures d'usage annuelles** par sport pour calcul d'économies | ✅ **Résolu** | Défaut : **1 500 h/an** (paramétrable en admin si besoin futur) |
| 7 | **Contenu section « Documentation des solutions »** (étape 2) | À récupérer | **OneDrive Marketing** |
| 8 | **Fichiers IES** (photométrie) par combinaison module × optique × visière | À fournir | **Philippe** |
| 9 | **Prix unitaires des configurations Smart Lighting** (options 1-4) | À fournir | **Philippe** *(à confirmer si Maya plutôt)* |

### Recommandation de séquencement

Le développement peut démarrer **en parallèle** de la collecte des éléments 1, 2, 3, 5, 7, 8, 9. Plan suggéré :

**Sprint 0–1 (squelette, ne dépend de rien) :**
- Setup AWS (CDK, Cognito, S3, CloudFront, API Gateway, Aurora, SES)
- Squelette React + i18n FR/EN + charte visuelle Lightbase
- Étapes 1, 2 (placeholders), 3 (carte + adresse), 9 (création de compte), 10 (notices)

**Sprint 2 (parcours principal sans calcul réel) :**
- Étapes 4 (terrains + tracé), 5 (fûts + placement), 7 (configuration produit avec catalogue §7)
- Étape 8 avec totaux factices

**Sprint 3 (moteur de calcul) — bloqué tant que 1, 3, 8 ne sont pas livrés :**
- Implémentation du moteur §9 avec les abaques réels
- Branchement sur la grille tarifaire réelle (2)
- Génération du PDF de bilan

**Sprint 4 (finition et conformité) :**
- Subvention HQ-OSE 5.1 (5)
- Documentation Loi 25
- Tests d'acceptation, démo staging

---

*Fin du prompt v4. Prêt pour kick-off développement dès que Philippe et Maya livrent leurs éléments respectifs.*
