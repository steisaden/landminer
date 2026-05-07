import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cron from "node-cron";
import geohash from "ngeohash";

type CivicSourceType = "socrata" | "arcgis" | "ckan_csv" | "carto" | "opendatasoft" | "static_csv";

type CivicCityConfig = {
  id: string;
  city: string;
  state?: string;
  country: "US" | "CA";
  sourceType: CivicSourceType;
  domain?: string;
  datasetId?: string;
  tableName?: string;
  serviceName?: string;
  supportsLatLng: boolean;
  supportsAddress: boolean;
  signalTypes: string[];
  priority: "high" | "medium" | "low";
  socrataMapping?: {
    lat: string;
    lng: string;
    address: string;
    category: string;
    descriptor: string;
  };
  arcgisMapping?: {
    serviceKind: 'feature' | 'map';
    layerUrl: string;
    where: string;
    pageSize: number;
    exact?: {
      externalId?: string[];
      title?: string[];
      category?: string[];
      address?: string[];
      lat?: string[];
      lng?: string[];
      openedAt?: string[];
      closedAt?: string[];
      status?: string[];
    };
    candidates?: {
      externalId?: string[];
      title?: string[];
      category?: string[];
      address?: string[];
      lat?: string[];
      lng?: string[];
      openedAt?: string[];
      closedAt?: string[];
      status?: string[];
    };
  };
};

