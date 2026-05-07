import { useNavigate } from "react-router-dom";
import { parseISO, isToday, isPast, formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { AddLeadDialog } from "../components/AddLeadDialog";
import { CheckCircle2, TrendingUp, Users, Calendar, AlertCircle, Building, MapPin, Sparkles, AlertTriangle, Hammer, MessageSquare } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const gettingStartedCards = [
  {
    title: "Lead Inbox",
    href: "/leads",
    description: "Add sellers, keep notes current, and move deals through the pipeline.",
    icon: Users,
  },
  {
    title: "Opportunities",
    href: "/opportunities",
    description: "Review civic signals and convert the best matches into leads.",
    icon: Sparkles,
  },
  {
    title: "Property Map",
    href: "/map",
    description: "Search neighborhoods, inspect nearby deals, and spot clusters fast.",
    icon: MapPin,
  },
  {
    title: "Follow-Ups",
    href: "/follow-ups",
    description: "Keep your next touch point visible so nothing slips through the cracks.",
    icon: Calendar,
  },
  {
    title: "Signals & Outreach",
    href: "/signals",
    description: "Turn hidden signals into draft outreach and keep messages organized.",
    icon: MessageSquare,
  },
  {
    title: "AI & Docs",
    href: "/ask",
    description: "Draft outreach, review contracts, and ask the assistant for help.",
    icon: Hammer,
  },
] as const;

export default function Dashboard() {
  const { leads, opportunities, completeFollowUp, gettingStartedDismissed, setGettingStartedDismissed } = useAppStore();
  const navigate = useNavigate();

  const showGettingStarted = !gettingStartedDismissed;
  const dismissGettingStarted = () => {
    void setGettingStartedDismissed(true);
  };

  const allFollowUps = leads.flatMap((lead) =>
    lead.followUps.map((fu) => ({ ...fu, lead }))
  );

  const pendingFollowUps = allFollowUps
    .filter((fu) => !fu.completed)
    .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

  const dueToday = pendingFollowUps.filter((fu) => isToday(parseISO(fu.dueDate)));
  const overdue = pendingFollowUps.filter((fu) => !isToday(parseISO(fu.dueDate)) && isPast(parseISO(fu.dueDate)));

  const newLeads = leads.filter((l) => l.status === "New Lead");
  const hotLeads = leads.filter((l) => l.status === "Follow-Up" || l.status === "Contacted");
  const underContract = leads.filter((l) => l.status === "Under Contract");

  const recentOpps = [...opportunities]
    .sort((a, b) => parseISO(b.savedAt).getTime() - parseISO(a.savedAt).getTime())
    .slice(0, 5);

  const highOpps = opportunities.filter(o => o.opportunityScore >= 80);

  return (
    <div className="flex flex-col gap-8 w-full pb-8">
      <div className="flex bg-white border-b border-slate-200 items-center justify-between px-8 py-4 -mx-4 sm:-mx-8 -mt-4 sm:-mt-8 mb-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
           <TrendingUp className="w-5 h-5 text-emerald-500" />
           Daily Deal Board
        </h1>
        <AddLeadDialog>
          <Button className="bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200">
            + New Lead
          </Button>
        </AddLeadDialog>
      </div>

      {showGettingStarted && (
        <Card className="rounded-2xl border-blue-100 bg-blue-50/80 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  <Sparkles className="h-4 w-4" />
                  Getting Started
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900">How to use LandMiner CRM</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  You’ve finished onboarding — here’s the fastest way to work your day inside the CRM. Tap any section
                  to jump straight into it.
                </p>
              </div>

              <Button variant="ghost" size="sm" onClick={dismissGettingStarted} className="self-start text-slate-500 hover:text-slate-900">
                Dismiss
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {gettingStartedCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => navigate(card.href)}
                    className="group rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">How to use</span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 group-hover:text-blue-700">
                          Open section
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid xl:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="flex flex-col gap-8">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="rounded-xl border-emerald-100 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wider">Active Pipeline</p>
                     <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{leads.length}</p>
                  <div className="text-xs font-medium text-emerald-700 mt-2 flex items-center gap-1">
                     <span className="bg-white/60 px-1.5 py-0.5 rounded">{hotLeads.length} Hot Leads</span>
                     <span>•</span>
                     <span className="bg-white/60 px-1.5 py-0.5 rounded">{underContract.length} Contract</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-amber-100 shadow-sm bg-gradient-to-br from-amber-50 to-white hover:border-amber-300 cursor-pointer transition-colors" onClick={() => navigate('/opportunities')}>
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-sm font-semibold text-amber-800 uppercase tracking-wider">Signals Found</p>
                     <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{opportunities.length}</p>
                  <p className="text-xs font-medium text-amber-700 mt-2 flex items-center gap-1">
                     <span className="bg-white/60 px-1.5 py-0.5 rounded">{highOpps.length} High Score</span>
                     <span>in your market</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card className="rounded-xl border-blue-100 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-start mb-2">
                     <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Action Needed</p>
                     <AlertCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">{dueToday.length + overdue.length}</p>
                  <p className="text-xs font-medium text-blue-700 mt-2">
                     Follow-ups due today
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2 text-slate-800">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Today's Deal Intelligence
                    </h2>
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/opportunities')}>View All</Button>
                </div>
                <div className="divide-y divide-slate-100">
                    {recentOpps.length > 0 ? recentOpps.map(opp => (
                        <div key={opp.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                           <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase ${
                                  opp.opportunityScore >= 80 ? "bg-emerald-100 text-emerald-700" :
                                  opp.opportunityScore >= 60 ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-100 text-slate-700"
                                }`}>
                                  Score: {opp.opportunityScore}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">Added {formatDistanceToNow(parseISO(opp.savedAt), { addSuffix: true })}</span>
                              </div>
                              <h3 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">{opp.propertyAddress}</h3>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{opp.notes}</p>
                           </div>
                           <Button variant="outline" size="sm" onClick={() => navigate('/opportunities')} className="bg-white text-xs border-slate-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 font-medium whitespace-nowrap hidden sm:flex">
                              View Snapshot
                           </Button>
                        </div>
                    )) : (
                        <div className="py-12 flex flex-col justify-center items-center text-center px-4">
                            <Building className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="font-medium text-slate-700">No civic signals found yet</p>
                            <p className="text-sm text-slate-500 mt-1 max-w-sm mb-4">Use the Deal Finder to scan your market for 311 complaints and code violations.</p>
                            <Button variant="outline" onClick={() => navigate('/opportunities')} className="gap-2 bg-white">
                                <Sparkles className="w-4 h-4 text-amber-500" /> Scan Market
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="rounded-xl overflow-hidden border-slate-200 shadow-sm flex flex-col">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center relative z-10">
              <h2 className="font-bold flex items-center gap-2 text-slate-800">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Follow-Ups Due
              </h2>
              <span className="text-xs font-bold text-slate-500">{dueToday.length + overdue.length} REMAINING</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto bg-white">
              {[...overdue, ...dueToday].length === 0 && (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
                  <p className="text-sm font-medium text-slate-600">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">No follow-ups due right now.</p>
                </div>
              )}
              {[...overdue, ...dueToday].slice(0, 5).map((fu) => (
                <div key={fu.id} className="p-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 truncate">{fu.lead.sellerName || "Unknown Seller"}</span>
                      {isPast(parseISO(fu.dueDate)) && !isToday(parseISO(fu.dueDate)) && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold uppercase tracking-wider shrink-0">Late</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-2">
                      {fu.lead.propertyAddress}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/leads/${fu.lead.id}`)} className="h-7 text-[10px] uppercase font-bold text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/leads/${fu.lead.id}`)} className="h-7 text-[10px] uppercase font-bold text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                        Message
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => completeFollowUp(fu.lead.id, fu.id)} className="shrink-0 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-full">
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 p-3 border-t border-slate-100 text-center">
                 <Button variant="link" className="text-xs text-slate-500 hover:text-blue-600" onClick={() => navigate('/leads')}>View all pipeline activity</Button>
            </div>
          </Card>

          <Card className="rounded-xl overflow-hidden border-slate-200 shadow-sm">
             <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                <h2 className="font-bold flex items-center gap-2 text-slate-800">
                  <Hammer className="w-4 h-4 text-slate-500" />
                  Suggested Actions
                </h2>
             </div>
             <div className="p-4 flex flex-col gap-3 bg-white">
                <Button variant="outline" className="justify-start h-auto py-3 px-4 flex gap-3 text-left border-slate-200 hover:bg-slate-50" onClick={() => navigate('/opportunities')}>
                   <div className="bg-amber-100 text-amber-600 p-2 rounded-lg shrink-0">
                      <Sparkles className="w-4 h-4" />
                   </div>
                   <div>
                       <p className="font-medium text-sm text-slate-800">Review {highOpps.length} high-score signals</p>
                       <p className="text-xs text-slate-500 mt-0.5">Properties likely to be distressed</p>
                   </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto py-3 px-4 flex gap-3 text-left border-slate-200 hover:bg-slate-50" onClick={() => navigate('/map')}>
                   <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
                      <MapPin className="w-4 h-4" />
                   </div>
                   <div>
                       <p className="font-medium text-sm text-slate-800">Find nearby deals</p>
                       <p className="text-xs text-slate-500 mt-0.5">Stack opportunities on the map</p>
                   </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto py-3 px-4 flex gap-3 text-left border-slate-200 hover:bg-slate-50" onClick={() => navigate('/leads')}>
                   <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg shrink-0">
                      <MessageSquare className="w-4 h-4" />
                   </div>
                   <div>
                       <p className="font-medium text-sm text-slate-800">Message new leads</p>
                       <p className="text-xs text-slate-500 mt-0.5">{leads.filter(l => l.status === 'New Lead').length} new leads without activity</p>
                   </div>
                </Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
