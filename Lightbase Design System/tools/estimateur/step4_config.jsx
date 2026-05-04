// step4_config.jsx — Lightpro OM configurator (was step 7)
const CONFIG_OPTIONS = {
  family: ["OM300", "OM400"],
  module: ["M1 — 320W", "M2 — 480W", "M3 — 600W"],
  optic: ["T2 — Symétrique", "T3 — Asymétrique long", "T5 — Forward throw"],
  cct: ["3000K", "4000K", "5000K", "5700K"],
  visor: ["Aucune", "Visière courte", "Visière long"],
  bracket: ["Slip-fitter Ø60", "Yoke ajustable", "Bras horizontal"],
  control: ["Aucun", "0-10V", "DALI 2", "DALI 2 + GNSS", "Lumio Air"],
  surge: ["10 kV", "20 kV"],
  finish: ["Noir mat RAL 9005", "Gris RAL 7016", "Aluminium naturel"]
};

function OptRow({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="field__label" style={{ marginBottom: 8, display: "block" }}>{label}</label>
      <div className="opt-row">
        {options.map(opt => (
          <button key={opt} className={`opt ${value === opt ? "is-active" : ""}`} onClick={() => onChange(opt)}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

function Step4Config() {
  const { t, state, config, setConfig, totals, pricing } = useApp();
  const s = t.s4;
  const set = (k, v) => setConfig({ ...config, [k]: v });

  return (
    <div className="page">
      <PageHead eyebrow={`04 / 07`} title={s.title} sub={s.sub} actions={<button className="btn btn--solid btn--sm">{t.save}</button>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        <div className="col" style={{ gap: 16 }}>
          <div className="cfg-section">
            <h4>{state.lang === "fr" ? "Architecture" : "Architecture"}</h4>
            <OptRow label={s.family} options={CONFIG_OPTIONS.family} value={config.family} onChange={v => set("family", v)} />
            <OptRow label={s.module} options={CONFIG_OPTIONS.module} value={config.module} onChange={v => set("module", v)} />
            <OptRow label={s.optic} options={CONFIG_OPTIONS.optic} value={config.optic} onChange={v => set("optic", v)} />
          </div>
          <div className="cfg-section">
            <h4>{state.lang === "fr" ? "Photométrie" : "Photometry"}</h4>
            <OptRow label={s.cct} options={CONFIG_OPTIONS.cct} value={config.cct} onChange={v => set("cct", v)} />
            <OptRow label={s.visor} options={CONFIG_OPTIONS.visor} value={config.visor} onChange={v => set("visor", v)} />
          </div>
          <div className="cfg-section">
            <h4>{state.lang === "fr" ? "Mécanique & électrique" : "Mechanical & electrical"}</h4>
            <OptRow label={s.bracket} options={CONFIG_OPTIONS.bracket} value={config.bracket} onChange={v => set("bracket", v)} />
            <OptRow label={s.control} options={CONFIG_OPTIONS.control} value={config.control} onChange={v => set("control", v)} />
            <OptRow label={s.surge} options={CONFIG_OPTIONS.surge} value={config.surge} onChange={v => set("surge", v)} />
            <OptRow label={s.finish} options={CONFIG_OPTIONS.finish} value={config.finish} onChange={v => set("finish", v)} />
          </div>
        </div>

        <div className="col" style={{ gap: 16, position: "sticky", top: 0 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ height: 220, background: `#000 url(assets/lightpro.jpg) center/cover`, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)" }} />
              <div style={{ position: "absolute", left: 16, bottom: 14, color: "#fff" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7 }}>Lightpro</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{config.family} · {config.module}</div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              <div className="card__row"><span className="muted">{s.unitPrice}</span><span style={{ fontFeatureSettings: '"tnum"' }}>{fmtMoney(pricing.unit, state.lang)}</span></div>
              <div className="card__row"><span className="muted">{s.qty}</span><span>{totals.projectors}</span></div>
              <div className="card__row card__row--total"><span>{s.subtotal}</span><span style={{ fontFeatureSettings: '"tnum"' }}>{fmtMoney(pricing.equipment, state.lang)}</span></div>
            </div>
          </div>

          <div className="card" style={{ background: pricing.hasControls ? "#0A0A0A" : "#fff", color: pricing.hasControls ? "#fff" : "var(--lb-ink)", borderColor: pricing.hasControls ? "#0A0A0A" : "rgba(0,0,0,0.08)" }}>
            <h3 className="card__title" style={{ color: pricing.hasControls ? "rgba(255,255,255,0.6)" : undefined }}>{s.controlsImpactTitle}</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
              {pricing.hasControls ? s.controlsImpactOn : s.controlsImpactOff}
            </p>
            <div style={{ marginTop: 10, fontSize: 22, fontWeight: 600, fontFeatureSettings: '"tnum"', letterSpacing: "-0.02em" }}>
              {fmtMoney(pricing.grant, state.lang)}
              <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6, marginLeft: 8 }}>{state.lang === "fr" ? "subvention HQ-OSE" : "HQ-OSE incentive"}</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card__title">{s.includes}</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "var(--lb-ink-2)", lineHeight: 1.5 }}>
              {s.includesItems.map((item, i) => (
                <li key={i} style={{ paddingLeft: 18, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: 1, color: "#4F8F58", fontWeight: 600 }}>✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <NavRow />
    </div>
  );
}
Object.assign(window, { Step4Config });
