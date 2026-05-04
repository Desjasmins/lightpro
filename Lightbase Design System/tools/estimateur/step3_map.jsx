// step3_map.jsx — combined Map + Pole placement, per-direction context
const { useState: uS3, useRef: uR3 } = React;

const TOOLS = ["select", "draw", "pole", "measure", "delete"];

function Step3Map() {
  const { t, state, parks, activePark, setActivePark, activeField, setActiveField, updateField } = useApp();
  const s = t.s3;

  const park = parks.find(p => p.id === activePark) || parks[0];
  const field = park ? (park.fields.find(f => f.id === activeField) || park.fields[0]) : null;

  const [tool, setTool] = uS3("select");
  const [drawing, setDrawing] = uS3(null);
  const [draggingPole, setDraggingPole] = uS3(null);
  const mapRef = uR3(null);

  if (!field) {
    return (
      <div className="page">
        <PageHead eyebrow="03 / 07" title={s.title} sub={s.sub} />
        <div className="card"><p className="muted">{state.lang === "fr" ? "Ajoutez d'abord un parc et un terrain à l'étape précédente." : "Add a park and a field in the previous step first."}</p></div>
        <NavRow />
      </div>
    );
  }

  const setF = (patch) => updateField(park.id, field.id, patch);

  const toPct = (e) => {
    const r = mapRef.current.getBoundingClientRect();
    return [
      Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))
    ];
  };

  const onClick = (e) => {
    if (draggingPole != null) return;
    if (tool === "draw") {
      const pt = toPct(e);
      setDrawing(d => d ? [...d, pt] : [pt]);
    } else if (tool === "pole") {
      const [x, y] = toPct(e);
      const id = Math.max(0, ...field.poles.map(p => p.id)) + 1;
      setF({ poles: [...field.poles, { id, x: +x.toFixed(1), y: +y.toFixed(1), height: 22, projectors: 4 }] });
    } else if (tool === "measure") {
      const [x, y] = toPct(e);
      const id = Math.max(0, ...field.measures.map(m => m.id)) + 1;
      setF({ measures: [...field.measures, { id, x: +x.toFixed(1), y: +y.toFixed(1) }] });
    }
  };

  const onDblClick = () => {
    if (tool === "draw" && drawing && drawing.length >= 3) {
      setF({ outline: drawing });
      setDrawing(null);
      setTool("select");
    }
  };

  const onPoleDown = (e, id) => { e.stopPropagation(); setDraggingPole(id); };
  const onMove = (e) => {
    if (draggingPole == null) return;
    const [x, y] = toPct(e);
    setF({ poles: field.poles.map(p => p.id === draggingPole ? { ...p, x: +x.toFixed(1), y: +y.toFixed(1) } : p) });
  };
  const onUp = () => setDraggingPole(null);
  const removePole = (id) => setF({ poles: field.poles.filter(p => p.id !== id) });
  const removeMeasure = (id) => setF({ measures: field.measures.filter(m => m.id !== id) });
  const updatePole = (id, patch) => setF({ poles: field.poles.map(p => p.id === id ? { ...p, ...patch } : p) });

  const setDirection = (dir, patch) => setF({ directions: { ...field.directions, [dir]: { ...field.directions[dir], ...patch } } });

  const polyPath = (pts) => "M " + pts.map(([x, y]) => `${x},${y}`).join(" L ") + " Z";
  const drawPath = drawing ? "M " + drawing.map(([x, y]) => `${x},${y}`).join(" L ") : null;

  // Direction edges: draw a small arrow per direction with mitigation indicator
  const dirIcons = { N: { x: 50, y: 4, ang: 0 }, E: { x: 96, y: 50, ang: 90 }, S: { x: 50, y: 96, ang: 180 }, W: { x: 4, y: 50, ang: 270 } };
  const ctxColor = (ctx) => ctx === "housing" ? "#B0463A" : ctx === "street" ? "#C99A3A" : "#9AB87E";

  const totalProtections = Object.values(field.directions || {}).filter(d => d.mitigation && d.mitigation !== "none").length;

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <PageHead eyebrow="03 / 07" title={s.title} sub={s.sub} actions={<button className="btn btn--solid btn--sm">{t.save}</button>} />

      {/* Park / Field switcher */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="field__label">{s.selectPark}</span>
          <select className="input" value={park.id} onChange={e => { setActivePark(e.target.value); const np = parks.find(p => p.id === e.target.value); if (np && np.fields[0]) setActiveField(np.fields[0].id); }}>
            {parks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="field__label">{s.selectField}</span>
          <select className="input" value={field.id} onChange={e => setActiveField(e.target.value)}>
            {park.fields.map(f => <option key={f.id} value={f.id}>{f.name} — {f.sport}</option>)}
          </select>
        </div>
      </div>

      <div className="split split--wide" style={{ flex: 1, minHeight: 0 }}>
        <div className="map" ref={mapRef} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
          {/* Satellite-ish background */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 80% at 50% 50%, #4A5C3A 0%, #2E3A28 60%, #1F2820 100%)`, backgroundColor: "#2E3A28" }} />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <pattern id="grass3" patternUnits="userSpaceOnUse" width="2" height="2">
                <rect width="2" height="2" fill="#3A4A30" />
                <circle cx="0.5" cy="0.5" r="0.15" fill="#4F6440" opacity="0.5" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#grass3)" opacity="0.6" />
            {/* Field markings */}
            <rect x="20" y="28" width="60" height="44" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.18" />
            <line x1="50" y1="28" x2="50" y2="72" stroke="rgba(255,255,255,0.3)" strokeWidth="0.18" />
            <circle cx="50" cy="50" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.18" />
          </svg>

          {/* Address bar */}
          <div className="map__addr">
            <span style={{ color: "#666", fontSize: 12 }}>📍</span>
            <input defaultValue={park.address} placeholder={state.lang === "fr" ? "Adresse du parc" : "Park address"} />
          </div>

          {/* Toolbar */}
          <div className="map__toolbar">
            <button className={`btn btn--sm ${tool === "select" ? "btn--solid" : "btn--ghost"}`} onClick={() => setTool("select")}>↖ {state.lang === "fr" ? "Sélect." : "Select"}</button>
            <button className={`btn btn--sm ${tool === "draw" ? "btn--solid" : "btn--ghost"}`} onClick={() => { setTool("draw"); setDrawing(null); }}>✏ {s.tools.draw}</button>
            <button className={`btn btn--sm ${tool === "pole" ? "btn--solid" : "btn--ghost"}`} onClick={() => setTool("pole")}>● {s.tools.pole}</button>
            <button className={`btn btn--sm ${tool === "measure" ? "btn--solid" : "btn--ghost"}`} onClick={() => setTool("measure")}>◇ {s.tools.measure}</button>
          </div>

          {/* Click area */}
          <div className={`map__draw ${tool === "select" ? "map__draw--off" : ""}`} onClick={onClick} onDoubleClick={onDblClick} />

          {/* Polygon outline + drawing preview */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="poly-svg">
            {field.outline && field.outline.length >= 3 && (
              <g>
                <path d={polyPath(field.outline)} fill="rgba(232,163,61,0.22)" stroke="#E8A33D" strokeWidth="0.3" />
                {field.outline.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.7" fill="#fff" stroke="#E8A33D" strokeWidth="0.25" />)}
              </g>
            )}
            {drawPath && (
              <g>
                <path d={drawPath} fill="rgba(232,163,61,0.18)" stroke="#E8A33D" strokeWidth="0.3" strokeDasharray="0.6,0.4" />
                {drawing.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.8" fill="#fff" stroke="#E8A33D" strokeWidth="0.3" />)}
              </g>
            )}
            {/* Direction badges */}
            {Object.entries(dirIcons).map(([dir, pos]) => {
              const d = field.directions?.[dir] || { context: "open", mitigation: "none" };
              const color = ctxColor(d.context);
              const showBadge = d.mitigation !== "none";
              return (
                <g key={dir}>
                  <circle cx={pos.x} cy={pos.y} r="2.5" fill={color} stroke="#fff" strokeWidth="0.3" />
                  <text x={pos.x} y={pos.y + 0.9} textAnchor="middle" style={{ fontSize: 2.6, fill: "#fff", fontWeight: 700 }}>{dir}</text>
                  {showBadge && <circle cx={pos.x + 2.4} cy={pos.y - 2.2} r="1" fill="#fff" stroke="#B0463A" strokeWidth="0.25" />}
                </g>
              );
            })}
          </svg>

          {/* Measure points */}
          {field.measures.map(m => (
            <div key={m.id} title={`Mesure ${m.id}`} onContextMenu={(e) => { e.preventDefault(); removeMeasure(m.id); }} style={{
              position: "absolute", left: `${m.x}%`, top: `${m.y}%`,
              width: 16, height: 16, transform: "translate(-50%,-50%) rotate(45deg)",
              background: "rgba(255,255,255,0.92)", border: "2px solid #E8A33D",
              cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
            }} />
          ))}

          {/* Pole markers */}
          {field.poles.map(p => (
            <div key={p.id} className={`pole-marker ${draggingPole === p.id ? "is-dragging" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onMouseDown={(e) => onPoleDown(e, p.id)}
              onContextMenu={(e) => { e.preventDefault(); removePole(p.id); }}
              title={`${state.lang === "fr" ? "Fût" : "Pole"} ${p.id} · ${p.height}m · ${p.projectors} proj.`}
            >{p.id}</div>
          ))}

          <div className="map__legend" style={{ pointerEvents: "none" }}>
            <b>{park.name}</b> — {field.name}<br />
            <span style={{ opacity: 0.7 }}>{tool === "draw" ? s.legend : (state.lang === "fr" ? "Clic-droit pour supprimer un fût ou un point" : "Right-click to delete a pole or point")}</span>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="col" style={{ overflow: "auto" }}>
          <div className="kpis">
            <div className="kpi"><div className="kpi__lbl">{s.totalPoles}</div><div className="kpi__val">{field.poles.length}</div></div>
            <div className="kpi"><div className="kpi__lbl">{s.totalMeasures}</div><div className="kpi__val">{field.measures.length}</div></div>
            <div className="kpi"><div className="kpi__lbl">{s.totalProtections}</div><div className="kpi__val">{totalProtections}</div></div>
          </div>

          {/* Per-direction context */}
          <div className="card">
            <h3 className="card__title">{s.protections}</h3>
            <table className="tbl" style={{ border: 0 }}>
              <thead>
                <tr>
                  <th>{s.direction}</th>
                  <th>{s.contextLabel}</th>
                  <th>{s.mitigation}</th>
                </tr>
              </thead>
              <tbody>
                {["N", "E", "S", "W"].map(dir => {
                  const d = field.directions?.[dir] || { context: "open", mitigation: "none" };
                  return (
                    <tr key={dir}>
                      <td><span style={{ display: "inline-block", width: 24, height: 24, borderRadius: "50%", background: ctxColor(d.context), color: "#fff", textAlign: "center", lineHeight: "24px", fontSize: 11, fontWeight: 700 }}>{dir}</span> <span style={{ marginLeft: 6, fontSize: 12 }}>{s.directions[dir]}</span></td>
                      <td>
                        <select className="input--ghost" value={d.context} onChange={e => setDirection(dir, { context: e.target.value })} style={{ width: "100%" }}>
                          <option value="open">{s.ctxOpen}</option>
                          <option value="street">{s.ctxStreet}</option>
                          <option value="housing">{s.ctxHousing}</option>
                        </select>
                      </td>
                      <td>
                        <select className="input--ghost" value={d.mitigation} onChange={e => setDirection(dir, { mitigation: e.target.value })} style={{ width: "100%" }}>
                          <option value="none">—</option>
                          <option value="visor">{s.mitVisor}</option>
                          <option value="narrow">{s.mitNarrow}</option>
                          <option value="both">{s.mitBoth}</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pole list */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: "14px 18px" }}><h3 className="card__title" style={{ margin: 0 }}>{s.tableTitle}</h3></div>
            <table className="tbl" style={{ border: 0 }}>
              <thead>
                <tr><th style={{ width: 40 }}>#</th><th className="num">{s.cols.height}</th><th className="num">{s.cols.projectors}</th><th style={{ width: 30 }}></th></tr>
              </thead>
              <tbody>
                {field.poles.map(p => (
                  <tr key={p.id}>
                    <td><b>{p.id}</b></td>
                    <td className="num"><input className="input--ghost num" type="number" value={p.height} onChange={e => updatePole(p.id, { height: +e.target.value })} style={{ width: 50, textAlign: "right" }} /></td>
                    <td className="num"><input className="input--ghost num" type="number" value={p.projectors} onChange={e => updatePole(p.id, { projectors: +e.target.value })} style={{ width: 40, textAlign: "right" }} /></td>
                    <td><button className="btn btn--ghost btn--sm" onClick={() => removePole(p.id)} title={t.remove}>×</button></td>
                  </tr>
                ))}
                {field.poles.length === 0 && <tr><td colSpan="4" className="muted" style={{ fontSize: 12, padding: 14 }}>{state.lang === "fr" ? "Aucun fût. Sélectionnez l'outil « Placer fût » et cliquez sur la carte." : "No pole yet. Pick the \"Place pole\" tool and click the map."}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NavRow />
    </div>
  );
}
Object.assign(window, { Step3Map });
