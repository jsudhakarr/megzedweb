import { useState, useRef, useEffect } from "react";
import { 
  MapPin, 
  Crosshair, 
  Loader2, 
  Check,
  Navigation
} from "lucide-react";
import type { CreateItemForm } from "./types";

// --- Configuration ---
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

type Props = {
  primaryColor: string;
  loading: boolean;
  form: CreateItemForm;
  setForm: React.Dispatch<React.SetStateAction<CreateItemForm>>;
  onBack: () => void;
  onSubmit: () => void;
};

export default function Step3PhotosLocationSubmit({
  primaryColor,
  loading,
  form,
  setForm,
  onBack,
  onSubmit,
}: Props) {
  
  const setVal = (k: keyof CreateItemForm, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  // --- Map State ---
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  // --- 1. Load Google Maps Script ---
  useEffect(() => {
    loadMapScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMapScript = () => {
    if (window.google && window.google.maps) {
      setIsMapLoading(false);
      initMap();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API Key missing");
      return;
    }

    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsMapLoading(false);
        initMap();
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsMapLoading(false);
      initMap();
    };
    document.head.appendChild(script);
  };

  // --- 2. Initialize Map ---
  const initMap = () => {
    if (!mapRef.current) return;

    // Default to New York if no lat/lng, or use current form value
    const startLat = parseFloat(form.latitude) || 40.7128;
    const startLng = parseFloat(form.longitude) || -74.0060;
    const initialPos = { lat: startLat, lng: startLng };

    const map = new window.google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'cooperative', // Helps with scrolling on mobile
    });
    googleMapInstance.current = map;

    // Marker (Centered)
    const marker = new window.google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: false, // We drag the map, not the marker
      animation: window.google.maps.Animation.DROP,
    });
    markerInstance.current = marker;

    // Listeners
    map.addListener('center_changed', () => {
      const center = map.getCenter();
      if (center) {
        marker.setPosition(center);
      }
    });

    // When dragging stops, fetch address
    map.addListener('idle', () => {
      const center = map.getCenter();
      if (center) {
        const lat = center.lat();
        const lng = center.lng();
        // Update lat/lng immediately
        setVal("latitude", lat.toString());
        setVal("longitude", lng.toString());
        // Fetch address
        reverseGeocode(lat, lng);
      }
    });
  };

 // --- 3. Reverse Geocode & Auto-Fill ---
const reverseGeocode = (lat: number, lng: number) => {
  if (!window.google || !window.google.maps) return;

  const geocoder = new window.google.maps.Geocoder();

  geocoder.geocode(
    { location: { lat, lng } },
    (
      results: google.maps.GeocoderResult[] | null,
      status: google.maps.GeocoderStatus
    ) => {
      if (status === "OK" && results?.[0]) {
        const place = results[0];
        setVal("address", place.formatted_address || "");
        extractAndFillDetails(place);
      }
    }
  );
};


  const extractAndFillDetails = (place: google.maps.GeocoderResult) => {
    let city = "";
    let state = "";
    let country = "";

    place.address_components.forEach((c) => {
      if (c.types.includes('locality')) city = c.long_name;
      if (c.types.includes('administrative_area_level_1')) state = c.long_name;
      if (c.types.includes('country')) country = c.long_name;
    });

    // Fallback for city
    if (!city) {
        const level2 = place.address_components.find(c => c.types.includes('administrative_area_level_2'));
        if (level2) city = level2.long_name;
    }

    setVal("city", city);
    setVal("state", state);
    setVal("country", country);
  };

  // --- 4. User Actions ---
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const newPos = { lat: latitude, lng: longitude };
      
      // Move map
      googleMapInstance.current?.panTo(newPos);
      googleMapInstance.current?.setZoom(16);
      
      // Update form explicitly in case 'idle' doesn't catch the jump perfectly
      setVal("latitude", latitude.toString());
      setVal("longitude", longitude.toString());
      reverseGeocode(latitude, longitude);
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6">
      
      {/* 1. Map Section (Embedded) */}
      <div className="space-y-3">
         <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} /> 
                Pin Location
            </h2>
            <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm hover:opacity-90 transition-all"
                style={{ backgroundColor: primaryColor }}
            >
                <Navigation className="w-3.5 h-3.5" />
                Use My Location
            </button>
         </div>

         {/* Map Container */}
         <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shadow-inner">
            {isMapLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100">
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500 font-medium">Loading Map...</span>
                    </div>
                </div>
            )}
            
            <div ref={mapRef} className="w-full h-full" />
            
            {/* Center Pin Overlay (Visual only, actual marker is handled by JS) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 pointer-events-none z-0">
                <MapPin className="w-10 h-10 text-red-600 fill-white drop-shadow-lg animate-bounce" />
            </div>

            {/* Instruction Overlay */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-slate-600 text-center border border-slate-200 shadow-sm pointer-events-none">
                Drag map to adjust location. Address will auto-fill below.
            </div>
         </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. Auto-Filled Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Address Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Full Address</label>
              <input 
                 className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50"
                 value={form.address}
                 onChange={(e) => setVal("address", e.target.value)}
                 placeholder="Auto-filled from map..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">City</label>
              <input 
                 className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                 value={form.city}
                 onChange={(e) => setVal("city", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">State</label>
              <input 
                 className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                 value={form.state}
                 onChange={(e) => setVal("state", e.target.value)}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Country</label>
              <input 
                 className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                 value={form.country}
                 onChange={(e) => setVal("country", e.target.value)}
              />
            </div>
            
            {/* Coordinates (Read-only/Debug) */}
            <div className="md:col-span-2 flex gap-4 text-[10px] text-slate-400 pt-1">
               <div className="flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  <span>Lat: {form.latitude ? parseFloat(form.latitude).toFixed(6) : 'N/A'}</span>
               </div>
               <div className="flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  <span>Lng: {form.longitude ? parseFloat(form.longitude).toFixed(6) : 'N/A'}</span>
               </div>
            </div>
        </div>
      </div>

      {/* 3. Submit Actions */}
      <div className="pt-4 flex justify-between border-t border-slate-100">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Back
        </button>

        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-8 py-2.5 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-70 flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {loading ? "Saving..." : form.editId ? "Update Item" : "Create Item"}
        </button>
      </div>

    </div>
  );
}