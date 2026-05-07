import { CIVIC_CITIES } from '../_shared/civic-data';
import { json } from '../_shared/http';

export const onRequestGet: PagesFunction = async () => {
  const list = CIVIC_CITIES.map((c) => ({
    id: c.id,
    name: `${c.city}, ${c.state || c.country}`,
  }));

  return json({ success: true, data: list });
};
