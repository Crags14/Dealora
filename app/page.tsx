"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Calculator,
  Building2,
  DollarSign,
  LineChart,
  Save,
  Trash2,
  Home,
  ArrowRight,
  Download,
  RefreshCcw,
} from "lucide-react";

type DealForm = {
  id?: number;
  name: string;
  purchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  amortYears: number;
  monthlyCosts: number;
  adr: number;
  occupancy: number;
  otherMonthlyIncome: number;
};

type Lead = {
  name: string;
  email: string;
};

const STORAGE_KEY = "dealora_saved_deals_v1";
const LAST_FORM_KEY = "dealora_last_form_v1";
const LEADS_KEY = "dealora_beta_leads_v1";

const starterScenarios: DealForm[] = [
  {
    id: 1,
    name: "Blue Mountain Chalet",
    purchasePrice: 925000,
    downPaymentPct: 25,
    interestRate: 5.2,
    amortYears: 25,
    monthlyCosts: 2600,
    adr: 410,
    occupancy: 58,
    otherMonthlyIncome: 0,
  },
  {
    id: 2,
    name: "Prince Edward County Loft",
    purchasePrice: 690000,
    downPaymentPct: 20,
    interestRate: 5.4,
    amortYears: 25,
    monthlyCosts: 1950,
    adr: 295,
    occupancy: 64,
    otherMonthlyIncome: 0,
  },
];

