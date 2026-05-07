import { json } from '../_shared/http';

export const onRequestGet: PagesFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    if (!address) {
      return json({ success: false, error: 'Address required' }, { status: 400 });
    }

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
      headers: {
        'User-Agent': 'ReactRealEstateCRM/1.0',
      },
    });

    if (!response.ok) {
      return json({ success: false, error: 'Geocoding service error' }, { status: response.status });
    }

    const data = await response.json();
    return json({ success: true, data });
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Geocoding failed' }, { status: 500 });
  }
};
