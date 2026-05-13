# Rapport — Base des calculs du moteur d'estimation

**Date** : 2026-05-08
**Fichiers concernés** : `lib/estimation/calculate.ts`, `lib/estimation/catalog.ts`

---

## Résumé exécutif

Le moteur implémente uniquement le **scénario A — remplacement 1 pour 1** du prompt v4 §9.2. Le scénario B (conformité IES RP-6-22) retourne `null` en attendant la Table A-2 complète de Philippe.

Les formules d'ingénierie et 2 prix de référence viennent de la soumission UMQ 2023. Le reste (prix M200/M400/M800/M1200, accessoires, contrôles) est **extrapolé** ou **inventé** comme placeholder.

---

## 1. Quantité de luminaires (§9.2)

```
qty = somme(nbExistingFixtures pour chaque fût)
```

Remplacement strict 1-pour-1. Surface m² et classe IES **ignorées** dans le scénario A.

---

## 2. Choix produit automatique (§9.4) — `matchProduct()`

| Puissance existante | Produit recommandé |
|---|---|
| ≤ 250 W | OM300 Simple M200 |
| 251–400 W | OM300 Simple M300 |
| 401–700 W | OM300 Double M400 |
| 701–1000 W | OM300 Double M600 |
| 1001–1500 W | OM300 Quadruple M800 |
| > 1500 W | OM300 Quadruple M1200 |

> ⚠️ **[À CONFIRMER]** dans le prompt v4. À valider par l'équipe ingénierie Lightbase.

---

## 3. Prix unitaires luminaires — `unitPriceCad()`

### Sources réelles (UMQ 2023, §10.1)

| Code | Sans régulation | Avec régulation |
|---|---|---|
| **M300** | 269.40 $ | 404.16 $ |
| **M600** | 525.24 $ | 787.92 $ |

### Extrapolations (inventées par moi à partir des 2 lignes ci-dessus)

| Code | Prix base estimé |
|---|---|
| M200 | 215.00 $ |
| M400 | 410.00 $ |
| M800 | 720.00 $ |
| M1200 | 980.00 $ |

### Hypothèses

- **Régulation et mesure** : multiplicateur **×1.5** (= 404.16 / 269.40, observé sur UMQ)
- **Coefficient module** : ×1 partout (Simple/Double/Quadruple). Probablement faux — un Double devrait coûter plus qu'un Simple.

