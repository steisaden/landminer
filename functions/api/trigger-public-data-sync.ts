import geohash from 'ngeohash';
import { CIVIC_CITIES, CivicCityConfig } from '../_shared/civic-data';
import { json } from '../_shared/http';

const IGNORED_CATEGORIES = [
  'Parking Enforcement',
  'Graffiti',
  'Street and Sidewalk Cleaning',
  'Street Condition',
  'Encampments',
  'MUNI Feedback',
  'Litter Basket Complaint',
  'Rodent',
  'Sign Repair',
  'Streetlights',
];

function calculateSignalScore(category: string, descriptor: string): number {
  const text = `${category} ${descriptor}`.toLowerCase();
  const highValueSignals = [
    'vacant', 'abandoned', 'code violation', 'condemned', 'squatter', 'squat', 'fire',
    'structural', 'overgrown', 'tall weeds', 'water leak', 'unsecured', 'hazard',
    'damage', 'maintenance', 'zoning', 'nuisance',
  ];

  let score = 50;
  for (const signal of highValueSignals) {
    if (text.includes(signal)) {
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

  score += Math.min(Math.floor(text.length / 10), 5);
  return Math.min(Math.max(score, 10), 99);
}

async function readCityId(request: Request): Promise<string> {
  const url = new URL(request.url);
  if (request.method === 'GET') {
    return url.searchParams.get('cityId') || 'nyc';
  }

  try {
    const body = await request.json();
    return String((body as any)?.cityId || 'nyc');
  } catch {
    return 'nyc';
  }
}

async function syncPublicData(cityConfig: CivicCityConfig) {
  let validOpps: any[] = [];

  if (cityConfig.sourceType === 'socrata' && cityConfig.socrataMapping) {
    const { domain, datasetId, socrataMapping } = cityConfig;
    let query = `https://${domain}/resource/${datasetId}.json?$limit=50`;

    if (cityConfig.supportsLatLng) {
      query += `&$where=${socrataMapping.lat} IS NOT NULL AND ${socrataMapping.lng} IS NOT NULL`;
    }

    const response = await fetch(query);
    if (!response.ok) throw new Error(`Failed to fetch ${cityConfig.city} data`);
    const data = await response.json();

    validOpps = (data as any[])
      .filter((item: any) => {
        const cat = item[socrataMapping.category] || '';
        const addrRaw = item[socrataMapping.address] || '';
        const addrText = typeof addrRaw === 'object' ? JSON.stringify(addrRaw) : addrRaw;
        if (IGNORED_CATEGORIES.some((ignored) => cat.includes(ignored))) return false;
        if (addrText.includes('Not associated with a specific address')) return false;
        return true;
      })
      .map((item: any) => {
        let lat = parseFloat(item[socrataMapping.lat]);
        let lng = parseFloat(item[socrataMapping.lng]);
        if (Number.isNaN(lat)) lat = 0;
        if (Number.isNaN(lng)) lng = 0;

        const addressRaw = item[socrataMapping.address];
        const addressText = addressRaw ? (typeof addressRaw === 'object' ? JSON.stringify(addressRaw) : addressRaw) : 'Unknown Location';

        return {
          propertyAddress: addressText !== 'Unknown Location' ? `${addressText}, ${cityConfig.city}, ${cityConfig.state || ''}` : 'Unknown Location',
          notes: `Civic Signal: ${item[socrataMapping.category] || 'Report'} - ${item[socrataMapping.descriptor] || ''}`,
          opportunityScore: calculateSignalScore(item[socrataMapping.category] || '', item[socrataMapping.descriptor] || ''),
          source: 'public_data',
          tags: ['Civic Data', `${cityConfig.city} Open311`, ...(cityConfig.signalTypes.includes('code_violation') ? ['Code Violation'] : [])],
          lat,
          lng,
          geohash: lat && lng ? geohash.encode(lat, lng) : 'unknown',
        };
      })
      .filter((o: any) => o.propertyAddress !== 'Unknown Location' || (o.lat !== 0 && o.lng !== 0));

    validOpps = validOpps.filter((o) => !(o.lat === 0 && o.lng === 0 && o.propertyAddress === 'Unknown Location'));
  } else if (cityConfig.sourceType === 'arcgis' && cityConfig.arcgisMapping) {
    const { arcgisMapping } = cityConfig;
    const idUrl = `${arcgisMapping.layerUrl}/query?where=${encodeURIComponent(arcgisMapping.where)}&returnIdsOnly=true&f=json`;
    const idRes = await fetch(idUrl);
    if (!idRes.ok) throw new Error(`Failed to fetch ${cityConfig.city} arcgis IDs`);
    const idData = await idRes.json() as any;
    const objectIds = Array.isArray(idData.objectIds) ? idData.objectIds.map(Number) : [];

    if (objectIds.length > 0) {
      const batch = objectIds.slice(0, 50);
      const dataUrl = `${arcgisMapping.layerUrl}/query?objectIds=${encodeURIComponent(batch.join(','))}&outFields=*&returnGeometry=true&outSR=4326&f=json`;
      const dataRes = await fetch(dataUrl);
      if (!dataRes.ok) throw new Error(`Failed to fetch ${cityConfig.city} arcgis data`);
      const featureData = await dataRes.json() as any;
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

        const category = pick(attrs, mapping.category) || pick(attrs, mapping.title) || '';
        const address = pick(attrs, mapping.address) || '';
        const addrText = typeof address === 'object' ? JSON.stringify(address) : String(address);

        if (IGNORED_CATEGORIES.some((ignored) => category.includes(ignored))) return false;
        if (addrText.includes('Not associated with a specific address')) return false;
        return true;
      }).map((feature: any) => {
        const attrs = feature.attributes || {};
        const mapping = arcgisMapping.exact ?? arcgisMapping.candidates;
        if (!mapping) return null;

        let lat = parseFloat(pick(attrs, mapping.lat) ?? feature?.geometry?.y);
        let lng = parseFloat(pick(attrs, mapping.lng) ?? feature?.geometry?.x);
        if (Number.isNaN(lat)) lat = 0;
        if (Number.isNaN(lng)) lng = 0;

        const title = pick(attrs, mapping.title);
        const category = pick(attrs, mapping.category);
        const address = pick(attrs, mapping.address);
        const addressText = address ? String(address) : 'Unknown Location';

        return {
          propertyAddress: addressText !== 'Unknown Location' ? `${addressText}, ${cityConfig.city}, ${cityConfig.state || ''}` : 'Unknown Location',
          notes: `Civic Signal: ${category || title || 'Report'}`,
          opportunityScore: calculateSignalScore(category || '', title || ''),
          source: 'public_data',
          tags: ['Civic Data', `${cityConfig.city} Open311`, ...(cityConfig.signalTypes.includes('code_violation') ? ['Code Violation'] : [])],
          lat,
          lng,
          geohash: lat && lng ? geohash.encode(lat, lng) : 'unknown',
        };
      }).filter((o: any) => o && (o.propertyAddress !== 'Unknown Location' || (o.lat !== 0 && o.lng !== 0)));
    }
  } else {
    return { status: 501, body: { success: false, error: "Adapter not implemented for this city's source type yet." } };
  }

  return { status: 200, body: { success: true, count: validOpps.length, data: validOpps } };
}

async function handle(request: Request) {
  try {
    const cityId = await readCityId(request);
    const cityConfig = CIVIC_CITIES.find((c) => c.id === cityId);
    if (!cityConfig) {
      return json({ success: false, error: 'Unsupported city ID' }, { status: 400 });
    }

    const result = await syncPublicData(cityConfig);
    return json(result.body, { status: result.status });
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Failed to fetch open civic data' }, { status: 500 });
  }
}

export const onRequestGet = async ({ request }: any) => handle(request);
export const onRequestPost = async ({ request }: any) => handle(request);
