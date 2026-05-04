// step5_bilan.jsx — Financial summary
function Step5Bilan() {
  const { t, state, pricing, totals } = useApp();
  const s = t.s5;
  return (
    <div className="page">
      <PageHead eyebrow="05 / 07" title={s.title} sub={s.sub} actions={<button className="btn btn--solid btn--sm">{t.save}</button>} />

      <div className="kpis" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="kpi__lbl">{s.payback}</div><div className="kpi__val">{pricing.payback.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--lb-ink-3)", marginLeft: 4 }}>{state.lang === "fr" ? "ans" : "yrs"}</span></div></div>
        <div className="kpi"><div className="kpi__lbl">{s.annualSaving}</div><div className="kpi__val">{fmtMoney(pricing.annualSaving, state.lang)}</div></div>
        <div className="kpi"><div className="kpi__lbl">{s.cumulSaving}</div><div className="kpi__val">{fmtMoney(pricing.cumul10, state.lang)}</div></div>
      </div>

      <div className="bilan">
        <div className="bilan__main">
          <div className="scenario-grid">
            <div className="scenario">
              <div className="scenario__head"><h3 className="scenario__title">{s.scenarioA}</h3><span className="chip chip--info">HID</span></div>
              <div className="scenario__big">{fmtMoney(pricing.hidTotal, state.lang)}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--lb-ink-3)", marginLeft: 6 }}>{s.perYear}</span></div>
              <div className="scenario__lines">
                <span><b>{fmtNum(pricing.hidKwh, state.lang)} kWh</b> · {fmtMoney(pricing.hidEnergy, state.lang)} {state.lang === "fr" ? "énergie" : "energy"}</span>
                <span>{fmtMoney(pricing.hidMaint, state.lang)} {state.lang === "fr" ? "entretien" : "maintenance"}</span>
                <span>{state.lang === "fr" ? "Vie utile lampes" : "Lamp life"} : 8 000 h</span>
              </div>
            </div>
            <div className="scenario is-recommended">
              <div className="scenario__head"><h3 className="scenario__title">{s.scenarioB}</h3><span className="chip chip--go">{s.scenarioBTag}</span></div>
              <div className="scenario__big">{fmtMoney(pricing.ledTotal, state.lang)}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--lb-ink-3)", marginLeft: 6 }}>{s.perYear}</span></div>
              <div className="scenario__lines">
                <span><b>{fmtNum(pricing.ledKwh, state.lang)} kWh</b> · {fmtMoney(pricing.ledEnergy, state.lang)} {state.lang === "fr" ? "énergie" : "energy"}</span>
                <span>{fmtMoney(pricing.ledMaint, state.lang)} {state.lang === "fr" ? "entretien" : "maintenance"}</span>
                <span>{state.lang === "fr" ? "Vie utile L70" : "L70 life"} : 100 000 h · {pricing.co2Saved} t CO₂/an</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "14px 18px" }}><h3 className="card__title" style={{ margin: 0 }}>{s.breakdown}</h3></div>
            <table className="tbl" style={{ border: 0 }}>
              <tbody>
                <tr><td>{s.equipment}</td><td className="num">{totals.projectors} × {fmtMoney(pricing.unit, state.lang)}</td><td className="num"><b>{fmtMoney(pricing.equipment, state.lang)}</b></td></tr>
                <tr><td>{s.install}</td><td className="num">{totals.poles} {state.lang === "fr" ? "fûts" : "poles"}</td><td className="num"><b>{fmtMoney(pricing.install, state.lang)}</b></td></tr>
                <tr><td>{s.engineering}</td><td className="num">—</td><td className="num"><b>{fmtMoney(pricing.engineering, state.lang)}</b></td></tr>
                <tr><td>{s.contingency}</td><td className="num">10 %</td><td className="num"><b>{fmtMoney(pricing.contingency, state.lang)}</b></td></tr>
                <tr style={{ background: "var(--lb-paper)" }}><td><b>{s.subtotal}</b></td><td></td><td className="num"><b>{fmtMoney(pricing.subtotal, state.lang)}</b></td></tr>
                <tr><td style={{ color: "#2F6E37" }}>− {s.grant}</td><td className="num">{pricing.hasControls ? state.lang === "fr" ? "20 + 9 $/u" : "$20 + $9/u" : "20 $/u"}</td><td className="num" style={{ color: "#2F6E37" }}><b>− {fmtMoney(pricing.grant, state.lang)}</b></td></tr>
                <tr style={{ background: "#0A0A0A", color: "#fff" }}><td><b>{s.net}</b></td><td></td><td className="num"><b style={{ fontSize: 16 }}>{fmtMoney(pricing.net, state.lang)}</b></td></tr>
              </tbody>
            </table>
          </div>

          <div className="incl-grid">
            <div className="incl-col">
              <h5><span className="mark mark--ok"></span>{s.includedTitle}</h5>
              <ul>{s.included.map((it, i) => <li key={i}>{it}</li>)}</ul>
            </div>
            <div className="incl-col">
              <h5><span className="mark mark--no"></span>{s.excludedTitle}</h5>
              <ul>{s.excluded.map((it, i) => <li key={i}>{it}</li>)}</ul>
            </div>
          </div>
        </div>

        <div className="summary">
          <div className="card" style={{ background: "#0A0A0A", color: "#fff", borderColor: "#0A0A0A" }}>
            <h3 className="card__title" style={{ color: "rgba(255,255,255,0.6)" }}>{state.lang === "fr" ? "Coût net municipalité" : "Net cost"}</h3>
            <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>{fmtMoney(pricing.net, state.lang)}</div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.5 }}>
              {state.lang === "fr" ? "Après subvention HQ-OSE — sujet à validation par Hydro-Québec." : "After HQ-OSE incentive — subject to Hydro-Québec validation."}
            </p>
            <hr className="hr" style={{ background: "rgba(255,255,255,0.12)" }} />
            <div className="card__row" style={{ fontSize: 12 }}><span style={{ color: "rgba(255,255,255,0.7)" }}>{s.payback}</span><span>{pricing.payback.toFixed(1)} {state.lang === "fr" ? "ans" : "yrs"}</span></div>
            <div className="card__row" style={{ fontSize: 12 }}><span style={{ color: "rgba(255,255,255,0.7)" }}>{state.lang === "fr" ? "CO₂ évité / an" : "CO₂ avoided / yr"}</span><span>{pricing.co2Saved} t</span></div>
            <div className="card__row" style={{ fontSize: 12 }}><span style={{ color: "rgba(255,255,255,0.7)" }}>{state.lang === "fr" ? "Projecteurs" : "Projectors"}</span><span>{totals.projectors}</span></div>
          </div>
        </div>
      </div>

      <NavRow />
    </div>
  );
}
Object.assign(window, { Step5Bilan });
