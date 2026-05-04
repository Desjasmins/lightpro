// state.jsx — restructured global state for 7-step Estimateur
const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;

const initialState = /*EDITMODE-BEGIN*/{
  "lang": "fr",
  "currentStep": 0,
  "muniName": "Ville de Saint-Bruno-de-Montarville",
  "regAdmin": "16 — Montérégie",
  "population": "27 612",
  "fullName": "Mathieu Bélanger",
  "role": "Directeur, Travaux publics",
  "email": "m.belanger@stbruno.ca",
  "phone": "450 653-2444",
  "ref": "STB-2026-014",
  "clientName": "",
  "clientEmail": "",
  "clientPhone": "",
  "ccLightbase": true,
  "consent": false
}/*EDITMODE-END*/;

// Each park has fields. Each field carries category, sport, scope, and its own map data.
const initialParks = [
  {
    id: "p1",
    name: "Parc des Tilleuls",
    address: "1585 rue Roberval, Saint-Bruno-de-Montarville",
    fields: [
      {
        id: "f1",
        name: "Terrain principal",
        sport: "Soccer 11v11",
        category: "amateur",
        // map data per field
        outline: [[22, 30], [78, 28], [80, 72], [20, 70]],
        poles: [
          { id: 1, x: 14, y: 22, height: 22, projectors: 4 },
          { id: 2, x: 86, y: 22, height: 22, projectors: 4 },
          { id: 3, x: 14, y: 78, height: 22, projectors: 4 },
          { id: 4, x: 86, y: 78, height: 22, projectors: 4 }
        ],
        measures: [
          { id: 1, x: 35, y: 50 }, { id: 2, x: 65, y: 50 }, { id: 3, x: 50, y: 35 }, { id: 4, x: 50, y: 65 }
        ],
        directions: {
          N: { context: "open", mitigation: "none" },
          E: { context: "street", mitigation: "visor" },
          S: { context: "housing", mitigation: "both" },
          W: { context: "open", mitigation: "none" }
        }
      },
      {
        id: "f2",
        name: "Terrain U-12",
        sport: "Soccer 7v7",
        category: "rec",
        outline: [[30, 35], [70, 35], [70, 65], [30, 65]],
        poles: [
          { id: 1, x: 22, y: 30, height: 18, projectors: 3 },
          { id: 2, x: 78, y: 30, height: 18, projectors: 3 },
          { id: 3, x: 22, y: 70, height: 18, projectors: 3 },
          { id: 4, x: 78, y: 70, height: 18, projectors: 3 }
        ],
        measures: [{ id: 1, x: 50, y: 50 }],
        directions: {
          N: { context: "open", mitigation: "none" },
          E: { context: "open", mitigation: "none" },
          S: { context: "street", mitigation: "visor" },
          W: { context: "housing", mitigation: "both" }
        }
      }
    ]
  },
  {
    id: "p2",
    name: "Parc Rabastalière",
    address: "1500 rue Beaumont, Saint-Bruno-de-Montarville",
    fields: [
      {
        id: "f1",
        name: "Terrain de baseball",
        sport: "Baseball",
        category: "amateur",
        outline: [[18, 20], [82, 20], [82, 80], [18, 80]],
        poles: [
          { id: 1, x: 14, y: 14, height: 24, projectors: 6 },
          { id: 2, x: 86, y: 14, height: 24, projectors: 6 },
          { id: 3, x: 14, y: 86, height: 22, projectors: 4 },
          { id: 4, x: 86, y: 86, height: 22, projectors: 4 }
        ],
        measures: [{ id: 1, x: 50, y: 50 }, { id: 2, x: 30, y: 70 }, { id: 3, x: 70, y: 70 }],
        directions: {
          N: { context: "housing", mitigation: "both" },
          E: { context: "open", mitigation: "none" },
          S: { context: "open", mitigation: "none" },
          W: { context: "street", mitigation: "visor" }
        }
      }
    ]
  }
];

const initialConfig = /*EDITMODE-BEGIN*/{
  "family": "OM400",
  "module": "M2 — 480W",
  "optic": "T3 — Asymétrique long",
  "cct": "5000K",
  "visor": "Visière long",
  "bracket": "Slip-fitter Ø60",
  "control": "DALI 2 + GNSS",
  "surge": "20 kV",
  "finish": "Noir mat RAL 9005"
}/*EDITMODE-END*/;

const StateContext = createContext(null);

function StateProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [parks, setParks] = useState(initialParks);
  const [activePark, setActivePark] = useState("p1");
  const [activeField, setActiveField] = useState("f1");
  const [config, setConfig] = useState(initialConfig);

  const t = window.I18N[state.lang];
  const setLang = (lang) => setState(s => ({ ...s, lang }));
  const setStep = (n) => setState(s => ({ ...s, currentStep: n }));
  const update = (patch) => setState(s => ({ ...s, ...patch }));

  // Park / field mutations
  const addPark = () => {
    const id = "p" + (Date.now() % 100000);
    setParks([...parks, { id, name: state.lang === "fr" ? "Nouveau parc" : "New park", address: "", fields: [] }]);
    setActivePark(id);
  };
  const removePark = (id) => {
    const next = parks.filter(p => p.id !== id);
    setParks(next);
    if (activePark === id && next[0]) setActivePark(next[0].id);
  };
  const updatePark = (id, patch) => setParks(parks.map(p => p.id === id ? { ...p, ...patch } : p));

  const addField = (parkId) => {
    const id = "f" + (Date.now() % 100000);
    setParks(parks.map(p => p.id === parkId ? {
      ...p,
      fields: [...p.fields, {
        id,
        name: state.lang === "fr" ? "Nouveau terrain" : "New field",
        sport: "Soccer 11v11",
        category: "amateur",
        outline: [[25, 30], [75, 30], [75, 70], [25, 70]],
        poles: [],
        measures: [],
        directions: {
          N: { context: "open", mitigation: "none" },
          E: { context: "open", mitigation: "none" },
          S: { context: "open", mitigation: "none" },
          W: { context: "open", mitigation: "none" }
        }
      }]
    } : p));
    setActiveField(id);
  };
  const removeField = (parkId, fieldId) => {
    setParks(parks.map(p => p.id === parkId ? { ...p, fields: p.fields.filter(f => f.id !== fieldId) } : p));
  };
  const updateField = (parkId, fieldId, patch) => {
    setParks(parks.map(p => p.id === parkId ? {
      ...p,
      fields: p.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f)
    } : p));
  };

  // Derived totals
  const totals = useMemo(() => {
    let projectors = 0, poles = 0, measures = 0, fields = 0, protections = 0;
    for (const p of parks) {
      for (const f of p.fields) {
        fields += 1;
        poles += f.poles.length;
        measures += f.measures.length;
        for (const pole of f.poles) projectors += pole.projectors || 0;
        for (const dir of Object.values(f.directions || {})) {
          if (dir.mitigation && dir.mitigation !== "none") protections += 1;
        }
      }
    }
    return { projectors, poles, measures, fields, protections };
  }, [parks]);

  // Pricing — uses HQ-OSE flat rate: $20/u, +$9/u with controls
  const pricing = useMemo(() => {
    const wattsMatch = (config.module || "").match(/(\d+)W/);
    const watts = wattsMatch ? parseInt(wattsMatch[1], 10) : 480;
    const familyMult = config.family === "OM300" ? 0.85 : 1.0;
    const opticMult = (config.optic || "").includes("T3") ? 1.04 : 1.0;
    const ctrlMult = (config.control || "").includes("DALI") || (config.control || "").includes("Lumio") ? 1.08 : 1.02;
    const unit = Math.round(2380 * familyMult * (watts / 400) * opticMult * ctrlMult);
    const equipment = unit * totals.projectors;
    const install = Math.max(1, totals.poles) * 4200;
    const engineering = 6800;
    const subtotalRaw = equipment + install + engineering;
    const contingency = Math.round(subtotalRaw * 0.10);
    const subtotal = subtotalRaw + contingency;

    // HQ-OSE — Lightpro: $20/u flat, +$9/u with controls
    const hasControls = (config.control || "") !== "0-10V" && (config.control || "") !== "Aucun";
    const grantBase = totals.projectors * 20;
    const grantBonus = hasControls ? totals.projectors * 9 : 0;
    const grant = grantBase + grantBonus;

    const net = subtotal - grant;

    // Status quo (HID) baseline
    const hidKwh = Math.round(totals.projectors * 0.95 * 950);
    const ledKwh = Math.round(totals.projectors * (watts / 1000) * 950);
    const electricRate = 0.078;
    const hidEnergy = Math.round(hidKwh * electricRate);
    const ledEnergy = Math.round(ledKwh * electricRate);
    const hidMaint = totals.projectors * 220;
    const ledMaint = totals.projectors * 35;
    const annualSaving = (hidEnergy + hidMaint) - (ledEnergy + ledMaint);
    const cumul10 = annualSaving * 10;
    const payback = annualSaving > 0 ? (net / annualSaving) : 0;
    const co2Saved = Math.round((hidKwh - ledKwh) * 0.0019);

    return {
      unit, equipment, install, engineering, contingency, subtotal,
      grant, grantBase, grantBonus, hasControls, net,
      hidKwh, ledKwh, hidEnergy, ledEnergy, hidMaint, ledMaint,
      hidTotal: hidEnergy + hidMaint, ledTotal: ledEnergy + ledMaint,
      annualSaving, cumul10, payback, co2Saved, watts
    };
  }, [config, totals]);

  const value = {
    state, t, setLang, setStep, update,
    parks, setParks, activePark, setActivePark, activeField, setActiveField,
    addPark, removePark, updatePark, addField, removeField, updateField,
    config, setConfig, totals, pricing
  };
  return React.createElement(StateContext.Provider, { value }, children);
}

function useApp() { return useContext(StateContext); }

function polygonArea(points) {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += (x1 * y2 - x2 * y1);
  }
  area = Math.abs(area) / 2;
  return Math.round((area / 10000) * (180 * 130));
}

function polygonPerimeter(points) {
  if (!points || points.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    const dx = (x2 - x1) * 1.80, dy = (y2 - y1) * 1.30;
    p += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.round(p);
}

function fmtMoney(n, lang = "fr") {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
}
function fmtNum(n, lang = "fr") {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA").format(n);
}

function getCategory(id) {
  return window.FIELD_CATEGORIES.find(c => c.id === id) || window.FIELD_CATEGORIES[0];
}

Object.assign(window, {
  StateProvider, useApp,
  polygonArea, polygonPerimeter,
  fmtMoney, fmtNum, getCategory
});
