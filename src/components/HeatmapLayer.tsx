import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
}

export function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();
  const [isMapSized, setIsMapSized] = useState(false);

  useEffect(() => {
    let frame = 0;
    const syncSize = () => {
      map.invalidateSize();
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) {
        setIsMapSized(true);
        return;
      }
      frame = window.requestAnimationFrame(syncSize);
    };

    syncSize();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [map]);

  useEffect(() => {
    if (!isMapSized || !points || points.length === 0) return;

    // @ts-ignore - leaflet.heat types
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 100, // max intensity scale
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points, isMapSized]);

  return null;
}
