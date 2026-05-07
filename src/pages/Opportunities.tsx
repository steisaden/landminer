import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { Plus, Search, Building, Upload, AlertCircle, Sparkles, MapPin, RefreshCw, ChevronDown, Info } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { AddOpportunityDialog } from "../components/AddOpportunityDialog";
import { toast } from "sonner";
import { PropertySnapshotCard } from "../components/discovery/PropertySnapshotCard";
import { HiddenSignalFeed } from "../components/discovery/HiddenSignalFeed";
import { classifyHiddenSignalDraft } from "../lib/hidden-signals";
import { geocodeAddress } from "../lib/geocoding";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Opportunities() {
  const { opportunities, hiddenSignals, setOpportunities, addOpportunity } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedCity, setSelectedCity] = useState("nyc");
  const [cities, setCities] = useState<{ id: string, name: string }[]>([]);

  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/civic-cities')
      .then(r => r.json())
      .then(res => {
         if (res.success) setCities(res.data);
      })
      .catch(console.error);

    const interval = setInterval(() => {
       fetch('/api/cron-status')
         .then(r => r.json())
         .then(res => {
            if (res.success && res.count > 0) {
               toast.success(`Background Mining: Found ${res.count} new potential signals.`, { duration: 5000 });
            }
         })
         .catch(console.error);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleConvertToLead = async (e: React.MouseEvent, opp: any) => {
    e.stopPropagation();
    setConvertingId(opp.id);
    try {
      let ownerName = "PUBLIC RECORD OWNER";
      let phone = "";
      
      const res = await fetch('/api/skip-trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: opp.propertyAddress })
      });
      
      if (res.ok) {
        const trace = await res.json();
        if (trace.success && trace.data) {
          ownerName = trace.data.ownerName;
          phone = trace.data.phone;
          toast.success("Skip trace successful");
        } else {
          toast.info("Skip trace found no records. Used defaults.");
        }
      } else {
         toast.info("Skip trace failed. Used defaults.");
      }

      await useAppStore.getState().addLead({
          sellerName: ownerName,
          phone: phone,
          propertyAddress: opp.propertyAddress,
          askingPrice: null,
          motivation: "Public distress signal detected",
          status: "New Lead",
          leadSource: opp.source,
          tags: ["arcgis", "property-data", "needs-skiptrace", ...(opp.tags || [])],
          notes: opp.notes + `\nConverted from Opportunity Score: ${opp.opportunityScore}`
      });

      const userId = useAppStore.getState().userId;
      if (userId) {
        useAppStore.setState((s) => ({ opportunities: s.opportunities.filter((o) => o.id !== opp.id) }));
        await deleteDoc(doc(db, `users/${userId}/opportunities/${opp.id}`));
      }
    } catch (e) {
       toast.error("Failed to convert opportunity");
    } finally {
       setConvertingId(null);
    }
  };

  const handleSyncPublicData = async () => {
    setIsSyncing(true);
    try {
      const attempts = [
        {
          method: 'GET' as const,
          url: `/api/trigger-public-data-sync?cityId=${encodeURIComponent(selectedCity)}`,
        },
        {
          method: 'POST' as const,
          url: '/api/trigger-public-data-sync',
          body: JSON.stringify({ cityId: selectedCity }),
        },
      ];

      let lastError: string | null = null;
      let data: any[] | null = null;

      for (const attempt of attempts) {
        const response = await fetch(attempt.url, {
          method: attempt.method,
          headers: attempt.method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
          body: attempt.method === 'POST' ? attempt.body : undefined,
        });

        const contentType = response.headers.get('content-type') || '';

        if (response.ok && contentType.includes('application/json')) {
          const payload = await response.json();
          data = payload.data || [];
          break;
        }

        const text = await response.text().catch(() => '');
        lastError = text || `HTTP ${response.status}`;

        if (response.status !== 404 && response.status !== 405) {
          throw new Error(lastError);
        }
      }

      if (!data) {
        throw new Error(lastError || 'Failed to sync public data');
      }

      for (const opp of data) {
        const signalDraft = classifyHiddenSignalDraft(opp);
        await useAppStore.getState().addHiddenSignal(signalDraft);
        await addOpportunity(opp);
      }

      toast.success(`Synched ${data.length} new opportunities from ${cities.find(c => c.id === selectedCity)?.name}!`);
    } catch (e) {
      console.error('Failed to sync public data:', e);
      toast.error("Failed to sync public data");
    } finally {
      setIsSyncing(false);
    }
  };

  const IGNORED_CATEGORIES = [
    "Parking Enforcement",
    "Graffiti",
    "Street and Sidewalk Cleaning",
    "Street Condition",
    "Encampments",
    "MUNI Feedback",
    "Litter Basket Complaint",
    "Rodent",
    "Sign Repair",
    "Streetlights"
  ];

  const filteredOpps = opportunities.filter((opp) => {
    const isIgnored = IGNORED_CATEGORIES.some(cat => opp.notes?.includes(cat));
    const isNotAddress = opp.propertyAddress === "Unknown Location" || opp.propertyAddress.includes("Not associated with a specific address");
    if (isIgnored || isNotAddress) return false;

    return opp.propertyAddress.toLowerCase().includes(search.toLowerCase()) || 
      (opp.tags && opp.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
  }).sort((a, b) => b.opportunityScore - a.opportunityScore);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hidden Deal Signals</h1>
          <p className="text-slate-500 mt-1">See nearby 311 complaints, code violations, abandoned vehicle reports, and housing maintenance issues around any property.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="flex rounded-md shadow-sm">
             <Button variant="outline" className="gap-2 shrink-0 bg-white rounded-r-none border-r-0" onClick={handleSyncPublicData} disabled={isSyncing}>
               <Sparkles className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'text-amber-500'}`} /> 
               {isSyncing ? 'Scanning...' : 'Scan Civic Signals'}
             </Button>
             <DropdownMenu>
               <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0 bg-white rounded-l-none" disabled={isSyncing}>
                   <ChevronDown className="w-4 h-4" />
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 {cities.map(c => (
                   <DropdownMenuItem key={c.id} onClick={() => setSelectedCity(c.id)}>
                     {c.name} {selectedCity === c.id && "✓"}
                   </DropdownMenuItem>
                 ))}
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
          <Button variant="outline" className="gap-2 shrink-0 bg-white" onClick={() => navigate('/import')}>
            <Upload className="w-4 h-4" /> Import CSV
          </Button>
          <AddOpportunityDialog>
            <Button className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700">
               <Plus className="w-4 h-4" /> Add Opportunity
            </Button>
          </AddOpportunityDialog>
        </div>
      </div>

      <HiddenSignalFeed
        hiddenSignals={hiddenSignals}
        opportunities={opportunities}
        compact
        className="border-slate-200"
        title="Hidden Signal Feed"
        description="Ranked civic and public-data signals, grouped by pattern instead of raw recency."
        onSaveOpportunity={async (item) => {
          if (!item.signal) return;
          await useAppStore.getState().promoteSignalToOpportunity(item.signal.id);
        }}
        onConvertToLead={async (item) => {
          if (item.signal) {
            await useAppStore.getState().createLeadFromSignal(item.signal.id);
            return;
          }
          if (item.opportunity) {
            await handleConvertToLead({ stopPropagation() {} } as React.MouseEvent, item.opportunity);
          }
        }}
        onInspect={async (item) => {
          if (item.lat !== undefined && item.lng !== undefined) {
            navigate(`/map?lat=${item.lat}&lng=${item.lng}&radius=5`);
            return;
          }

          const geocoded = await geocodeAddress(item.propertyAddress);
          if (geocoded) {
            navigate(`/map?lat=${geocoded.lat}&lng=${geocoded.lng}&radius=5`);
          } else {
            toast.error("Location unavailable for this signal.");
          }
        }}
        onViewAll={() => navigate("/opportunities")}
      />

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
        <AlertCircle className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-blue-900">Live Civic Data</p>
          <p className="mt-1 text-blue-700">
            This tool queries real-time public sector APIs directly. Refresh frequencies vary by municipality—for example, Baltimore updates daily, Louisville updates weekly, while others may update annually.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between gap-4">
        <div className="relative flex-1 flex items-center">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search addresses or tags..."
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm placeholder:text-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger className="absolute right-2 text-slate-400 hover:text-emerald-600 rounded-full h-8 w-8 flex items-center justify-center hover:bg-slate-100 transition-colors">
              <Info className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-slate-900 border-b pb-2">Example Search Queries</h4>
                <div className="grid gap-2 text-sm text-slate-600">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-emerald-700">"abandoned"</span>
                    <span className="text-xs">Find vacant or abandoned properties</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-emerald-700">"code violation"</span>
                    <span className="text-xs">Discover code enforcement signals</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-emerald-700">"washington"</span>
                    <span className="text-xs">Search by city or tag name</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-emerald-700">"123 Main St"</span>
                    <span className="text-xs">Search for a specific address</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {filteredOpps.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Building className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No opportunities found</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              Start building your real estate pipeline by importing lists or saving properties from the map view.
            </p>
            <div className="flex gap-3">
               <Link to="/map" className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                  <MapPin className="w-4 h-4" /> Open Map
               </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOpps.map((opp) => (
            <PropertySnapshotCard
              key={opp.id}
              tone="opportunity"
              className="h-full"
              address={opp.propertyAddress}
              sourceLabel={opp.source === 'public_data' ? 'Public Data' : opp.source === 'csv' ? 'CSV Import' : opp.source}
              signalLabel={`Score: ${opp.opportunityScore}`}
              summary={opp.notes || undefined}
              tags={opp.tags || []}
              metaLabel={new Date(opp.savedAt).toLocaleDateString()}
              primaryAction={{
                label: convertingId === opp.id ? 'Converting...' : 'Convert to Lead',
                disabled: convertingId === opp.id,
                onClick: (e) => handleConvertToLead(e, opp),
                icon: convertingId === opp.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : undefined,
              }}
              secondaryAction={{
                label: 'Find Nearby Deals',
                variant: 'outline',
                onClick: (e) => {
                  e.stopPropagation();
                  if (opp.lat && opp.lng) {
                    navigate(`/map?lat=${opp.lat}&lng=${opp.lng}&radius=5`);
                  } else {
                    toast.error("Location data missing for this property.");
                  }
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
