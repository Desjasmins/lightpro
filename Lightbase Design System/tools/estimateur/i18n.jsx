// i18n.jsx — FR/EN strings for restructured Estimateur Lightpro OM (7 steps)
window.I18N = {
  fr: {
    appName: "ESTIMATEUR LIGHTPRO OM",
    user: "Mathieu Bélanger",
    save: "Enregistrer",
    saved: "Enregistré",
    next: "Suivant",
    back: "Retour",
    add: "Ajouter",
    remove: "Supprimer",
    duplicate: "Dupliquer",
    cancel: "Annuler",
    confirm: "Confirmer",
    autosave: "Sauvegarde auto",
    lastSaved: "Dernière sauvegarde",

    steps: [
      "Identification",
      "Parcs et terrains",
      "Tracé et fûts",
      "Configuration produit",
      "Bilan financier",
      "Subventions HQ-OSE",
      "Document final"
    ],

    s1: {
      title: "Identification du dossier",
      sub: "Coordonnées de la municipalité et du responsable du projet. Ces informations apparaîtront dans la fiche projet finale.",
      muniSection: "Municipalité",
      muniName: "Nom de la municipalité",
      regAdmin: "Région administrative",
      population: "Population",
      contactSection: "Responsable du dossier",
      fullName: "Nom complet",
      role: "Titre",
      email: "Courriel",
      phone: "Téléphone",
      ref: "Référence interne"
    },

    s2: {
      title: "Parcs et terrains sportifs",
      sub: "Ajoutez les parcs visés par le projet, puis les terrains à éclairer pour chacun. Le choix de la catégorie applique automatiquement la norme d'éclairement et la portée des travaux.",
      addPark: "Ajouter un parc",
      addField: "Ajouter un terrain",
      parkName: "Nom du parc",
      parkAddress: "Adresse",
      fieldsCount: "terrains",
      fieldName: "Désignation du terrain",
      sport: "Discipline",
      category: "Catégorie de jeu",
      categoryHint: "Sélectionnez la catégorie pour appliquer automatiquement la norme et la portée",
      scope: "Portée des travaux",
      specs: "Spécifications appliquées",
      lux: "Éclairement moyen",
      uniformity: "Uniformité (Uo)",
      glare: "Éblouissement (TI max)",
      hours: "Heures/an",
      cols: { name: "Terrain", sport: "Discipline", category: "Catégorie", scope: "Portée", specs: "Spécifications", actions: "" },
      noParks: "Aucun parc ajouté. Cliquez « Ajouter un parc » pour commencer.",
      noFields: "Aucun terrain pour ce parc."
    },

    s3: {
      title: "Tracé et implantation des fûts",
      sub: "Pour chaque parc, tracez le contour des terrains, placez les fûts et identifiez l'environnement par direction (présence de résidences ou rues à protéger).",
      selectPark: "Parc",
      selectField: "Terrain",
      tools: { draw: "Tracer terrain", pole: "Placer fût", measure: "Point de mesure", protect: "Direction sensible", delete: "Supprimer" },
      legend: "Cliquez pour ajouter — double-cliquez pour fermer un tracé",
      poleCount: "Fûts",
      measureCount: "Points de mesure",
      protections: "Protections requises",
      directions: { N: "Nord", E: "Est", S: "Sud", W: "Ouest" },
      direction: "Direction",
      contextLabel: "Environnement",
      ctxOpen: "Dégagé",
      ctxStreet: "Rue / circulation",
      ctxHousing: "Résidences",
      mitigation: "Mitigation requise",
      mitVisor: "Visière",
      mitNarrow: "Optique étroite",
      mitBoth: "Visière + optique étroite",
      tableTitle: "Synthèse de l'implantation",
      cols: { id: "ID", type: "Type", x: "X (m)", y: "Y (m)", height: "Hauteur (m)", projectors: "Projecteurs", note: "Notes" },
      summary: "Sommaire",
      totalPoles: "Fûts au total",
      totalProjectors: "Projecteurs requis",
      totalMeasures: "Points de mesure",
      totalProtections: "Directions à mitiger"
    },

    s4: {
      title: "Configuration du produit Lightpro OM",
      sub: "Sélectionnez les options. Le bilan financier et la subvention HQ-OSE se mettent à jour en temps réel.",
      family: "Famille",
      module: "Module / puissance",
      optic: "Optique",
      cct: "Température (CCT)",
      visor: "Visière",
      bracket: "Braquette",
      control: "Contrôle / pilotage",
      surge: "Protection surtension",
      finish: "Finition",
      preview: "Aperçu produit",
      unitPrice: "Prix unitaire",
      qty: "Quantité totale",
      subtotal: "Sous-total équipement",
      includes: "Inclus de série",
      includesItems: [
        "Optisinkpad™ — dissipateur thermique modulaire",
        "Garantie 10 ans",
        "Certifié DLC, RoHS, IP66, IK10",
        "Plage température −40°C à +50°C",
        "Driver Tridonic / Inventronics au choix"
      ],
      controlsImpactTitle: "Impact subvention",
      controlsImpactOn: "Avec contrôles : +9 $/luminaire admissible",
      controlsImpactOff: "Sans contrôles : 20 $/luminaire admissible"
    },

    s5: {
      title: "Bilan financier",
      sub: "Comparaison entre la solution actuelle (HID/halogénures) et la conversion DEL Lightpro OM. Les économies tiennent compte du programme HQ-OSE.",
      scenarioA: "Scénario A — Statu quo HID",
      scenarioB: "Scénario B — Lightpro OM",
      scenarioBTag: "Recommandé",
      perYear: "/ an",
      payback: "Période de récupération",
      co2: "Réduction CO₂",
      annualSaving: "Économie annuelle",
      cumulSaving: "Économie cumulée 10 ans",
      breakdown: "Détail des coûts",
      equipment: "Équipement (Lightpro OM)",
      install: "Installation et raccordement",
      engineering: "Étude photométrique IES",
      contingency: "Contingence (10 %)",
      subtotal: "Sous-total avant subvention",
      grant: "Subvention HQ-OSE",
      net: "Coût net municipalité",
      includedTitle: "Inclus dans la soumission",
      excludedTitle: "Exclus / à la charge du client",
      included: [
        "Étude photométrique IESNA RP-6",
        "Calcul d'éblouissement (TI) et d'uniformité (Uo)",
        "Plan d'implantation à l'échelle",
        "Liste de matériel détaillée",
        "Garantie 10 ans intégrale",
        "Mise en service et formation"
      ],
      excluded: [
        "Excavation et fondations en béton",
        "Travaux d'électricité haute tension",
        "Mise à jour du panneau de distribution",
        "Frais d'arpentage géodésique",
        "Permis municipaux et taxes",
        "Disposition de l'équipement existant"
      ]
    },

    s6: {
      title: "Subvention HQ-OSE",
      sub: "Programme « Solutions efficaces » d'Hydro-Québec. Le calcul ci-dessous applique le barème Lightpro pour les projecteurs sportifs DEL.",
      formulaTitle: "Barème applicable — projecteurs Lightpro",
      base: "Luminaire Lightpro DEL",
      baseRate: "20 $ / luminaire",
      baseNote: "Toute puissance — barème forfaitaire",
      withCtrl: "Régulation et contrôle",
      withCtrlRate: "+ 9 $ / luminaire",
      withCtrlNote: "Si système de contrôle pilotable installé (DALI 2, Lumio Air, GNSS)",
      eligibility: "Admissibilité",
      eligibilityItems: [
        "Bâtiment ou installation au Québec alimenté par Hydro-Québec",
        "Remplacement d'un système d'éclairage au halogénure ou HID existant",
        "Produits inscrits à la liste Lightpro DEL admissible",
        "Demande déposée avant le début des travaux"
      ],
      calcTitle: "Calcul pour ce projet",
      lineProj: "Luminaires Lightpro",
      lineCtrl: "Bonification contrôles",
      lineTotal: "Subvention totale estimée",
      noCtrlNotice: "Aucun contrôle DALI/Lumio sélectionné dans la configuration. Activez un contrôle à l'étape 4 pour bénéficier de la bonification de 9 $/u."
    },

    s7: {
      title: "Document final",
      sub: "Inscrivez le courriel et le téléphone du client. Le rapport complet (fiche projet, plans d'implantation, bilan énergétique, demande HQ-OSE pré-remplie) sera transmis dès l'envoi.",
      formTitle: "Coordonnées du destinataire",
      clientName: "Nom du destinataire",
      clientEmail: "Courriel",
      clientPhone: "Téléphone",
      ccLightbase: "Envoyer une copie à Lightbase",
      consent: "J'accepte que Lightbase utilise ces coordonnées pour le suivi du dossier",
      reportTitle: "Contenu du rapport envoyé",
      reportItems: [
        "Fiche projet — synthèse municipale (1 page)",
        "Plan d'implantation à l'échelle (PDF)",
        "Étude photométrique IESNA RP-6 (PDF)",
        "Bilan financier sur 25 ans avec subvention HQ-OSE",
        "Demande HQ-OSE pré-remplie",
        "Liste de matériel et certificats DLC/IES"
      ],
      send: "Envoyer le rapport",
      sentTitle: "Rapport envoyé",
      sentSub: "Le destinataire recevra l'ensemble des documents à son courriel d'ici 2 minutes. Une copie est également envoyée à votre adresse."
    }
  },

  en: {
    appName: "LIGHTPRO OM ESTIMATOR",
    user: "Mathieu Bélanger",
    save: "Save",
    saved: "Saved",
    next: "Next",
    back: "Back",
    add: "Add",
    remove: "Remove",
    duplicate: "Duplicate",
    cancel: "Cancel",
    confirm: "Confirm",
    autosave: "Auto-save",
    lastSaved: "Last saved",

    steps: [
      "Identification",
      "Parks & fields",
      "Map & poles",
      "Product configuration",
      "Financial summary",
      "HQ-OSE incentive",
      "Final document"
    ],

    s1: {
      title: "Project identification",
      sub: "Municipality and project lead contact. This appears on the final project sheet.",
      muniSection: "Municipality",
      muniName: "Municipality",
      regAdmin: "Administrative region",
      population: "Population",
      contactSection: "Project lead",
      fullName: "Full name",
      role: "Title",
      email: "Email",
      phone: "Phone",
      ref: "Internal reference"
    },

    s2: {
      title: "Parks and sports fields",
      sub: "Add the parks covered by this project, then the fields to be lit. Picking a category auto-applies the standard and scope of work.",
      addPark: "Add park",
      addField: "Add field",
      parkName: "Park name",
      parkAddress: "Address",
      fieldsCount: "fields",
      fieldName: "Field label",
      sport: "Discipline",
      category: "Play category",
      categoryHint: "Pick a category to auto-apply the lighting standard and scope",
      scope: "Scope of work",
      specs: "Applied specs",
      lux: "Average illuminance",
      uniformity: "Uniformity (Uo)",
      glare: "Glare (TI max)",
      hours: "Hours/yr",
      cols: { name: "Field", sport: "Discipline", category: "Category", scope: "Scope", specs: "Specs", actions: "" },
      noParks: "No park added. Click \"Add park\" to start.",
      noFields: "No fields in this park."
    },

    s3: {
      title: "Field outline & pole placement",
      sub: "For each park, trace the field outline, place poles, and flag sensitive directions (housing, streets) that need shielding.",
      selectPark: "Park",
      selectField: "Field",
      tools: { draw: "Draw field", pole: "Place pole", measure: "Measure point", protect: "Sensitive direction", delete: "Delete" },
      legend: "Click to add — double-click to close an outline",
      poleCount: "Poles",
      measureCount: "Measurement points",
      protections: "Required mitigations",
      directions: { N: "North", E: "East", S: "South", W: "West" },
      direction: "Direction",
      contextLabel: "Context",
      ctxOpen: "Open",
      ctxStreet: "Street / traffic",
      ctxHousing: "Housing",
      mitigation: "Mitigation required",
      mitVisor: "Visor",
      mitNarrow: "Narrow optic",
      mitBoth: "Visor + narrow optic",
      tableTitle: "Implantation summary",
      cols: { id: "ID", type: "Type", x: "X (m)", y: "Y (m)", height: "Height (m)", projectors: "Projectors", note: "Notes" },
      summary: "Summary",
      totalPoles: "Poles total",
      totalProjectors: "Projectors needed",
      totalMeasures: "Measure points",
      totalProtections: "Directions to mitigate"
    },

    s4: {
      title: "Lightpro OM configuration",
      sub: "Pick the options. The financial summary and HQ-OSE incentive update in real time.",
      family: "Family",
      module: "Module / power",
      optic: "Optic",
      cct: "Temperature (CCT)",
      visor: "Visor",
      bracket: "Bracket",
      control: "Control",
      surge: "Surge protection",
      finish: "Finish",
      preview: "Product preview",
      unitPrice: "Unit price",
      qty: "Total quantity",
      subtotal: "Equipment subtotal",
      includes: "Standard inclusions",
      includesItems: [
        "Optisinkpad™ modular heat sink",
        "10-year warranty",
        "DLC, RoHS, IP66, IK10 certified",
        "−40°C to +50°C temperature range",
        "Tridonic / Inventronics driver options"
      ],
      controlsImpactTitle: "Incentive impact",
      controlsImpactOn: "With controls: +$9/luminaire eligible",
      controlsImpactOff: "Without controls: $20/luminaire eligible"
    },

    s5: {
      title: "Financial summary",
      sub: "HID status quo vs Lightpro OM conversion, including the HQ-OSE incentive.",
      scenarioA: "Scenario A — Existing HID",
      scenarioB: "Scenario B — Lightpro OM",
      scenarioBTag: "Recommended",
      perYear: "/ year",
      payback: "Payback period",
      co2: "CO₂ reduction",
      annualSaving: "Annual saving",
      cumulSaving: "10-year saving",
      breakdown: "Cost breakdown",
      equipment: "Equipment (Lightpro OM)",
      install: "Install & wiring",
      engineering: "IES photometric study",
      contingency: "Contingency (10%)",
      subtotal: "Subtotal before grant",
      grant: "HQ-OSE incentive",
      net: "Net cost to municipality",
      includedTitle: "Included in the quote",
      excludedTitle: "Excluded / by client",
      included: [
        "IESNA RP-6 photometric study",
        "Glare (TI) & uniformity (Uo) calc",
        "Scaled implantation drawing",
        "Detailed bill of materials",
        "Full 10-year warranty",
        "Commissioning and training"
      ],
      excluded: [
        "Excavation and concrete foundations",
        "High-voltage electrical work",
        "Distribution panel upgrade",
        "Geodetic surveying",
        "Municipal permits and taxes",
        "Disposal of existing equipment"
      ]
    },

    s6: {
      title: "HQ-OSE incentive",
      sub: "Hydro-Québec's \"Efficient Solutions\" program. Below is the Lightpro flat rate for sports DEL projectors.",
      formulaTitle: "Applicable rate — Lightpro projectors",
      base: "Lightpro DEL luminaire",
      baseRate: "$20 / luminaire",
      baseNote: "Any wattage — flat rate",
      withCtrl: "Regulation & controls",
      withCtrlRate: "+ $9 / luminaire",
      withCtrlNote: "If a controllable system is installed (DALI 2, Lumio Air, GNSS)",
      eligibility: "Eligibility",
      eligibilityItems: [
        "Building or installation in Québec served by Hydro-Québec",
        "Replacing existing halide or HID lighting",
        "Products on the eligible Lightpro DEL list",
        "Application filed before work begins"
      ],
      calcTitle: "Calculation for this project",
      lineProj: "Lightpro luminaires",
      lineCtrl: "Controls bonus",
      lineTotal: "Estimated total incentive",
      noCtrlNotice: "No DALI/Lumio control selected in step 4. Enable a control system to add the $9/u bonus."
    },

    s7: {
      title: "Final document",
      sub: "Add the client's email and phone. The full report (project sheet, layout plans, energy summary, pre-filled HQ-OSE form) is sent on submit.",
      formTitle: "Recipient",
      clientName: "Recipient name",
      clientEmail: "Email",
      clientPhone: "Phone",
      ccLightbase: "Send copy to Lightbase",
      consent: "I consent to Lightbase using these details for project follow-up",
      reportTitle: "Report contents",
      reportItems: [
        "Project sheet — municipal summary (1 page)",
        "Scaled implantation drawing (PDF)",
        "IESNA RP-6 photometric study (PDF)",
        "25-year financial summary with HQ-OSE incentive",
        "Pre-filled HQ-OSE application",
        "Bill of materials and DLC/IES certificates"
      ],
      send: "Send report",
      sentTitle: "Report sent",
      sentSub: "The recipient will receive every document by email within 2 minutes. A copy has been sent to your address."
    }
  }
};

