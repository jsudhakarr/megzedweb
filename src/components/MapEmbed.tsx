import React from "react";

type MapEmbedProps = {
  latitude?: string | number | null;
  longitude?: string | number | null;

  heightClassName?: string;
  title?: string;

  blockInteractions?: boolean;
  showFooter?: boolean;
  directionsLabel?: string;

  /**
   * Controls visible radius
   * 0.004 = close
   * 0.008 = half radius (recommended)
   * 0.015 = wide
   */
  delta?: number;
};

function toNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : null;
}

export default function MapEmbed({
  latitude,
  longitude,
  heightClassName = "h-56",
  title = "Location",
  blockInteractions = true,
  showFooter = true,
  directionsLabel = "Directions",

  // ✅ HALF RADIUS DEFAULT
  delta = 0.008,
}: MapEmbedProps) {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) {
    return (
      <div
        className={`bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 ${heightClassName}`}
      >
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Map not available
        </span>
      </div>
    );
  }

  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html?` +
    `bbox=${left}%2C${bottom}%2C${right}%2C${top}` +
    `&layer=mapnik&marker=${lat}%2C${lng}`;

  const directionsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="space-y-3">
      <div
        className={`relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 ${heightClassName}`}
      >
        {/* Read-only map */}
        <iframe
          title={title}
          src={mapUrl}
          className={`w-full h-full ${blockInteractions ? "pointer-events-none" : ""}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Block all clicks / gestures */}
        {blockInteractions && <div className="absolute inset-0 bg-transparent" />}

        {/* ✅ Hide OSM attribution strip visually */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-50/95 border-t border-slate-100" />
      </div>

      {showFooter && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition"
          >
            {directionsLabel}
          </a>
        </div>
      )}
    </div>
  );
}