const initialForm: DealForm = {
  name: "My New Deal",
  purchasePrice: 850000,
  downPaymentPct: 20,
  interestRate: 5.5,
  amortYears: 25,
  monthlyCosts: 2200,
  adr: 325,
  occupancy: 62,
  otherMonthlyIncome: 0,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function calculateMetrics(form: DealForm) {
  const safeForm = {
    ...form,
    purchasePrice: Number(form.purchasePrice) || 0,
    downPaymentPct: Number(form.downPaymentPct) || 0,
    interestRate: Number(form.interestRate) || 0,
    amortYears: Number(form.amortYears) || 25,
    monthlyCosts: Number(form.monthlyCosts) || 0,
    adr: Number(form.adr) || 0,
    occupancy: Number(form.occupancy) || 0,
    otherMonthlyIncome: Number(form.otherMonthlyIncome) || 0,
  };

  const loanAmount = safeForm.purchasePrice * (1 - safeForm.downPaymentPct / 100);
  const monthlyRate = safeForm.interestRate / 100 / 12;
  const totalPayments = safeForm.amortYears * 12;

  const monthlyMortgage =
    monthlyRate > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1)
      : totalPayments > 0
        ? loanAmount / totalPayments
        : 0;

  const monthlyRevenue =
    safeForm.adr * 30 * (safeForm.occupancy / 100) + safeForm.otherMonthlyIncome;
  const totalMonthlyExpenses = monthlyMortgage + safeForm.monthlyCosts;
  const monthlyCashFlow = monthlyRevenue - totalMonthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  const cashInvested = safeForm.purchasePrice * (safeForm.downPaymentPct / 100);
  const cashOnCash = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;
  const dscr =
    monthlyMortgage > 0
      ? (monthlyRevenue - safeForm.monthlyCosts) / monthlyMortgage
      : 0;
  const breakEvenOccupancy =
    safeForm.adr > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((totalMonthlyExpenses - safeForm.otherMonthlyIncome) /
              (safeForm.adr * 30)) *
              100
          )
        )
      : 0;

  const score = [
    safeForm.occupancy >= 60 ? 25 : safeForm.occupancy >= 50 ? 18 : 10,
    cashOnCash >= 8 ? 25 : cashOnCash >= 4 ? 18 : 10,
    dscr >= 1.25 ? 25 : dscr >= 1 ? 18 : 8,
    monthlyCashFlow >= 500 ? 25 : monthlyCashFlow >= 0 ? 18 : 6,
  ].reduce((a, b) => a + b, 0);

  const scoreLabel =
    score >= 85 ? "Excellent" : score >= 70 ? "Strong" : score >= 55 ? "Average" : "Weak";

  return {
    loanAmount,
    monthlyMortgage,
    monthlyRevenue,
    totalMonthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    cashInvested,
    cashOnCash,
    dscr,
    breakEvenOccupancy,
    score,
    scoreLabel,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

const pct = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(1)}%`;

function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-[2rem] border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

function Button({
  className = "",
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  variant?: "default" | "outline" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition",
        variant === "default" && "bg-slate-900 text-white hover:bg-slate-800",
        variant === "outline" && "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
        variant === "ghost" && "bg-transparent text-slate-700 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}

function Badge({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700",
        className
      )}
    >
      {children}
    </span>
  );
}

function SectionTitle({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          {Icon ? <Icon className="h-5 w-5" /> : null}
          {title}
        </div>
        {description ? <div className="mt-1 text-sm text-slate-500">{description}</div> : null}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix = "",
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 w-full rounded-2xl border border-slate-300 px-4 pr-12 outline-none transition focus:border-slate-400"
        />
        {suffix ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-400"
      />
    </label>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card className="rounded-3xl">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">{title}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
            <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DealoraPage() {
  const [activeTab, setActiveTab] = React.useState<"analyzer" | "saved" | "pricing" | "beta">(
    "analyzer"
  );
  const [hydrated, setHydrated] = React.useState(false);
  const [form, setForm] = React.useState<DealForm>(initialForm);
  const [savedDeals, setSavedDeals] = React.useState<DealForm[]>(starterScenarios);
  const [lead, setLead] = React.useState<Lead>({ name: "", email: "" });
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    try {
      const storedDeals = localStorage.getItem(STORAGE_KEY);
      const storedForm = localStorage.getItem(LAST_FORM_KEY);

      if (storedDeals) {
        const parsedDeals = JSON.parse(storedDeals);
        if (Array.isArray(parsedDeals) && parsedDeals.length) {
          setSavedDeals(parsedDeals);
        }
      }

      if (storedForm) {
        const parsedForm = JSON.parse(storedForm);
        if (parsedForm && typeof parsedForm === "object") {
          setForm(parsedForm);
        }
      }
    } catch {
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDeals));
  }, [savedDeals, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LAST_FORM_KEY, JSON.stringify(form));
  }, [form, hydrated]);

  const metrics = React.useMemo(() => calculateMetrics(form), [form]);

  const updateField = <K extends keyof DealForm>(key: K, value: DealForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const flashMessage = (text: string, ms = 2200) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), ms);
  };

  const saveScenario = () => {
    const trimmedName = (form.name || "").trim() || `Deal ${savedDeals.length + 1}`;
    const newDeal: DealForm = { ...form, name: trimmedName, id: Date.now() };
    setSavedDeals((prev) => [newDeal, ...prev]);
    flashMessage(`Saved ${trimmedName}.`);
  };

  const loadScenario = (deal: DealForm) => {
    setForm(deal);
    setActiveTab("analyzer");
    flashMessage(`Loaded ${deal.name}.`);
  };

  const deleteScenario = (id?: number) => {
    setSavedDeals((prev) => prev.filter((d) => d.id !== id));
  };

  const resetForm = () => {
    setForm(initialForm);
    flashMessage("Form reset.");
  };

  const exportDeals = () => {
    downloadJson("dealora-scenarios.json", savedDeals);
  };

  const exportCurrent = () => {
    downloadJson("dealora-current-deal.json", { ...form, metrics });
  };

  const submitLead = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lead.name || !lead.email) {
      flashMessage("Enter a name and email first.");
      return;
    }

    const allLeads = JSON.parse(localStorage.getItem(LEADS_KEY) || "[]");
    allLeads.push({ ...lead, createdAt: new Date().toISOString() });
    localStorage.setItem(LEADS_KEY, JSON.stringify(allLeads));
    setLead({ name: "", email: "" });
    flashMessage("Lead captured locally. Connect this to Formspree or Supabase next.", 3000);
  };

  const chartData = [
    { name: "Revenue", value: Math.round(metrics.monthlyRevenue) },
    { name: "Mortgage", value: Math.round(metrics.monthlyMortgage) },
    { name: "Other Costs", value: Math.round(form.monthlyCosts) },
    { name: "Cash Flow", value: Math.round(metrics.monthlyCashFlow) },
  ];

  const compareData = savedDeals.slice(0, 6).map((deal) => {
    const m = calculateMetrics(deal);
    return {
      name: deal.name.length > 14 ? `${deal.name.slice(0, 14)}…` : deal.name,
      score: m.score,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Badge>Dealora Deployable MVP</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Analyze STR deals in minutes.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              A free deployable MVP for your side hustle. It includes browser persistence,
              saved scenarios, simple lead capture, exports, and a clean SaaS-style experience.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => setActiveTab("analyzer")}>
                Start analyzing <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("pricing")}>
                See pricing
              </Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Built for</div>
                <div className="mt-1 font-medium">Investors, agents, wholesalers</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Deploy target</div>
                <div className="mt-1 font-medium">Vercel or Netlify</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Persistence</div>
                <div className="mt-1 font-medium">Local storage enabled</div>
              </div>
            </div>
            {message ? (
              <div className="mt-5 inline-block rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <Card>
              <div className="p-6">
                <SectionTitle
                  title="Current deal snapshot"
                  description="Investor-style summary for the active scenario."
                  icon={Building2}
                />
                <div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-slate-500">{form.name}</span>
                    <span className="text-4xl font-bold">{metrics.score}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                    <span>{metrics.scoreLabel}</span>
                    <span>/ 100</span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${metrics.score}%` }}
                    />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Monthly Cash Flow</div>
                    <div className="mt-1 text-xl font-semibold">{fmt(metrics.monthlyCashFlow)}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Cash-on-Cash</div>
                    <div className="mt-1 text-xl font-semibold">{pct(metrics.cashOnCash)}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">DSCR</div>
                    <div className="mt-1 text-xl font-semibold">{metrics.dscr.toFixed(2)}</div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">Break-even Occ.</div>
                    <div className="mt-1 text-xl font-semibold">{pct(metrics.breakEvenOccupancy)}</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            ["analyzer", "Analyzer"],
            ["saved", "Saved Deals"],
            ["pricing", "Pricing"],
            ["beta", "Lead Capture"],
          ].map(([key, label]) => (
            <Button
              key={key}
              variant={activeTab === key ? "default" : "outline"}
              onClick={() => setActiveTab(key as typeof activeTab)}
            >
              {label}
            </Button>
          ))}
        </div>

        {activeTab === "analyzer" && (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="p-6">
                <SectionTitle
                  title="Deal inputs"
                  description="Edit assumptions and the metrics update instantly."
                  icon={Calculator}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <TextField
                      label="Scenario Name"
                      value={form.name}
                      onChange={(v) => updateField("name", v)}
                    />
                  </div>
                  <NumberField
                    label="Purchase Price"
                    value={form.purchasePrice}
                    onChange={(v) => updateField("purchasePrice", v)}
                  />
                  <NumberField
                    label="Down Payment"
                    value={form.downPaymentPct}
                    onChange={(v) => updateField("downPaymentPct", v)}
                    suffix="%"
                    step={0.5}
                  />
                  <NumberField
                    label="Interest Rate"
                    value={form.interestRate}
                    onChange={(v) => updateField("interestRate", v)}
                    suffix="%"
                    step={0.1}
                  />
                  <NumberField
                    label="Amortization"
                    value={form.amortYears}
                    onChange={(v) => updateField("amortYears", v)}
                    suffix="yrs"
                  />
                  <NumberField
                    label="Monthly Non-Mortgage Costs"
                    value={form.monthlyCosts}
                    onChange={(v) => updateField("monthlyCosts", v)}
                  />
                  <NumberField
                    label="ADR"
                    value={form.adr}
                    onChange={(v) => updateField("adr", v)}
                  />
                  <NumberField
                    label="Occupancy"
                    value={form.occupancy}
                    onChange={(v) => updateField("occupancy", v)}
                    suffix="%"
                  />
                  <NumberField
                    label="Other Monthly Income"
                    value={form.otherMonthlyIncome}
                    onChange={(v) => updateField("otherMonthlyIncome", v)}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={saveScenario}>
                    <Save className="h-4 w-4" /> Save scenario
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <RefreshCcw className="h-4 w-4" /> Reset
                  </Button>
                  <Button variant="outline" onClick={exportCurrent}>
                    <Download className="h-4 w-4" /> Export current
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard
                  icon={DollarSign}
                  title="Monthly Revenue"
                  value={fmt(metrics.monthlyRevenue)}
                  subtitle="ADR × 30 × occupancy"
                />
                <StatCard
                  icon={Home}
                  title="Monthly Mortgage"
                  value={fmt(metrics.monthlyMortgage)}
                  subtitle="Estimated payment"
                />
                <StatCard
                  icon={LineChart}
                  title="Annual Cash Flow"
                  value={fmt(metrics.annualCashFlow)}
                  subtitle="12-month estimate"
                />
                <StatCard
                  icon={Building2}
                  title="Capital Required"
                  value={fmt(metrics.cashInvested)}
                  subtitle="Down payment only"
                />
              </div>

              <Card>
                <div className="p-6">
                  <SectionTitle
                    title="Monthly economics"
                    description="Quick visual of the current scenario."
                  />
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis
                          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip formatter={(value) => fmt(Number(value))} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <SectionTitle
                    title="Quick verdict"
                    description="Simple beta-user interpretation."
                  />
                  <div className="space-y-3 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-900">Score:</span>{" "}
                      {metrics.score}/100 — {metrics.scoreLabel}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Cash flow:</span>{" "}
                      {metrics.monthlyCashFlow >= 0
                        ? "Modeled as cash-flow positive."
                        : "Modeled as cash-flow negative."}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Debt coverage:</span>{" "}
                      {metrics.dscr >= 1.25
                        ? "Healthy by a conservative lender lens."
                        : metrics.dscr >= 1
                          ? "Acceptable but not strong."
                          : "Weak under these assumptions."}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Break-even occupancy:</span>{" "}
                      {pct(metrics.breakEvenOccupancy)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "saved" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <Card>
              <div className="p-6">
                <SectionTitle
                  title="Saved deal scenarios"
                  description="Persisted in the browser so you can test the MVP live."
                  icon={Save}
                />
                <div className="mb-4 flex gap-3">
                  <Button variant="outline" onClick={exportDeals}>
                    <Download className="h-4 w-4" /> Export all
                  </Button>
                </div>
                <div className="space-y-4">
                  {savedDeals.map((deal) => {
                    const m = calculateMetrics(deal);
                    return (
                      <div
                        key={deal.id}
                        className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <div className="font-medium">{deal.name}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {fmt(deal.purchasePrice)} · ADR {fmt(deal.adr)} · Occ {pct(deal.occupancy)}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                            <Badge>Score {m.score}</Badge>
                            <Badge>CoC {pct(m.cashOnCash)}</Badge>
                            <Badge>CF {fmt(m.monthlyCashFlow)}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => loadScenario(deal)}>
                            Load
                          </Button>
                          <Button variant="outline" onClick={() => deleteScenario(deal.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {!savedDeals.length && (
                    <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
                      No saved deals yet.
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <SectionTitle
                  title="Scenario comparison"
                  description="Basic comparison chart for demo calls and sales conversations."
                />
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="score" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "$0",
                desc: "For validation and beta testing.",
                features: ["Manual deal entry", "Instant score", "Local saved scenarios"],
              },
              {
                name: "Investor",
                price: "$19/mo",
                desc: "Most likely first paid plan.",
                features: ["Unlimited deals", "Scenario exports", "Printable reports"],
              },
              {
                name: "Pro",
                price: "$49/mo",
                desc: "For agents and serious operators.",
                features: ["Team sharing", "Branded reports", "Market templates"],
              },
            ].map((tier) => (
              <Card key={tier.name}>
                <div className="p-6">
                  <SectionTitle title={tier.name} description={tier.desc} />
                  <div className="text-3xl font-semibold">{tier.price}</div>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    {tier.features.map((f) => (
                      <div key={f} className="rounded-2xl bg-slate-50 p-3">
                        {f}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="mt-6 w-full"
                    variant={tier.name == "Investor" ? "default" : "outline"}
                  >
                    Choose {tier.name}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "beta" && (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <div className="p-6">
                <SectionTitle
                  title="Lead capture"
                  description="A simple placeholder waitlist form you can hook into a real backend later."
                />
                <form onSubmit={submitLead} className="space-y-4">
                  <TextField
                    label="Name"
                    value={lead.name}
                    onChange={(v) => setLead((p) => ({ ...p, name: v }))}
                  />
                  <TextField
                    label="Email"
                    value={lead.email}
                    onChange={(v) => setLead((p) => ({ ...p, email: v }))}
                  />
                  <Button type="submit" className="w-full">
                    Join beta list
                  </Button>
                </form>
                <div className="mt-4 text-sm text-slate-500">
                  This currently stores leads in local storage. For production, connect it to
                  Formspree, Supabase, Airtable, or Firebase.
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <SectionTitle
                  title="Deployment notes"
                  description="This version is ready to drop into a Next.js app and deploy."
                />
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">1. Run npm install</div>
                  <div className="rounded-2xl bg-slate-50 p-4">2. Run npm run dev locally</div>
                  <div className="rounded-2xl bg-slate-50 p-4">3. Push the repo to GitHub</div>
                  <div className="rounded-2xl bg-slate-50 p-4">4. Import the repo into Vercel</div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    5. Later, swap local storage for Supabase or Firebase
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
