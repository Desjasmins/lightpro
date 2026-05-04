// step6_ose.jsx — HQ-OSE incentive details with Lightpro flat rate ($20/u, +$9 with controls)
function Step6OSE() {
  const { t, state, pricing, totals, config } = useApp();
  const s = t.s6;
  return (
    <div className="page">
      <PageHead eyebrow="06 / 07" title={s.title} sub={s.sub} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Formula */}
        <div className="card">
          <h3 className="card__title">{s.formulaTitle}</h3>
          <div className="col" style={{ gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--lb-ink)" }}>{s.base}</div>
                <div style={{ fontSize: 12, color: "var(--lb-ink-3)", marginTop: 2 }}>{s.baseNote}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFeatureSettings: '"tnum"', letterSpacing: "-0.02em" }}>{s.baseRate}</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 0" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--lb-ink)" }}>{s.withCtrl}</div>
                <div style={{ fontSize: 12, color: "var(--lb-ink-3)", marginTop: 2 }}>{s.withCtrlNote}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFeatureSettings: '"tnum"', letterSpacing: "-0.02em", color: pricing.hasControls ? "#2F6E37" : "var(--lb-ink-3)" }}>{s.withCtrlRate}</div>
            </div>
          </div>

          <div className="notice" style={{ marginTop: 16 }}>
            <b>{s.eligibility}.</b>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12 }}>
              {s.eligibilityItems.map((it, i) => <li key={i} style={{ marginTop: 2 }}>{it}</li>)}
            </ul>
          </div>
        </div>

        {/* Calculation */}
        <div className="card" style={{ background: "#0A0A0A", color: "#fff", borderColor: "#0A0A0A" }}>
          <h3 className="card__title" style={{ color: "rgba(255,255,255,0.6)" }}>{s.calcTitle}</h3>

          <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13 }}>{s.lineProj}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{totals.projectors} × 20 $</div>
            </div>
            <div style={{ fontFeatureSettings: '"tnum"' }}>{fmtMoney(pricing.grantBase, state.lang)}</div>
          </div>

          <div style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", opacity: pricing.hasControls ? 1 : 0.45 }}>
            <div>
              <div style={{ fontSize: 13 }}>{s.lineCtrl}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pricing.hasControls ? `${totals.projectors} × 9 $ — ${config.control}` : (state.lang === "fr" ? "Aucun contrôle sélectionné" : "No control selected")}</div>
            </div>
            <div style={{ fontFeatureSettings: '"tnum"' }}>{pricing.hasControls ? `+ ${fmtMoney(pricing.grantBonus, state.lang)}` : "—"}</div>
          </div>

          <div style={{ paddingTop: 18, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>{s.lineTotal}</div>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>{fmtMoney(pricing.grant, state.lang)}</div>
          </div>

          {!pricing.hasControls && (
            <div style={{ marginTop: 14, padding: 12, background: "rgba(255,255,255,0.06)", borderRadius: 4, fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              <b style={{ color: "#fff" }}>↗ </b>{s.noCtrlNotice}
            </div>
          )}
        </div>
      </div>

      <NavRow />
    </div>
  );
}
Object.assign(window, { Step6OSE });
