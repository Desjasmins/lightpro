// shell.jsx — Topbar, Stepper, page chrome
const { useState: uS, useEffect: uE } = React;

function Topbar() {
  const { t, state, setLang } = useApp();
  return (
    <div className="topbar">
      <div className="topbar__left">
        <a className="topbar__brand" href="#">
          <img src="assets/logo-light.png" alt="Lightbase" />
        </a>
        <div className="topbar__title">{t.appName}</div>
      </div>
      <div className="topbar__right">
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
          {t.lastSaved}: {state.lang === "fr" ? "il y a 2 min" : "2 min ago"} · <span style={{ color: "#9AB87E" }}>● {t.autosave}</span>
        </span>
        <div className="lang">
          <button className={state.lang === "fr" ? "is-active" : ""} onClick={() => setLang("fr")}>FR</button>
          <button className={state.lang === "en" ? "is-active" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <div className="user">
          <span>{t.user}</span>
          <div className="avatar">MB</div>
        </div>
      </div>
    </div>
  );
}

function Stepper() {
  const { t, state, setStep } = useApp();
  return (
    <div className="stepper">
      {t.steps.map((label, i) => {
        const cls = i === state.currentStep ? "is-active" : i < state.currentStep ? "is-done" : "";
        return (
          <button key={i} className={`step ${cls}`} onClick={() => setStep(i)}>
            <span className="step__num"><span>{i + 1}</span></span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PageHead({ eyebrow, title, sub, actions }) {
  return (
    <div className="page__head">
      <div>
        {eyebrow && <p className="page__eyebrow">{eyebrow}</p>}
        <h1 className="page__title">{title}</h1>
        {sub && <p className="page__sub">{sub}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

function NavRow() {
  const { t, state, setStep } = useApp();
  const last = t.steps.length - 1;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
      <button className="btn btn--ghost" onClick={() => setStep(Math.max(0, state.currentStep - 1))} disabled={state.currentStep === 0}>
        ← {t.back}
      </button>
      <button className="btn btn--solid" onClick={() => setStep(Math.min(last, state.currentStep + 1))}>
        {t.next} →
      </button>
    </div>
  );
}

Object.assign(window, { Topbar, Stepper, PageHead, NavRow });
