import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet + OpenStreetMap (no API key). markers: [{lat,lng,label,color}]
// ENHANCE: add route polyline (OSRM) and live updates via polling/WebSocket.
const dot = (c) => L.divIcon({ className: '', iconSize: [22, 22], iconAnchor: [11, 11], html: `<div style="width:22px;height:22px;border-radius:50%;background:${c};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)"></div>` });

export default function MapView({ markers = [], center = [26.4499, 80.3319], zoom = 13, height = 320 }) {
  const el = useRef(null); const map = useRef(null); const layer = useRef(null);
  useEffect(() => {
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(center, zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []); // eslint-disable-line
  useEffect(() => {
    layer.current.clearLayers();
    const pts = markers.filter((m) => m.lat != null && m.lng != null);
    pts.forEach((m) => L.marker([m.lat, m.lng], { icon: dot(m.color || '#2A9A3C') }).addTo(layer.current).bindPopup(m.label || ''));
    if (pts.length > 1) map.current.fitBounds(pts.map((m) => [m.lat, m.lng]), { padding: [40, 40], maxZoom: 15 });
    else if (pts.length === 1) map.current.setView([pts[0].lat, pts[0].lng], 15);
    else map.current.setView(center, zoom);
  }, [JSON.stringify(markers)]); // eslint-disable-line
  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-2xl border border-line" role="application" aria-label="Map" />;
}
