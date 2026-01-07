import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, X, Navigation } from 'lucide-react';

interface LocationPickerProps {
  primaryColor: string;
  city: string | null;
  state: string | null;
  onLocationChange: (city: string | null, state: string | null, lat?: number, lng?: number, distance?: number) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function LocationPicker({ primaryColor, city, state, onLocationChange }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [kmRange, setKmRange] = useState(50);
  const [selectedLocation, setSelectedLocation] = useState<{
    city: string | null;
    state: string | null;
    country: string | null;
    lat: number;
    lng: number;
    formatted: string;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayLocation = city && state ? `${city}, ${state}` : 'Location';

  useEffect(() => {
    if (isOpen && mapRef.current && window.google) {
      initializeMap();
    }
  }, [isOpen]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = { lat: 17.385, lng: 78.4867 }; // Hyderabad

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 12,
      mapTypeId: mapType,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    markerRef.current = new window.google.maps.Marker({
      map: mapInstanceRef.current,
      position: defaultCenter,
      draggable: true,
    });

    markerRef.current.addListener('dragend', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      reverseGeocode(lat, lng);
    });

    mapInstanceRef.current.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      markerRef.current.setPosition({ lat, lng });
      reverseGeocode(lat, lng);
    });

    if (searchInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current);
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          mapInstanceRef.current.setCenter({ lat, lng });
          markerRef.current.setPosition({ lat, lng });
          extractLocationDetails(place, lat, lng);
        }
      });
    }
  };

  const reverseGeocode = (lat: number, lng: number) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        extractLocationDetails(results[0], lat, lng);
      }
    });
  };

  const extractLocationDetails = (place: any, lat: number, lng: number) => {
    let city = null;
    let state = null;
    let country = null;

    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (types.includes('country')) {
          country = component.long_name;
        }
      }
    }

    setSelectedLocation({
      city,
      state,
      country,
      lat,
      lng,
      formatted: place.formatted_address || `${city}, ${state}, ${country}`,
    });
    setSearchQuery(place.formatted_address || '');
  };

  const handleFindMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          mapInstanceRef.current?.setCenter({ lat, lng });
          markerRef.current?.setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    }
  };

  const handleSaveLocation = () => {
    if (selectedLocation) {
      const effectiveDistance = kmRange > 0 ? kmRange : 50;
      onLocationChange(
        selectedLocation.city,
        selectedLocation.state,
        selectedLocation.lat,
        selectedLocation.lng,
        effectiveDistance
      );
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setKmRange(50);
    onLocationChange(null, null, undefined, undefined, undefined);
    setIsOpen(false);
  };

  const handleToggleMapType = () => {
    const newType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapType(newType);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(newType);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-transparent hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg">
          <MapPin className="w-5 h-5 text-slate-700" />
        </div>
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-slate-900">Location</span>
            <ChevronDown className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-xs text-slate-600">{displayLocation}</span>
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Select Location</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Click on the map or search to select a location, then click "Save Location" button below.
              </p>

              <div className="flex gap-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: primaryColor }}
                />
                <button
                  onClick={handleFindMyLocation}
                  className="px-4 py-3 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Navigation className="w-5 h-5" />
                  Find My Location
                </button>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                  onClick={() => handleToggleMapType()}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    mapType === 'roadmap'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Map
                </button>
                <button
                  onClick={() => handleToggleMapType()}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    mapType === 'satellite'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Satellite
                </button>
              </div>
              {selectedLocation && (
                <div className="absolute top-4 right-4 z-10 bg-white px-4 py-2 rounded-lg shadow-md">
                  <p className="text-xs text-slate-600">Selected:</p>
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-xs">
                    {selectedLocation.formatted}
                  </p>
                </div>
              )}
              <div ref={mapRef} className="w-full h-80" />
            </div>

            <div className="p-6 border-t border-slate-200 flex-shrink-0">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Search Radius: {kmRange} km
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={kmRange}
                  onChange={(e) => setKmRange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    accentColor: primaryColor,
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-500">0 km</span>
                  <span className="text-xs text-slate-500">50 km</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClear}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSaveLocation}
                  className="flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                  disabled={!selectedLocation}
                >
                  {selectedLocation ? 'Save Location' : 'Select a location first'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
