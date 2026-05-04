// step2_parks.jsx — Parks + fields with category-driven specs/scope
function Step2Parks() {
  const { t, state, parks, addPark, removePark, updatePark, addField, removeField, updateField } = useApp();
  const s = t.s2;
  const cats = window.FIELD_CATEGORIES;
  const sports = window.SPORTS;

  return (
    <div className="page">
      <PageHead
        eyebrow={`02 / 07`}
        title={s.title}
        sub={s.sub}
        actions={<button className="btn btn--solid btn--sm" onClick={addPark}>+ {s.addPark}</button>}
      />

      {parks.length === 0 && <div className="card"><p className="muted">{s.noParks}</p></div>}

      <div className="col" style={{ gap: 16 }}>
        {parks.map(park => (
          <div key={park.id} className="card" style={{ padding: 0 }}>
            <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "2fr 3fr auto auto", gap: 12, alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <input className="input--ghost" style={{ fontSize: 16, fontWeight: 600 }} value={park.name} onChange={e => updatePark(park.id, { name: e.target.value })} />
              <input className="input--ghost" style={{ fontSize: 13, color: "var(--lb-ink-3)" }} value={park.address} placeholder={s.parkAddress} onChange={e => updatePark(park.id, { address: e.target.value })} />
              <span className="chip chip--info">{park.fields.length} {s.fieldsCount}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn--ghost btn--sm" onClick={() => addField(park.id)}>+ {s.addField}</button>
                <button className="btn btn--ghost btn--sm" onClick={() => removePark(park.id)} title={t.remove}>×</button>
              </div>
            </div>

            {park.fields.length === 0 ? (
              <p className="muted" style={{ padding: "20px 18px", margin: 0, fontSize: 13 }}>{s.noFields}</p>
            ) : (
              <table className="tbl" style={{ border: 0, borderRadius: 0 }}>
                <thead>
                  <tr>
                    <th>{s.cols.name}</th>
                    <th>{s.cols.sport}</th>
                    <th style={{ width: 220 }}>{s.cols.category}</th>
                    <th>{s.cols.scope}</th>
                    <th>{s.cols.specs}</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {park.fields.map(f => {
                    const cat = getCategory(f.category);
                    const scope = state.lang === "fr" ? cat.scopeFr : cat.scopeEn;
                    return (
                      <tr key={f.id}>
                        <td><input className="input--ghost" value={f.name} onChange={e => updateField(park.id, f.id, { name: e.target.value })} /></td>
                        <td>
                          <select className="input--ghost" value={f.sport} onChange={e => updateField(park.id, f.id, { sport: e.target.value })} style={{ width: "100%" }}>
                            {sports.map(sp => <option key={sp}>{sp}</option>)}
                          </select>
                        </td>
                        <td>
                          <select className="input--ghost" value={f.category} onChange={e => updateField(park.id, f.id, { category: e.target.value })} style={{ width: "100%" }}>
                            {cats.map(c => <option key={c.id} value={c.id}>{state.lang === "fr" ? c.fr : c.en}</option>)}
                          </select>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--lb-ink-2)" }}>{scope}</td>
                        <td style={{ fontSize: 11, color: "var(--lb-ink-3)", lineHeight: 1.5 }}>
                          <b style={{ color: "var(--lb-ink)", fontFeatureSettings: '"tnum"' }}>{cat.lux} lx</b> · Uo {cat.uo} · TI {cat.ti} · {cat.hours} h/an
                        </td>
                        <td>
                          <button className="btn btn--ghost btn--sm" onClick={() => removeField(park.id, f.id)} title={t.remove}>×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      <div className="notice" style={{ marginTop: 16 }}>
        <b>{state.lang === "fr" ? "Catégories de jeu" : "Play categories"}.</b>{" "}
        {state.lang === "fr"
          ? "La catégorie applique automatiquement la norme d'éclairement (lx, Uo, TI), les heures d'utilisation annuelles et la portée des travaux. Vous pourrez ajuster les fûts et le tracé à l'étape suivante."
          : "The category auto-applies the illuminance standard (lx, Uo, TI), annual operating hours, and the scope of work. You can adjust poles and outline in the next step."}
      </div>

      <NavRow />
    </div>
  );
}
Object.assign(window, { Step2Parks });