// Field categories drive specs + scope automatically
window.FIELD_CATEGORIES = [
  {
    id: "rec",
    fr: "Récréatif communautaire",
    en: "Community / recreational",
    lux: 75, uo: "0.4", ti: 55, hours: 600,
    scopeFr: "Conversion DEL — fûts existants conservés",
    scopeEn: "DEL conversion — existing poles kept"
  },
  {
    id: "amateur",
    fr: "Amateur — ligue locale",
    en: "Amateur — local league",
    lux: 200, uo: "0.5", ti: 50, hours: 900,
    scopeFr: "Conversion DEL + ajout de fûts si requis",
    scopeEn: "DEL conversion + add poles if needed"
  },
  {
    id: "semipro",
    fr: "Semi-professionnel",
    en: "Semi-professional",
    lux: 500, uo: "0.6", ti: 50, hours: 1100,
    scopeFr: "Installation neuve complète — fûts et fondations",
    scopeEn: "Full new install — poles and foundations"
  },
  {
    id: "pro",
    fr: "Professionnel — diffusion HD",
    en: "Pro — HD broadcast",
    lux: 750, uo: "0.7", ti: 50, hours: 1200,
    scopeFr: "Installation neuve haute performance + caméras TV",
    scopeEn: "New high-performance install + TV cameras"
  },
  {
    id: "training",
    fr: "Entraînement",
    en: "Training",
    lux: 100, uo: "0.4", ti: 55, hours: 700,
    scopeFr: "Conversion DEL économique",
    scopeEn: "Economical DEL conversion"
  }
];

window.SPORTS = ["Soccer 11v11", "Soccer 7v7", "Baseball", "Football", "Tennis", "Pickleball", "Patinoire ext.", "Multi-sport"];
