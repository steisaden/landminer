import geohash from 'ngeohash';

export async function geocodeAddress(address: string): Promise<{ lat: number, lng: number, hash: string } | null> {
  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && result.data.length > 0) {
        const lat = parseFloat(result.data[0].lat);
        const lng = parseFloat(result.data[0].lon);
        const hash = geohash.encode(lat, lng);
        
        return { lat, lng, hash };
      }
    }
  } catch (error) {
    console.error("Geocoding failed", error);
  }
  
  return null;
}
