// app.jsx — Root, mounts step views (7-step flow)
function App() {
  const { state } = useApp();
  const i = state.currentStep;
  let StepView;
  if (i === 0) StepView = <Step1Setup />;
  else if (i === 1) StepView = <Step2Parks />;
  else if (i === 2) StepView = <Step3Map />;
  else if (i === 3) StepView = <Step4Config />;
  else if (i === 4) StepView = <Step5Bilan />;
  else if (i === 5) StepView = <Step6OSE />;
  else StepView = <Step7Send />;

  return (
    <div className="app">
      <Topbar />
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: 0 }}>
        <Stepper />
        <div style={{ minHeight: 0, overflow: "hidden" }}>{StepView}</div>
      </div>
    </div>
  );
}

function Root() {
  return <StateProvider><App /></StateProvider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
