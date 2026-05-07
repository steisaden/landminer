import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarCheck, CheckCircle2, FileText, Home, MapPin, MessageSquare, Sparkles, Users } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const learningSteps = [
  {
    title: "1. Build your lead pipeline",
    description: "Add leads manually, import CSVs, or save them from the map so every contact lives in one place.",
    icon: Users,
    accent: "emerald",
  },
  {
    title: "2. Find opportunities fast",
    description: "Scan civic signals on the Opportunities page, then convert strong matches into leads.",
    icon: Sparkles,
    accent: "amber",
  },
  {
    title: "3. Work your market visually",
    description: "Use the map to inspect nearby deals, toggle the heatmap, and zoom into a neighborhood.",
    icon: MapPin,
    accent: "blue",
  },
  {
    title: "4. Stay on top of follow-ups",
    description: "Follow-up reminders, notes, and AI drafting keep conversations moving every day.",
    icon: CalendarCheck,
    accent: "slate",
  },
] as const;

const workspaceCards = [
  {
    title: "Dashboard",
    href: "/",
    description: "Your daily command center for active leads, signals, and overdue follow-ups.",
    icon: Home,
  },
  {
    title: "Lead Inbox",
    href: "/leads",
    description: "Capture sellers, add notes, and move conversations through the pipeline.",
    icon: Users,
  },
  {
    title: "Opportunities",
    href: "/opportunities",
    description: "Review civic data and convert distressed properties into real leads.",
    icon: Sparkles,
  },
  {
    title: "Property Map",
    href: "/map",
    description: "See nearby deals, search an area, and inspect properties visually.",
    icon: MapPin,
  },
  {
    title: "Follow-Ups",
    href: "/follow-ups",
    description: "Keep your next touch points organized so nothing falls through the cracks.",
    icon: CalendarCheck,
  },
  {
    title: "AI & Docs",
    href: "/ask",
    description: "Draft outreach, review contracts, and work faster with the built-in assistant.",
    icon: MessageSquare,
  },
];

export default function Onboarding() {
  const { setOnboardingData, businessName: savedBusinessName, focus: savedFocus, followUpStyle: savedFollowUpStyle, cadence: savedCadence } = useAppStore();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState(savedBusinessName || "");
  const [focus, setFocus] = useState(savedFocus || "Vacant houses");
  const [followUpStyle, setFollowUpStyle] = useState(savedFollowUpStyle || "Friendly");
  const [cadence, setCadence] = useState(savedCadence || "7");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await setOnboardingData(
        {
          businessName,
          focus,
          followUpStyle,
          cadence,
        },
        true
      );
      navigate("/");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            <Home className="h-3.5 w-3.5" />
            Welcome to LandMiner CRM
          </div>

          <div className="mt-5 max-w-2xl">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Set up your workspace and learn the CRM in a few minutes.
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              We’ll capture your basics, then show you exactly where to find leads, scan opportunities, work the map,
              and stay on top of follow-ups.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {learningSteps.map((step) => {
              const Icon = step.icon;
              const styles = {
                emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
                amber: "bg-amber-50 text-amber-700 border-amber-100",
                blue: "bg-blue-50 text-blue-700 border-blue-100",
                slate: "bg-slate-50 text-slate-700 border-slate-200",
              }[step.accent];

              return (
                <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${styles}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-600 p-2 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-blue-950">Your first workflow</h2>
                <p className="mt-1 text-sm leading-6 text-blue-900/80">
                  Add or import leads, review opportunities, inspect properties on the map, then schedule follow-ups so
                  every deal has a next step.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workspaceCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        After onboarding: {card.href}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
              <Home className="h-7 w-7 text-white" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">Set up your CRM</h2>
            <p className="mt-2 text-sm text-slate-500">Start with the basics. You can refine everything later in Settings.</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Business Name</label>
                <input
                  required
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition-colors focus:border-blue-500"
                  placeholder="e.g. Fast Cash Offers"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Wholesaling Focus</label>
                <select
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition-colors focus:border-blue-500"
                >
                  <option>Vacant houses</option>
                  <option>Tax delinquent</option>
                  <option>Probate</option>
                  <option>Tired landlords</option>
                  <option>Driving for dollars</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Default Follow-up Style</label>
                <select
                  value={followUpStyle}
                  onChange={(e) => setFollowUpStyle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition-colors focus:border-blue-500"
                >
                  <option value="Friendly">Soft and friendly</option>
                  <option value="Professional">Direct and professional</option>
                  <option value="Urgent">Urgent and sales-focused</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Default Follow-up Cadence</label>
                <select
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition-colors focus:border-blue-500"
                >
                  <option value="2">2 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-900">What happens after you finish?</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  You’ll land on the Dashboard with your live CRM overview.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  The sidebar gives you quick access to Leads, Opportunities, Map, and Follow-Ups.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  You can edit these defaults anytime in Settings.
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving setup..." : "Finish Setup & Open Dashboard"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-xs text-slate-500">
              This takes less than two minutes and only sets your starting defaults.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
