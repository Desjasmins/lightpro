// step7_send.jsx — Final document send (email + phone)
const { useState: uS7s } = React;

function Step7Send() {
  const { t, state, update, parks, pricing, totals } = useApp();
  const s = t.s7;
  const [sent, setSent] = uS7s(false);

  if (sent) {
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 560, margin: "60px auto", textAlign: "center", padding: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(79,143,88,0.15)", color: "#2F6E37", display: "grid", placeItems: "center", margin: "0 auto 18px", fontSize: 28 }}>✓</div>
          <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 8px" }}>{s.sentTitle}</h2>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{s.sentSub}</p>
          <p style={{ fontSize: 13, marginTop: 16 }}><b>{state.clientEmail}</b></p>
          <button className="btn btn--solid btn--sm" style={{ marginTop: 20 }} onClick={() => setSent(false)}>← {t.back}</button>
        </div>
      </div>
    );
  }

  const canSend = state.clientEmail && state.clientPhone && state.consent;

  return (
    <div className="page">
      <PageHead eyebrow="07 / 07" title={s.title} sub={s.sub} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 className="card__title">{s.formTitle}</h3>
          <div className="col" style={{ gap: 14 }}>
            <div className="field">
              <label className="field__label">{s.clientName}</label>
              <input className="input" value={state.clientName || ""} onChange={e => update({ clientName: e.target.value })} placeholder={state.lang === "fr" ? "Ex. Direction des loisirs" : "e.g. Recreation department"} />
            </div>
            <div className="field">
              <label className="field__label">{s.clientEmail} *</label>
              <input className="input" type="email" value={state.clientEmail || ""} onChange={e => update({ clientEmail: e.target.value })} placeholder="loisirs@ville.qc.ca" />
            </div>
            <div className="field">
              <label className="field__label">{s.clientPhone} *</label>
              <input className="input" type="tel" value={state.clientPhone || ""} onChange={e => update({ clientPhone: e.target.value })} placeholder="450 000-0000" />
            </div>
            <label className="toggle">
              <input type="checkbox" checked={state.ccLightbase} onChange={e => update({ ccLightbase: e.target.checked })} />
              <span className="toggle__sw"></span>
              <span className="toggle__lbl">{s.ccLightbase}</span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={state.consent} onChange={e => update({ consent: e.target.checked })} />
              <span className="toggle__sw"></span>
              <span className="toggle__lbl" style={{ fontSize: 12, color: "var(--lb-ink-3)" }}>{s.consent} *</span>
            </label>
            <button className="btn btn--solid" disabled={!canSend} onClick={() => setSent(true)} style={{ marginTop: 8, opacity: canSend ? 1 : 0.4, cursor: canSend ? "pointer" : "not-allowed" }}>
              ✉ {s.send}
            </button>
          </div>
        </div>

        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <h3 className="card__title">{s.reportTitle}</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--lb-ink-2)", lineHeight: 1.5 }}>
              {s.reportItems.map((it, i) => (
                <li key={i} style={{ paddingLeft: 22, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, width: 16, height: 16, background: "rgba(0,0,0,0.06)", borderRadius: 3, display: "inline-grid", placeItems: "center", fontSize: 10, color: "var(--lb-ink-3)" }}>📄</span>
                  {it}
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ background: "#0A0A0A", color: "#fff", borderColor: "#0A0A0A" }}>
            <h3 className="card__title" style={{ color: "rgba(255,255,255,0.6)" }}>{state.lang === "fr" ? "Récapitulatif du dossier" : "Project recap"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              <div className="card__row" style={{ borderColor: "rgba(255,255,255,0.1)" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>{state.lang === "fr" ? "Municipalité" : "Municipality"}</span><span>{state.muniName}</span></div>
              <div className="card__row" style={{ borderColor: "rgba(255,255,255,0.1)" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>{state.lang === "fr" ? "Parcs / terrains" : "Parks / fields"}</span><span>{parks.length} / {totals.fields}</span></div>
              <div className="card__row" style={{ borderColor: "rgba(255,255,255,0.1)" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>{state.lang === "fr" ? "Projecteurs" : "Projectors"}</span><span>{totals.projectors}</span></div>
              <div className="card__row" style={{ borderColor: "rgba(255,255,255,0.1)" }}><span style={{ color: "rgba(255,255,255,0.7)" }}>{state.lang === "fr" ? "Subvention HQ-OSE" : "HQ-OSE incentive"}</span><span>{fmtMoney(pricing.grant, state.lang)}</span></div>
              <div className="card__row card__row--total" style={{ borderColor: "rgba(255,255,255,0.4)" }}><span>{state.lang === "fr" ? "Coût net" : "Net cost"}</span><span>{fmtMoney(pricing.net, state.lang)}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
        <button className="btn btn--ghost" onClick={() => update({ currentStep: state.currentStep - 1 })}>← {t.back}</button>
      </div>
    </div>
  );
}
Object.assign(window, { Step7Send });
