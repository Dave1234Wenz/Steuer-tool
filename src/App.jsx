import React, { useMemo, useState, useEffect } from "react";

const fmt = (n) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

const pct = (n) => `${(n * 100).toFixed(2)} %`;

function Section({ title, children, subtitle, actions }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function NumberInput({ label, value, onChange, step = 1, min = 0, suffix, hint, disabled = false }) {
  return (
    <label className="block">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div
        className={`mt-1 flex items-center rounded-xl border bg-white overflow-hidden ${
          disabled ? "opacity-60" : ""
        } border-slate-300 focus-within:ring-2 focus-within:ring-slate-400`}
      >
        <input
          type="number"
          step={step}
          min={min}
          className="w-full px-3 py-2 outline-none text-slate-800"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value || "0"))}
          disabled={disabled}
        />
        {suffix && (
          <span className="px-3 py-2 text-slate-500 bg-slate-50 border-l border-slate-200">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 select-none">
      <span className="text-sm text-slate-600">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-slate-900" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

/* ---------- Tool 1: Holding-Rechner ---------- */
function HoldingRechner() {
  const AVG = {
    dividend: 200000,
    kStRate: 0.15,
    soliRate: 0.055,
    gewStRate: 0.14,
    hasTradeTaxExemption: true,
  };

  const [useAvg, setUseAvg] = useState(true);
  const [dividend, setDividend] = useState(AVG.dividend);
  const [hasTradeTaxExemption, setTradeTaxExemption] = useState(AVG.hasTradeTaxExemption);
  const [kStRate, setKStRate] = useState(AVG.kStRate);
  const [soliRate, setSoliRate] = useState(AVG.soliRate);
  const [gewStRate, setGewStRate] = useState(AVG.gewStRate);

  useEffect(() => {
    if (useAvg) {
      setDividend(AVG.dividend);
      setTradeTaxExemption(AVG.hasTradeTaxExemption);
      setKStRate(AVG.kStRate);
      setSoliRate(AVG.soliRate);
      setGewStRate(AVG.gewStRate);
    }
  }, [useAvg]);

  const results = useMemo(() => {
    const taxablePortion = dividend * 0.05;
    const kst = taxablePortion * kStRate;
    const soli = kst * soliRate;
    const gewst = hasTradeTaxExemption ? 0 : taxablePortion * gewStRate;
    const totalTax = kst + soli + gewst;
    const netToHolding = dividend - totalTax;
    const effTaxRate = totalTax / dividend || 0;
    return { taxablePortion, kst, soli, gewst, totalTax, netToHolding, effTaxRate };
  }, [dividend, hasTradeTaxExemption, kStRate, soliRate, gewStRate]);

  return (
    <Section
      title="Holding-Struktur-Rechner"
      subtitle="Effektive Steuerbelastung gem. § 8b KStG (95 % steuerfrei). Durchschnittswerte/Näherungen."
      actions={<Toggle label="Durchschnittswerte verwenden" checked={useAvg} onChange={setUseAvg} />}
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <NumberInput label="Dividende an die Holding" value={dividend} onChange={setDividend} step={1000} suffix="€" disabled={useAvg} hint="Durchschnitt" />
          <NumberInput label="Körperschaftsteuer (KSt)" value={kStRate} onChange={setKStRate} step={0.005} suffix="Quote" hint="Ø 15%" disabled={useAvg} />
          <NumberInput label="Soli auf KSt" value={soliRate} onChange={setSoliRate} step={0.001} suffix="Quote" hint="Ø 5,5%" disabled={useAvg} />
          <NumberInput label="Gewerbesteuer (falls nicht befreit)" value={gewStRate} onChange={setGewStRate} step={0.005} suffix="Quote" hint="Ø 14%" disabled={useAvg} />
          <Toggle label="≥ 15% Beteiligung (GewSt-Befreiung)" checked={hasTradeTaxExemption} onChange={setTradeTaxExemption} />
        </div>
        <div className="md:col-span-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-500">Steuerpflichtiger Anteil (5%)</div>
              <div className="text-2xl font-semibold">{fmt(results.taxablePortion)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-500">KSt + Soli (auf 5%)</div>
              <div className="text-2xl font-semibold">{fmt(results.kst + results.soli)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-500">Gewerbesteuer (falls fällig)</div>
              <div className="text-2xl font-semibold">{fmt(results.gewst)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-500">Effektive Steuerquote</div>
              <div className="text-2xl font-semibold">{pct(results.effTaxRate)}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
              <div className="text-sm text-slate-500">Nettozufluss zur Holding</div>
              <div className="text-3xl font-bold">{fmt(results.netToHolding)}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Hinweis: Vereinfachtes Modell. Keine Steuerberatung.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ---------- Tool 2: Geschäftsführer-Optimierungs-Check ---------- */
function GfOptimierung() {
  const AVG = {
    bruttoGehalt: 180000,
    dividende: 150000,
    persEStRate: 0.35,
    kirchensteuer: 0.085,
    arbeitnehmerSV: 0.2,
    soliRate: 0.055,
    abgeltungOpt: false,
  };

  const [useAvg, setUseAvg] = useState(true);
  const [bruttoGehalt, setBruttoGehalt] = useState(AVG.bruttoGehalt);
  const [persEStRate, setPersEStRate] = useState(AVG.persEStRate);
  const [kirchensteuer, setKirchensteuer] = useState(AVG.kirchensteuer);
  const [abgeltungOpt, setAbgeltungOpt] = useState(AVG.abgeltungOpt);
  const [dividende, setDividende] = useState(AVG.dividende);
  const soliRate = AVG.soliRate;
  const [arbeitnehmerSV, setArbeitnehmerSV] = useState(AVG.arbeitnehmerSV);

  useEffect(() => {
    if (useAvg) {
      setBruttoGehalt(AVG.bruttoGehalt);
      setPersEStRate(AVG.persEStRate);
      setKirchensteuer(AVG.kirchensteuer);
      setAbgeltungOpt(AVG.abgeltungOpt);
      setDividende(AVG.dividende);
      setArbeitnehmerSV(AVG.arbeitnehmerSV);
    }
  }, [useAvg]);

  const salaryNet = useMemo(() => {
    const sv = bruttoGehalt * arbeitnehmerSV;
    const taxable = Math.max(0, bruttoGehalt - sv);
    const est = taxable * persEStRate;
    const soli = est * soliRate;
    const kirche = est * kirchensteuer;
    const netto = bruttoGehalt - sv - est - soli - kirche;
    return { sv, est, soli, kirche, netto };
  }, [bruttoGehalt, arbeitnehmerSV, persEStRate, kirchensteuer]);

  const distributionNet = useMemo(() => {
    if (abgeltungOpt) {
      const kapst = dividende * 0.25;
      const soli = kapst * soliRate;
      const kirche = kapst * kirchensteuer;
      const netto = dividende - kapst - soli - kirche;
      return { kapst, soli, kirche, netto, mode: "Abgeltungsteuer 25%" };
    } else {
      const steuerbasis = dividende * 0.6;
      const est = steuerbasis * persEStRate;
      const soli = est * soliRate;
      const kirche = est * kirchensteuer;
      const netto = dividende - est - soli - kirche;
      return { est, soli, kirche, netto, mode: "Teileinkünfteverfahren (60%)" };
    }
  }, [dividende, abgeltungOpt, persEStRate, kirchensteuer]);

  return (
    <Section
      title="Geschäftsführer-Optimierungs-Check"
      subtitle="Vergleich Netto aus Gehalt vs. Ausschüttung – Durchschnittswerte."
      actions={<Toggle label="Durchschnittswerte verwenden" checked={useAvg} onChange={setUseAvg} />}
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <NumberInput label="Bruttogehalt p.a." value={bruttoGehalt} onChange={setBruttoGehalt} step={1000} suffix="€" disabled={useAvg} />
          <NumberInput label="Dividende p.a." value={dividende} onChange={setDividende} step={1000} suffix="€" disabled={useAvg} />
          <NumberInput label="Grenzsteuersatz (persönlich)" value={persEStRate} onChange={setPersEStRate} step={0.01} suffix="Quote" disabled={useAvg} />
          <NumberInput label="Kirchensteuer" value={kirchensteuer} onChange={setKirchensteuer} step={0.01} suffix="Quote" disabled={useAvg} />
          <NumberInput label="AN-Sozialabgaben" value={arbeitnehmerSV} onChange={setArbeitnehmerSV} step={0.01} suffix="Quote" disabled={useAvg} />
          <Toggle label="Abgeltungsteuer (statt Teileinkünfte)" checked={abgeltungOpt} onChange={setAbgeltungOpt} />
        </div>
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-500">Netto aus Gehalt</div>
            <div className="text-3xl font-bold">{fmt(salaryNet.netto)}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-sm text-slate-500">Netto aus Ausschüttung</div>
            <div className="text-xs text-slate-500">{distributionNet.mode}</div>
            <div className="text-3xl font-bold mt-1">{fmt(distributionNet.netto)}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 sm:col-span-2">
            <div className="text-sm text-slate-600">Vergleich</div>
            <div className="mt-1 text-2xl font-semibold">
              {distributionNet.netto > salaryNet.netto ? (
                <span>🔹 Ausschüttung bringt aktuell {fmt(distributionNet.netto - salaryNet.netto)} mehr Netto</span>
              ) : (
                <span>🔹 Gehalt bringt aktuell {fmt(salaryNet.netto - distributionNet.netto)} mehr Netto</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="p-6">
        <h1 className="text-2xl font-bold">Digitale Steuer-Tools</h1>
        <p className="text-slate-600">Holding-Rechner & Geschäftsführer-Optimierung</p>
      </header>
      <main className="max-w-6xl mx-auto p-6 grid gap-6">
        <HoldingRechner />
        <GfOptimierung />
        <Section title="Disclaimer" subtitle="Bitte sichtbar auf der Seite lassen">
          <p className="text-sm text-slate-600">
            Dieses Tool ersetzt keine individuelle Steuerberatung. Ergebnisse sind Näherungen auf Basis typischer Durchschnittswerte.
          </p>
        </Section>
      </main>
      <footer className="p-6 text-xs text-slate-500">© {new Date().getFullYear()} – David Wenzel Steuerkanzlei</footer>
    </div>
  );
              }