const CIVIC_CITIES: CivicCityConfig[] = [
  {
    id: "nyc", city: "New York City", state: "NY", country: "US", sourceType: "socrata",
    domain: "data.cityofnewyork.us", datasetId: "erm2-nwe9", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "incident_address", category: "complaint_type", descriptor: "descriptor" }
  },
  {
    id: "sf", city: "San Francisco", state: "CA", country: "US", sourceType: "socrata",
    domain: "data.sfgov.org", datasetId: "vw6y-z8j6", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "lat", lng: "long", address: "address", category: "service_name", descriptor: "service_details" }
  },
  {
    id: "chicago", city: "Chicago", state: "IL", country: "US", sourceType: "socrata",
    domain: "data.cityofchicago.org", datasetId: "v6vf-nfxy", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "street_address", category: "sr_type", descriptor: "sr_short_code" }
  },
  {
    id: "austin", city: "Austin", state: "TX", country: "US", sourceType: "socrata",
    domain: "data.austintexas.gov", datasetId: "xwdj-i9he", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "sr_location_lat", lng: "sr_location_long", address: "sr_location", category: "sr_type_desc", descriptor: "sr_department_desc" }
  },
  {
    id: "dallas", city: "Dallas", state: "TX", country: "US", sourceType: "socrata",
    domain: "www.dallasopendata.com", datasetId: "nftr-hpic", supportsLatLng: false, supportsAddress: true,
    signalTypes: ["code_violation"], priority: "high",
    socrataMapping: { lat: "lat", lng: "lon", address: "location_address", category: "type", descriptor: "nuisance" }
  },
  {
    id: "seattle", city: "Seattle", state: "WA", country: "US", sourceType: "socrata",
    domain: "data.seattle.gov", datasetId: "5ngg-rpne", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "location", category: "webintakeservicerequests", descriptor: "departmentname" }
  },
  {
    id: "oakland", city: "Oakland", state: "CA", country: "US", sourceType: "socrata",
    domain: "data.oaklandca.gov", datasetId: "quth-gb8e", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "sry", lng: "srx", address: "reqaddress", category: "reqcategory", descriptor: "description" }
  },
  {
    id: "baton_rouge", city: "Baton Rouge", state: "LA", country: "US", sourceType: "socrata",
    domain: "data.brla.gov", datasetId: "7ixm-mnvx", supportsLatLng: true, supportsAddress: true,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "streetaddress", category: "parenttype", descriptor: "typename" }
  },
  {
    id: "nola", city: "New Orleans", state: "LA", country: "US", sourceType: "socrata",
    domain: "data.nola.gov", datasetId: "2jgv-pqrq", supportsLatLng: true, supportsAddress: false,
    signalTypes: ["open311"], priority: "high",
    socrataMapping: { lat: "latitude", lng: "longitude", address: "location", category: "request_type", descriptor: "request_reason" }
  },
  {
    id: "dc", city: "Washington, D.C.", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
      serviceKind: 'feature',
      layerUrl: 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/ServiceRequests/FeatureServer/21',
      where: '1=1',
      pageSize: 1000,
      exact: {
        externalId: ['SERVICEREQUESTID'],
        title: ['SERVICECODEDESCRIPTION', 'SERVICETYPECODEDESCRIPTION'],
        category: ['SERVICETYPECODEDESCRIPTION', 'SERVICECODEDESCRIPTION'],
        address: ['STREETADDRESS'],
        lat: ['LATITUDE'],
        lng: ['LONGITUDE'],
        openedAt: ['ADDDATE'],
        closedAt: ['RESOLUTIONDATE'],
        status: ['SERVICEORDERSTATUS', 'STATUS_CODE']
      }
    }
  },
  {
    id: "baltimore", city: "Baltimore", state: "MD", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
      serviceKind: 'feature',
      layerUrl: 'https://services1.arcgis.com/UWYHeuuJISiGmgXx/ArcGIS/rest/services/311_Customer_Service_Requests_2025/FeatureServer/0',
      where: '1=1',
      pageSize: 2000,
      exact: {
        externalId: ['SRRecordID', 'ServiceRequestNum'],
        title: ['SRType'],
        category: ['SRType'],
        address: ['Address'],
        lat: ['Latitude'],
        lng: ['Longitude'],
        openedAt: ['CreatedDate'],
        closedAt: ['CloseDate', 'StatusDate'],
        status: ['SRStatus']
      }
    }
  },
  {
    id: "nashville", city: "Nashville", state: "TN", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'feature',
        layerUrl: 'https://services2.arcgis.com/HdTo6HJqh92wn4D8/ArcGIS/rest/services/hubNashville_311_Service_Requests_2023_view/FeatureServer/0',
        where: '1=1',
        pageSize: 2000,
        exact: {
            externalId: ['Request__'],
            title: ['Request_Type', 'Subrequest_Type'],
            category: ['Subrequest_Type', 'Request_Type'],
            address: ['Address'],
            lat: ['Latitude'],
            lng: ['Longitude'],
            openedAt: ['Date_Time_Opened'],
            closedAt: ['Date_Time_Closed'],
            status: ['Status']
        }
    }
  },
  {
    id: "charlotte", city: "Charlotte", state: "NC", country: "US", sourceType: "arcgis", priority: "high",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'map',
        layerUrl: 'https://gis.charlottenc.gov/arcgis/rest/services/ODP/ServiceRequests311/MapServer/0',
        where: '1=1',
        pageSize: 7500,
        exact: {
            externalId: ['REQUEST_NO'],
            title: ['REQUEST_TYPE', 'TITLE'],
            category: ['REQUEST_TYPE'],
            address: ['FULL_ADDRESS'],
            lat: ['LATITUDE'],
            lng: ['LONGITUDE'],
            openedAt: ['RECEIVED_DATE'],
            closedAt: [],
            status: []
        }
    }
  },
  {
    id: "louisville", city: "Louisville", state: "KY", country: "US", sourceType: "arcgis", priority: "medium",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'feature',
        layerUrl: 'https://services1.arcgis.com/79kfd2K6fskCAkyg/arcgis/rest/services/metro_311_2025/FeatureServer/0',
        where: '1=1',
        pageSize: 1000,
        candidates: {
            externalId: ['service_request_id', 'SERVICE_REQUEST_ID', 'objectid'],
            title: ['service_name', 'SERVICE_NAME', 'request_type', 'REQUEST_TYPE'],
            category: ['category', 'CATEGORY', 'service_name', 'SERVICE_NAME'],
            address: ['address', 'ADDRESS', 'full_address', 'FULL_ADDRESS'],
            lat: ['latitude', 'LATITUDE'],
            lng: ['longitude', 'LONGITUDE'],
            openedAt: ['requested_datetime', 'REQUESTED_DATETIME'],
            closedAt: ['closed_date', 'CLOSED_DATE'],
            status: ['status', 'STATUS']
        }
    }
  },
  {
    id: "indianapolis", city: "Indianapolis", state: "IN", country: "US", sourceType: "arcgis", priority: "medium",
    supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
    arcgisMapping: {
        serviceKind: 'feature',
        layerUrl: 'https://gis.indy.gov/server/rest/services/OpenData/ODP_RIMACServiceRequests/FeatureServer/0',
        where: '1=1',
        pageSize: 2000,
        candidates: {
            externalId: ['SERVICE_REQUEST_ID', 'REQUEST_NO', 'REQUESTID', 'OBJECTID'],
            title: ['SERVICENAME', 'REQUEST_TYPE', 'SERVICE_NAME'],
            category: ['SERVICENAME', 'REQUEST_TYPE', 'CATEGORY'],
            address: ['ADDRESS', 'FULL_ADDRESS', 'STREETADDRESS', 'SITEADDRESS'],
            lat: ['LATITUDE', 'LAT', 'Y'],
            lng: ['LONGITUDE', 'LON', 'X'],
            openedAt: ['REQUESTDATE', 'OPENED_DATE', 'CREATED_DATE', 'CREATEDATE'],
            closedAt: ['CLOSEDDATE', 'CLOSED_DATE', 'RESOLUTIONDATE'],
            status: ['STATUS', 'SRSTATUS', 'SERVICE_STATUS']
        }
    }
  },
  {
      id: "cleveland", city: "Cleveland", state: "OH", country: "US", sourceType: "arcgis", priority: "medium",
      supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
      arcgisMapping: {
          serviceKind: 'feature',
          layerUrl: 'https://services3.arcgis.com/dty2kHktVXHrqO8i/arcgis/rest/services/Data_311/FeatureServer/0',
          where: '1=1',
          pageSize: 2000,
          candidates: {
              externalId: ['SERVICE_REQUEST_ID', 'CASE_ID', 'REQUEST_ID', 'OBJECTID'],
              title: ['REQUEST_TYPE', 'SERVICE_NAME', 'TYPE', 'CATEGORY'],
              category: ['CATEGORY', 'REQUEST_TYPE', 'SERVICE_NAME'],
              address: ['ADDRESS', 'FULL_ADDRESS', 'LOCATION', 'STREETADDRESS'],
              lat: ['LATITUDE', 'LAT', 'Y'],
              lng: ['LONGITUDE', 'LON', 'X'],
              openedAt: ['CREATED_DATE', 'OPEN_DATE', 'REQUEST_DATE'],
              closedAt: ['CLOSED_DATE', 'CLOSE_DATE', 'RESOLUTIONDATE'],
              status: ['STATUS', 'SRSTATUS', 'CASE_STATUS']
          }
      }
  },
  {
      id: "minneapolis", city: "Minneapolis", state: "MN", country: "US", sourceType: "arcgis", priority: "medium",
      supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
      arcgisMapping: {
          serviceKind: 'feature',
          layerUrl: 'https://services.arcgis.com/afSMGVsC7QlRK1kZ/ArcGIS/rest/services/Public_311_2026/FeatureServer/0',
          where: '1=1',
          pageSize: 2000,
          candidates: {
              externalId: ['service_request_id', 'SERVICE_REQUEST_ID', 'OBJECTID'],
              title: ['service_name', 'SERVICE_NAME', 'request_type', 'REQUEST_TYPE'],
              category: ['category', 'CATEGORY', 'service_name', 'SERVICE_NAME'],
              address: ['address', 'ADDRESS', 'full_address', 'FULL_ADDRESS'],
              lat: ['latitude', 'LATITUDE'],
              lng: ['longitude', 'LONGITUDE'],
              openedAt: ['requested_datetime', 'REQUESTED_DATETIME', 'created_date'],
              closedAt: ['closed_date', 'CLOSED_DATE', 'resolutiondate'],
              status: ['status', 'STATUS']
          }
      }
  },
  {
      id: "miami_dade", city: "Miami-Dade County", state: "FL", country: "US", sourceType: "arcgis", priority: "medium",
      supportsLatLng: true, supportsAddress: true, signalTypes: ["open311"],
      arcgisMapping: {
          serviceKind: 'feature',
          layerUrl: 'https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/ArcGIS/rest/services/data_311_2023/FeatureServer/0',
          where: '1=1',
          pageSize: 2000,
          candidates: {
            externalId: ['service_request_id', 'SERVICE_REQUEST_ID', 'REQUEST_ID', 'OBJECTID'],
            title: ['service_name', 'SERVICE_NAME', 'request_type', 'REQUEST_TYPE'],
            category: ['category', 'CATEGORY', 'request_type', 'REQUEST_TYPE'],
            address: ['address', 'ADDRESS', 'full_address', 'FULL_ADDRESS'],
            lat: ['latitude', 'LATITUDE'],
            lng: ['longitude', 'LONGITUDE'],
            openedAt: ['requested_datetime', 'REQUESTED_DATETIME', 'created_date'],
            closedAt: ['closed_date', 'CLOSED_DATE', 'resolutiondate'],
            status: ['status', 'STATUS']
          }
      }
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route
  app.get("/api/civic-cities", (req, res) => {
    // Return available cities
    const list = CIVIC_CITIES.map(c => ({ id: c.id, name: `${c.city}, ${c.state || c.country}` }));
    res.json({ success: true, data: list });
  });

  app.get("/api/geocode", async (req, res) => {
    try {
      const { address } = req.query;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ success: false, error: "Address required" });
      }
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
        headers: {
          'User-Agent': 'ReactRealEstateCRM/1.0'
        }
      });
      
      if (!response.ok) {
         return res.status(response.status).json({ success: false, error: "Geocoding service error" });
      }
      
      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Geocoding failed proxy:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/skip-trace", async (req, res) => {
    try {
      const { address } = req.body;
      if (!address) {
        return res.status(400).json({ success: false, error: "Address required" });
      }

      // Simulate a 3rd party API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const apiKey = process.env.SKIPTRACE_API_KEY;
      
      // In a real app we'd use the API key to fetch actual data.
      // Here we will generate plausible pseudo-random data based on the address
      // to demonstrate the integration.
      
      const mockNames = ["James Mitchell", "Maria Gonzalez", "Robert Chen", "Sarah Williams", "David Rodriguez", "Jennifer Smith"];
      const hash = address.length;
      const ownerName = mockNames[hash % mockNames.length];
      
      const areaCode = "555";
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const phone = `(${areaCode}) 555-${suffix}`;

      // 10% chance the trace fails
      if (Math.random() < 0.1) {
         return res.json({ success: false, error: "No records found for this property" });
      }

      res.json({
        success: true, 
        data: {
          ownerName,
          phone,
          status: "verified"
        }
      });

    } catch (e) {
      console.error("Skip trace failed:", e);
      res.status(500).json({ success: false, error: "Failed to process skip trace" });
    }
  });

  const handlePublicDataSync = async (req: express.Request, res: express.Response) => {
    try {
      const cityId = req.method === 'GET'
        ? String(req.query.cityId || 'nyc')
        : String((req.body as any)?.cityId || 'nyc');
      const cityConfig = CIVIC_CITIES.find(c => c.id === cityId);
      
      if (!cityConfig) {
        return res.status(400).json({ success: false, error: "Unsupported city ID" });
      }

      let validOpps: any[] = [];
      
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

      function calculateSignalScore(category: string, descriptor: string): number {
        const text = `${category} ${descriptor}`.toLowerCase();
        
        const highValueSignals = [
          'vacant', 'abandoned', 'code violation', 'condemned', 'squatter', 'squat', 'fire', 
          'structural', 'overgrown', 'tall weeds', 'water leak', 'unsecured', 'hazard', 
          'damage', 'maintenance', 'zoning', 'nuisance'
        ];

        let score = 50; // base score for generic records
        let hasSignal = false;

        for (const signal of highValueSignals) {
          if (text.includes(signal)) {
            hasSignal = true;
            if (['vacant', 'abandoned', 'condemned', 'foreclosure', 'squatter', 'squat', 'fire'].includes(signal)) {
              score += 35;
            } else if (['code violation', 'structural', 'unsecured', 'hazard'].includes(signal)) {
              score += 25;
            } else if (['overgrown', 'tall weeds', 'maintenance', 'zoning', 'nuisance'].includes(signal)) {
              score += 15;
            } else {
              score += 10;
            }
          }
        }
        
        const lengthBonus = Math.min(Math.floor(text.length / 10), 5);
        score += lengthBonus;

        return Math.min(Math.max(score, 10), 99);
      }

      if (cityConfig.sourceType === "socrata" && cityConfig.socrataMapping) {
        const { domain, datasetId, socrataMapping } = cityConfig;
        let query = `https://${domain}/resource/${datasetId}.json?$limit=50`;
        
        if (cityConfig.supportsLatLng) {
          query += `&$where=${socrataMapping.lat} IS NOT NULL AND ${socrataMapping.lng} IS NOT NULL`;
        }

        const response = await fetch(query);
        if (!response.ok) throw new Error(`Failed to fetch ${cityConfig.city} data`);
        const data = await response.json();

        validOpps = data.filter((item: any) => {
            const cat = item[socrataMapping.category] || "";
            const addrRaw = item[socrataMapping.address] || "";
            const addrText = typeof addrRaw === 'object' ? JSON.stringify(addrRaw) : addrRaw;
            
            if (IGNORED_CATEGORIES.some(ignored => cat.includes(ignored))) return false;
            if (addrText.includes("Not associated with a specific address")) return false;
            
            return true;
        }).map((item: any) => {
          let lat = parseFloat(item[socrataMapping.lat]);
          let lng = parseFloat(item[socrataMapping.lng]);
          if (isNaN(lat)) lat = 0;
          if (isNaN(lng)) lng = 0;

          const addressRaw = item[socrataMapping.address];
          const addressText = addressRaw ? (typeof addressRaw === 'object' ? JSON.stringify(addressRaw) : addressRaw) : "Unknown Location";
          
          return {
            propertyAddress: addressText !== "Unknown Location" ? `${addressText}, ${cityConfig.city}, ${cityConfig.state || ""}` : "Unknown Location",
            notes: `Civic Signal: ${item[socrataMapping.category] || 'Report'} - ${item[socrataMapping.descriptor] || ''}`,
            opportunityScore: calculateSignalScore(item[socrataMapping.category] || '', item[socrataMapping.descriptor] || ''),
            source: "public_data",
            tags: ["Civic Data", `${cityConfig.city} Open311`, ...(cityConfig.signalTypes.includes("code_violation") ? ["Code Violation"] : [])],
            lat: lat,
            lng: lng,
            geohash: (lat && lng) ? geohash.encode(lat, lng) : "unknown"
          };
        }).filter((o: any) => o.propertyAddress !== "Unknown Location" || (o.lat !== 0 && o.lng !== 0));
        
        validOpps = validOpps.filter(o => {
          if (o.lat === 0 && o.lng === 0 && o.propertyAddress === "Unknown Location") return false;
          return true;
        });

      } else if (cityConfig.sourceType === "arcgis" && cityConfig.arcgisMapping) {
        const { arcgisMapping } = cityConfig;
        const idUrl = `${arcgisMapping.layerUrl}/query?where=${encodeURIComponent(arcgisMapping.where)}&returnIdsOnly=true&f=json`;
        const idRes = await fetch(idUrl);
        if (!idRes.ok) throw new Error(`Failed to fetch ${cityConfig.city} arcgis IDs`);
        const idData = await idRes.json();
        const objectIds = Array.isArray(idData.objectIds) ? idData.objectIds.map(Number) : [];
        
        if (objectIds.length > 0) {
          const batch = objectIds.slice(0, 50);
          const dataUrl = `${arcgisMapping.layerUrl}/query?objectIds=${encodeURIComponent(batch.join(','))}&outFields=*&returnGeometry=true&outSR=4326&f=json`;
          
          const dataRes = await fetch(dataUrl);
          if (!dataRes.ok) throw new Error(`Failed to fetch ${cityConfig.city} arcgis data`);
          const featureData = await dataRes.json();
          const features = featureData.features || [];

          function pick(attrs: any, names: string[] = []): any {
            for (const name of names) {
              if (name in attrs && attrs[name] != null && attrs[name] !== '') return attrs[name];
            }
            return null;
          }

          validOpps = features.filter((feature: any) => {
            const attrs = feature.attributes || {};
            const mapping = arcgisMapping.exact ?? arcgisMapping.candidates;
            if (!mapping) return false;
            
            const category = pick(attrs, mapping.category) || pick(attrs, mapping.title) || "";
            const address = pick(attrs, mapping.address) || "";
            const addrText = typeof address === 'object' ? JSON.stringify(address) : String(address);
            
            if (IGNORED_CATEGORIES.some(ignored => category.includes(ignored))) return false;
            if (addrText.includes("Not associated with a specific address")) return false;
            
            return true;
          }).map((feature: any) => {
            const attrs = feature.attributes || {};
            const mapping = arcgisMapping.exact ?? arcgisMapping.candidates;
            if (!mapping) return null;

            let lat = parseFloat(pick(attrs, mapping.lat) ?? feature?.geometry?.y);
            let lng = parseFloat(pick(attrs, mapping.lng) ?? feature?.geometry?.x);
            if (isNaN(lat)) lat = 0;
            if (isNaN(lng)) lng = 0;

            const title = pick(attrs, mapping.title);
            const category = pick(attrs, mapping.category);
            const address = pick(attrs, mapping.address);

            const addressText = address ? String(address) : "Unknown Location";

            return {
              propertyAddress: addressText !== "Unknown Location" ? `${addressText}, ${cityConfig.city}, ${cityConfig.state || ""}` : "Unknown Location",
              notes: `Civic Signal: ${category || title || 'Report'}`,
              opportunityScore: calculateSignalScore(category || '', title || ''),
              source: "public_data",
              tags: ["Civic Data", `${cityConfig.city} Open311`, ...(cityConfig.signalTypes.includes("code_violation") ? ["Code Violation"] : [])],
              lat: lat,
              lng: lng,
              geohash: (lat && lng) ? geohash.encode(lat, lng) : "unknown"
            };
          }).filter((o: any) => o && (o.propertyAddress !== "Unknown Location" || (o.lat !== 0 && o.lng !== 0)));
        }

      } else {
        return res.status(501).json({ success: false, error: "Adapter not implemented for this city's source type yet." });
      }

      res.json({ success: true, count: validOpps.length, data: validOpps });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: "Failed to fetch open civic data" });
    }
  };

  app.get('/api/trigger-public-data-sync', handlePublicDataSync);
  app.post('/api/trigger-public-data-sync', handlePublicDataSync);
  let bgSyncCount = 0;
  let bgSyncLastRun: string | null = null;
  // Scheduled serverless cron job for Public Data sync
  cron.schedule("*/10 * * * * *", () => {
    // In a real application, we would use Firebase Admin SDK to fetch data
    // and push them directly to users' collections. We would also email or 
    // send push notifications.
    const runTime = new Date().toISOString();
    console.log(`[${runTime}] Running background mining cron job...`);
    bgSyncCount = Math.floor(Math.random() * 5) + 1;
    bgSyncLastRun = runTime;
  });

  app.get("/api/cron-status", (req, res) => {
    res.json({ success: true, count: bgSyncCount, lastRun: bgSyncLastRun });
    // Reset after reading to prevent repeat notifications in this demo
    bgSyncCount = 0; 
  });

  // Twilio SMS Webhook
  app.post("/api/sms/webhook", express.urlencoded({ extended: true }), async (req, res) => {
    try {
      const from = req.body.From;
      const body = req.body.Body;
      
      console.log(`[Twilio Webhook] Received message from ${from}: ${body}`);
      
      // In a production app, we would:
      // 1. Initialize Firebase Admin SDK
      // 2. Query the 'leads' or 'users/{userId}/leads' collection by phone number
      // 3. Look up the user's Settings (AI Provider, API Keys, activeModel, followUpStyle)
      // 4. Call the AI Model via an executeAI func to generate a conversational response
      // 5. Save the generated response as a draft Follow-Up task or SMS draft in Firebase
      
      const twiml = `
        <Response>
           <!-- We don't send a response directly here; we tee it up in the app UI for approval -->
        </Response>
      `;
      
      res.type('text/xml').send(twiml);
    } catch (e) {
      console.error("Twilio webhook error:", e);
      res.status(500).send("Error");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