> 🔴 **À remplacer** dès réception de la grille tarifaire 2026 complète (Maya, item #2 du kick-off §16).

---

## 4. Accessoires (placeholders inventés)

### Visières — `visorCost()`

| Code | Coût par luminaire |
|---|---|
| VN, VN_VN | 0 $ |
| VSS, VSS_VN, VSS_VSS | 38 $ |
| VLS, VLS_VSS, VLS_VN | 62 $ |

### Braquettes — `bracketCost()`

| Code | Coût par luminaire |
|---|---|
| BTU | 0 $ |
| BTUE | 22 $ |
| BTR | 65 $ |
| BTE | 95 $ |

### Contrôle Smart Lighting — `controlCostPerPole()` (×nb de fûts)

| Architecture | Coût par fût |
|---|---|
| BASE (tout-en-un) | 0 $ |
| SMART_POLE | 240 $ |
| SMART_POWERBOX | 320 $ |
| SMART_ZONE (Wi-Fi) | 480 $ |

> 🔴 **Inventé**. À remplacer par la grille Lightbase.

---

## 5. Heures d'ingénierie (§10.3 — formules UMQ exactes)

```
conception     = qty / 10
pose           = qty × 0.25
ajustement     = qty × 0.25
rapport        = qty / 10
expertise      = somme des 4
supervision    = expertise × 10 %
total          = expertise + supervision
```

### Taux horaires (§10.3)

| Rôle | Taux |
|---|---|
| Concepteur (CPE) | **95 $/h** |
| Ingénieur (ING) | **125 $/h** |

### Mix appliqué

- 50 % expertise → CPE
- 50 % expertise → ING
- 100 % supervision → ING

> 🟢 **Fiable** — formules et taux directement issus de la soumission UMQ 2023.

---

## 6. Subvention HQ-OSE 5.1 (§10.4)

Si coché par l'utilisateur :

```
abattement = total_luminaires × 67 %
```

Appliqué uniquement aux **luminaires** (pas aux accessoires, pas à l'ingénierie).

Valeur 67 % déduite de l'exemple UMQ : 64 665 $ / 96 000 $.

> 🟡 **À confirmer** : règle exacte (pourcentage fixe ou plafond ?). Item #5 du kick-off §16.

---

## 7. Économies d'énergie + réduction GES (§9.6)

### Constantes

| Paramètre | Valeur | Source |
|---|---|---|
| Heures d'usage annuel | **1 500 h/an** | Prompt v4 §9.6 (résolu) |
| Tarif Hydro-Québec (M) | **0.075 $/kWh** | Prompt v4 §9.6 |
| Facteur GES | **1.5 g CO₂/kWh** | Prompt v4 §9.6 |

### Formule

```
ancienne_W      = somme(existingPowerW × nbFixtures par fût)
nouvelle_W      = puissance_M_choisie × qty_totale
économies_kWh   = max(0, (ancienne_W − nouvelle_W) × 1500 / 1000)
réduction_GES   = économies_kWh × 1.5 g/kWh
```

> 🟢 **Fiable** pour un calcul d'ordre de grandeur budgétaire. Pas de variation par sport (heures d'usage uniformes).

---

## 8. Verdict Go / NoGo

### Heuristique implémentée (inventée par moi)

```
capacité = somme(max(1, nbCrossarms × 4) pour chaque fût)
verdict  = qty ≤ capacité ? GO : NoGo
```

Hypothèse : **4 luminaires max par traverse**, ou 1 si pas de traverse.

> 🔴 **Inventé**. Pas dans le prompt v4 explicitement. Remplacer par la vraie règle Lightbase si elle existe.

---

## 9. Total budgétaire (§10.5)

```
total_luminaires    = somme(qty × prix_unitaire) − subvention_HQ_OSE
total_accessoires   = somme(visières + braquettes) + (contrôle × nb_fûts)
total_ingénierie    = (heures_CPE × 95) + (heures_ING × 125)

TOTAL_PROJET_HT     = total_luminaires + total_accessoires + total_ingénierie
                      (HORS installation)
```

**Taxes TPS/TVQ** : non calculées séparément actuellement (à ajouter).

---

## Tableau de robustesse

| Catégorie | Source | Statut |
|---|---|---|
| Formules ingénierie + taux CPE/ING | UMQ 2023 réel | 🟢 Fiable |
| Constantes énergie (1500 h, 0.075 $/kWh, 1.5 g) | Prompt v4 résolu | 🟢 Fiable |
| LLF 0.9 (non utilisé scénario A) | Prompt v4 | 🟢 Fiable |
| Prix M300 + M600 | UMQ 2023 réel | 🟢 Fiable |
| Multiplicateur régulation ×1.5 | UMQ 2023 (déduit) | 🟢 Fiable |
| Mapping §9.4 puissance existante → Lightpro | Prompt v4 [À CONFIRMER] | 🟠 À valider |
| Subvention HQ-OSE 67 % | UMQ exemple | 🟠 À valider |
| Prix M200, M400, M800, M1200 | Mon extrapolation | 🔴 Placeholder |
| Coefficient module Double/Quadruple | Mon hypothèse | 🔴 Placeholder |
| Coûts visières / braquettes / contrôles | Mes inventions | 🔴 Placeholder |
| Verdict Go/NoGo (capacité fûts) | Mon heuristique | 🔴 Placeholder |
| Scénario B IES RP-6-22 | **Non implémenté** | ⛔ Bloqué |

---

## Ce qui manque pour passer en production

1. **Grille tarifaire 2026 Lightbase** (Maya, kick-off §16 #2) — remplace tous les 🔴 Placeholder ligne par ligne
2. **Table A-2 IES RP-6-22 complète** (Philippe, #1) — débloque le scénario B
3. **Validation table de correspondance §9.4** (#3) — confirme les bons mappings 1-pour-1
4. **Règle exacte HQ-OSE 5.1** (#5) — confirme le 67 % ou ajuste
5. **Fichiers IES par variante** (#8) — nécessaires pour le scénario B
6. **Prix Smart Lighting options 1-4** (#9) — remplace les contrôles inventés
7. Calcul TPS/TVQ séparément
8. Validation EPA (charge au vent) — flag d'avertissement quand modules plus lourds

---

## Fichiers à modifier quand les données réelles arriveront

| Fonction | Fichier | Ligne approximative |
|---|---|---|
| `matchProduct()` | `lib/estimation/catalog.ts` | 14-22 |
| `unitPriceCad()` | `lib/estimation/catalog.ts` | 28-44 |
| `visorCost()` | `lib/estimation/catalog.ts` | 75-79 |
| `bracketCost()` | `lib/estimation/catalog.ts` | 84-94 |
| `controlCostPerPole()` | `lib/estimation/catalog.ts` | 60-71 |
| `HQ_OSE_RATE` | `lib/estimation/catalog.ts` | 53 |
| Verdict Go/NoGo | `lib/estimation/calculate.ts` | ~95-99 |
| Implémentation scénario B | `lib/estimation/calculate.ts` | (à créer) |
