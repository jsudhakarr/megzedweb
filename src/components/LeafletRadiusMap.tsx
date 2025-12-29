import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";

// ✅ Fix marker icon paths (Vite/React needs this)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

type Props = {
  latitude?: string | number | null;
  longitude?: string | number | null;

  radiusMeters?: number; // 500 = 0.5km
  heightClassName?: string;

  /** lock interactions like your previous map */
  readOnly?: boolean;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function toNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : null;
}

export default function LeafletRadiusMap({
  latitude,
  longitude,
  radiusMeters = 500,
  heightClassName = "h-56",
  readOnly = true,
}: Props) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) {
    return (
      <div className={`bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 ${heightClassName}`}>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Map not available
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-100 ${heightClassName}`}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={!readOnly}
        dragging={!readOnly}
        doubleClickZoom={!readOnly}
        touchZoom={!readOnly}
        zoomControl={!readOnly}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} />

        {/* ✅ Visible radius circle */}
        <Circle
          center={[lat, lng]}
          radius={radiusMeters}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#3b82f6",
            fillOpacity: 0.18,
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  );
}
