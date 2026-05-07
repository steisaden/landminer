import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Activity, Navigation, Search, Filter } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { haversineDistance } from "../lib/geo";
import { geocodeAddress } from "../lib/geocoding";
import { toast } from "sonner";
import { HeatmapLayer } from "../components/HeatmapLayer";
import { PropertySnapshotCard } from "../components/discovery/PropertySnapshotCard";
import { HiddenSignalFeed } from "../components/discovery/HiddenSignalFeed";
import type { HiddenSignalFeedItem } from "../lib/hidden-signals";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Fix for default leaflet marker icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const defaultCenter: [number, number] = [39.8283, -98.5795]; // center of USA

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const { leads, opportunities, hiddenSignals } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [searchAddress, setSearchAddress] = useState("");
  const [radius, setRadius] = useState<string>(searchParams.get('radius') || "all");
  const [isSearching, setIsSearching] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  
  const initialLat = searchParams.get('lat');
  const initialLng = searchParams.get('lng');
  
  const [currentCenter, setCurrentCenter] = useState<[number, number] | null>(
    initialLat && initialLng ? [parseFloat(initialLat), parseFloat(initialLng)] : null
  );
  const [zoom, setZoom] = useState(initialLat && initialLng ? 14 : 4);

  const allItemsRaw = [
    ...leads.filter((l) => l.lat && l.lng).map((l) => ({ ...l, type: 'lead' as const })),
    ...opportunities.filter((o) => o.lat && o.lng).map((o) => ({ ...o, type: 'opportunity' as const }))
  ];

  let allItems = allItemsRaw;

  if (radius !== "all" && currentCenter) {
    const radiusMiles = parseFloat(radius);
    allItems = allItemsRaw.filter(item => {
      const dist = haversineDistance(currentCenter, [item.lat!, item.lng!]);
      return dist <= radiusMiles;
    });
  }

  useEffect(() => {
    if (!currentCenter && allItemsRaw.length > 0) {
      setCurrentCenter([allItemsRaw[0].lat!, allItemsRaw[0].lng!]);
      setZoom(12);
    }
  }, [allItemsRaw.length]);

  const handleSearch = async () => {
    if (!searchAddress) return;
    setIsSearching(true);
    try {
      const result = await geocodeAddress(searchAddress);
      if (result) {
        setCurrentCenter([result.lat, result.lng]);
        setZoom(13);
        toast.success(`Found location! Showing results ${radius !== 'all' ? `within ${radius} miles` : ''}`);
      } else {
        toast.error("Location not found");
      }
    } catch (e) {
      toast.error("Failed to geocode address");
    } finally {
      setIsSearching(false);
    }
  };

  const centerToUse = currentCenter || defaultCenter;

  const convertOpportunityToLead = async (opportunity: { id: string; propertyAddress: string; source: string; tags?: string[]; notes?: string; opportunityScore: number; lat?: number; lng?: number; geohash?: string }) => {
    await useAppStore.getState().addLead({
      sellerName: "PUBLIC RECORD OWNER",
      phone: "",
      propertyAddress: opportunity.propertyAddress,
      askingPrice: null,
      motivation: "Public distress signal detected",
      status: "New Lead",
      leadSource: opportunity.source,
      tags: ["arcgis", "property-data", "needs-skiptrace", ...(opportunity.tags || [])],
      notes: `${opportunity.notes || ""}\nConverted from Opportunity Score: ${opportunity.opportunityScore}`,
    });

    const userId = useAppStore.getState().userId;
    if (userId) {
      useAppStore.setState((state) => ({ opportunities: state.opportunities.filter((entry) => entry.id !== opportunity.id) }));
      await deleteDoc(doc(db, `users/${userId}/opportunities/${opportunity.id}`));
    }
  };

  const inspectSignalOnMap = async (item: HiddenSignalFeedItem) => {
    if (item.lat !== undefined && item.lng !== undefined) {
      setCurrentCenter([item.lat, item.lng]);
      setZoom(14);
      setRadius("5");
      return;
    }

    const geocoded = await geocodeAddress(item.propertyAddress);
    if (geocoded) {
      setCurrentCenter([geocoded.lat, geocoded.lng]);
      setZoom(14);
      setRadius("5");
    } else {
      toast.error("Location unavailable for this signal.");
    }
  };

  const saveSignalAsOpportunity = async (item: HiddenSignalFeedItem) => {
    if (!item.signal) return;
    await useAppStore.getState().promoteSignalToOpportunity(item.signal.id);
  };

  const convertSignalToLead = async (item: HiddenSignalFeedItem) => {
    if (item.signal) {
      await useAppStore.getState().createLeadFromSignal(item.signal.id);
      return;
    }

    if (item.opportunity) {
      await convertOpportunityToLead(item.opportunity);
    }
  };

  return (
    <div className="flex flex-col h-full -m-6 md:-m-8">
      <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10 shadow-sm relative">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-600" />
            Deal Map
          </h1>
          <p className="text-sm text-slate-500 mt-1">Discover nearby deals, public data signals, and active leads.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Address or City..." 
              className="pl-9 h-9" 
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Select value={radius} onValueChange={setRadius}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everywhere</SelectItem>
              <SelectItem value="1">Within 1 mile</SelectItem>
              <SelectItem value="5">Within 5 miles</SelectItem>
              <SelectItem value="10">Within 10 miles</SelectItem>
              <SelectItem value="50">Within 50 miles</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={isSearching || !searchAddress} className="h-9">
             {isSearching ? 'Searching...' : 'Search'}
          </Button>
          <Button 
             variant={showHeatmap ? "default" : "outline"} 
             onClick={() => setShowHeatmap(!showHeatmap)} 
             className={`h-9 ${showHeatmap ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
          >
             <Activity className="w-4 h-4 mr-2" />
             {showHeatmap ? 'Heatmap On' : 'Heatmap Off'}
          </Button>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 h-9 hidden xl:flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
            {allItems.length} inside radius
          </Badge>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <HiddenSignalFeed
          hiddenSignals={hiddenSignals}
          opportunities={opportunities}
          compact
          title="Hidden Signal Feed"
          description="Ranked civic and public-data signals, grouped by pattern instead of raw recency."
          onSaveOpportunity={saveSignalAsOpportunity}
          onConvertToLead={convertSignalToLead}
          onInspect={inspectSignalOnMap}
          onViewAll={() => navigate("/opportunities")}
        />
      </div>

      <div className="flex-1 relative bg-slate-100">
        <MapContainer center={centerToUse} zoom={zoom} className="h-full w-full absolute inset-0 z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapUpdater center={centerToUse} zoom={zoom} />
          
          {showHeatmap && (
             <HeatmapLayer 
                points={opportunities.filter(o => o.lat && o.lng).map(o => [o.lat!, o.lng!, (o.opportunityScore / 100) * 1.5])} 
             />
          )}

          {!showHeatmap && allItems.map((item) => (
            <Marker key={item.id} position={[item.lat!, item.lng!]}>
              <Popup className="rounded-xl overflow-hidden min-w-[320px]">
                {item.type === "lead" ? (
                  <PropertySnapshotCard
                    tone="lead"
                    address={item.propertyAddress}
                    sourceLabel={String((item as any).leadSource || (item as any).source || "Lead")}
                    signalLabel={String((item as any).status || "Lead")}
                    summary={[(item as any).sellerName, (item as any).phone].filter(Boolean).join(" · ") || undefined}
                    tags={item.tags || []}
                    primaryAction={{
                      label: "View Lead Details",
                      onClick: () => navigate(`/leads/${item.id}`),
                    }}
                  />
                ) : (
                  <PropertySnapshotCard
                    tone="opportunity"
                    address={item.propertyAddress}
                    sourceLabel={item.source === "public_data" ? "Public Data" : item.source === "csv" ? "CSV Import" : item.source}
                    signalLabel={`Score: ${(item as any).opportunityScore}`}
                    summary={(item as any).notes || undefined}
                    tags={item.tags || []}
                    metaLabel={`${formatDistanceToNow(parseISO((item as any).savedAt))} ago`}
                    primaryAction={{
                      label: "Convert to Lead",
                      onClick: () => {
                        void convertOpportunityToLead(item as any);
                      },
                    }}
                    secondaryAction={{
                      label: "Find Nearby Deals",
                      onClick: () => {
                        if (item.lat && item.lng) {
                          setCurrentCenter([item.lat, item.lng]);
                          setRadius("1");
                          setZoom(14);
                        } else {
                          toast.error("Location unavailable");
                        }
                      },
                    }}
                  />
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
