// step1_setup.jsx — merged Identification (compact)
function Step1Setup() {
  const { t, state, update } = useApp();
  const s = t.s1;
  const Field = ({ label, value, onChange, type = "text", colspan = 1 }) => (
    <div className="field" style={{ gridColumn: `span ${colspan}` }}>
      <label className="field__label">{label}</label>
      <input className="input" type={type} value={value || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
  return (
    <div className="page">
      <PageHead eyebrow={`01 / 07`} title={s.title} sub={s.sub} actions={<button className="btn btn--solid btn--sm">{t.save}</button>} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <h3 className="card__title">{s.muniSection}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label={s.muniName} value={state.muniName} onChange={v => update({ muniName: v })} colspan={2} />
            <Field label={s.regAdmin} value={state.regAdmin} onChange={v => update({ regAdmin: v })} />
            <Field label={s.population} value={state.population} onChange={v => update({ population: v })} />
            <Field label={s.ref} value={state.ref} onChange={v => update({ ref: v })} colspan={2} />
          </div>
        </div>
        <div className="card">
          <h3 className="card__title">{s.contactSection}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label={s.fullName} value={state.fullName} onChange={v => update({ fullName: v })} />
            <Field label={s.role} value={state.role} onChange={v => update({ role: v })} />
            <Field label={s.email} value={state.email} onChange={v => update({ email: v })} type="email" />
            <Field label={s.phone} value={state.phone} onChange={v => update({ phone: v })} />
          </div>
        </div>
      </div>
      <NavRow />
    </div>
  );
}
Object.assign(window, { Step1Setup });
