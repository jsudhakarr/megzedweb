import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService } from '../../services/api';
import { 
  Upload, 
  MapPin, 
  Loader2, 
  Crosshair,
  Lock,
  Store,
  Check,
  Map as MapIcon,
  LayoutGrid,
  X 
} from 'lucide-react';

// --- Configuration ---
// Make sure your .env file has one of these keys defined
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

interface Category {
  id: number;
  name: string;
}

export default function CreateShop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit'); 

  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lockedCategoryName, setLockedCategoryName] = useState('');
  
  // --- Map State ---
  const [isMapOpen, setIsMapOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  
  // Temporary state for the map modal selection
  const [tempLocation, setTempLocation] = useState({ lat: '', lng: '', address: '' });
  const [isMapLoading, setIsMapLoading] = useState(true);

  const [formData, setFormData] = useState({
    shop_name: '',
    category_id: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    latitude: '',
    longitude: '',
    photo: null as File | null
  });

  useEffect(() => {
    fetchCategories();
    if (editId) {
        fetchShopDetails(editId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // --- Map Initialization Logic ---
  const loadMapScript = () => {
    if (window.google && window.google.maps) {
      setIsMapLoading(false);
      initMap();
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      alert("Google Maps API Key is missing in .env file");
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

  const initMap = () => {
    if (!mapRef.current) return;

    // Default to current form lat/lng or a default fallback (e.g., New York)
    const startLat = parseFloat(formData.latitude) || 40.7128;
    const startLng = parseFloat(formData.longitude) || -74.0060;
    const initialPos = { lat: startLat, lng: startLng };

    // Initialize Map
    const map = new window.google.maps.Map(mapRef.current, {
      center: initialPos,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    googleMapInstance.current = map;

    // Add Marker (Centered)
    const marker = new window.google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: false, // We move the map, not the marker, for better UX
      animation: window.google.maps.Animation.DROP,
    });
    markerInstance.current = marker;

    // Listen for map drag end to update marker position and get address
    map.addListener('center_changed', () => {
      const center = map.getCenter();
      if (center) {
        marker.setPosition(center);
      }
    });

    map.addListener('idle', () => {
      const center = map.getCenter();
      if (center) {
        const lat = center.lat();
        const lng = center.lng();
        reverseGeocode(lat, lng);
      }
    });
    
    // Initial Geocode
    reverseGeocode(startLat, startLng);
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google || !window.google.maps) return;
    
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setTempLocation({
          lat: lat.toString(),
          lng: lng.toString(),
          address: results[0].formatted_address
        });
      } else {
        setTempLocation(prev => ({ ...prev, lat: lat.toString(), lng: lng.toString() }));
      }
    });
  };

  // Trigger map load when modal opens
  useEffect(() => {
    if (isMapOpen) {
      // Small timeout to allow DOM to render the map div
      setTimeout(() => loadMapScript(), 100);
    }
  }, [isMapOpen]);

  const confirmMapLocation = () => {
    setFormData(prev => ({
      ...prev,
      latitude: tempLocation.lat,
      longitude: tempLocation.lng,
      address: tempLocation.address || prev.address // Only overwrite address if we found one
    }));
    
    // Attempt to extract city/state/country from the address components if possible
    if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const lat = parseFloat(tempLocation.lat);
        const lng = parseFloat(tempLocation.lng);
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const addressComponents = results[0].address_components;
                let city = ''; let state = ''; let country = '';
                addressComponents.forEach(component => {
                    if (component.types.includes('locality')) city = component.long_name;
                    if (component.types.includes('administrative_area_level_1')) state = component.long_name;
                    if (component.types.includes('country')) country = component.long_name;
                });
                setFormData(prev => ({ ...prev, city, state, country }));
            }
        });
    }
    
    setIsMapOpen(false);
  };

  // --- API Functions ---
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response: any = await apiService.getCategories(); 
      const list = Array.isArray(response) ? response : (response.data || []);
      setCategories(list);
    } catch (error) {
      console.error('Failed to load categories', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchShopDetails = async (id: string) => {
    setLoading(true);
    try {
      const response: any = await apiService.getUserShops();
      const shops = response.data && Array.isArray(response.data) ? response.data : response;
      const shop = shops.find((s: any) => s.id.toString() === id);

      if (shop) {
        const catName = shop.category?.name || shop.shop_type || 'Existing Category';
        setLockedCategoryName(catName);

        setFormData({
          shop_name: shop.shop_name || shop.name || '',
          category_id: '',
          description: shop.description || '',
          address: shop.address || '',
          city: shop.city || '',
          state: shop.state || '',
          country: shop.country || '',
          latitude: shop.latitude || '',
          longitude: shop.longitude || '',
          photo: null 
        });

        if (shop.photo?.url) setImagePreview(shop.photo.url);
        else if (typeof shop.photo === 'string') setImagePreview(shop.photo);
        else if (shop.images?.[0]?.url) setImagePreview(shop.images[0].url);
      }
    } catch (error) {
      console.error("Error fetching shop details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, photo: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));

      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat, lng };
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            setFormData(prev => ({
               ...prev, address: results[0].formatted_address
            }));
          }
        });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('shop_name', formData.shop_name);
      data.append('description', formData.description || '');
      data.append('address', formData.address || '');
      data.append('city', formData.city || '');
      data.append('state', formData.state || '');
      data.append('country', formData.country || '');
      data.append('latitude', formData.latitude || '');
      data.append('longitude', formData.longitude || '');
      
      if (!editId && formData.category_id) {
         data.append('category_id', formData.category_id); 
      }

      if (formData.photo) {
        data.append('photo', formData.photo);
      }

      if (editId) {
        await apiService.updateShop(Number(editId), data);
      } else {
        await apiService.createShop(data);
      }
      navigate('/dashboard/shops');
      
    } catch (error: any) {
      console.error('Failed to save shop:', error);
      alert(error.message || 'Failed to save shop.');
    } finally {
      setLoading(false);
    }
  };

  const title = editId ? 'Edit Shop' : 'New Shop';
  const subtitle = editId ? 'Update your shop details' : 'Create a new shop profile';

  return (
    <div className="max-w-5xl mx-auto px-4 pb-12 sm:px-6 space-y-4">
      
      {/* AppBar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
              <Store className="w-5 h-5" style={{ color: primaryColor }} />
              {title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle}
            </p>
          </div>

          <button
              type="button"
              onClick={() => navigate('/dashboard/shops')}
              className="self-start md:self-center px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
            >
              Back to List
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Logo Upload */}
            <div className="md:col-span-1 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Shop Logo</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
                  imagePreview ? 'border-blue-200 bg-blue-50/30' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
                    <img src={imagePreview} alt="Preview" className="h-full w-auto rounded-md shadow-sm object-contain" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }} className="absolute bottom-2 bg-white/90 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-slate-200">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-2">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-600">Upload Logo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="md:col-span-2 space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Shop Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="shop_name" 
                  required 
                  value={formData.shop_name} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" 
                  placeholder="Enter shop name"
                />
              </div>

              {/* Category Logic */}
              <div className="space-y-1">
                {/* Added LayoutGrid Icon here */}
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <LayoutGrid className="w-3.5 h-3.5" /> 
                  Category <span className="text-red-500">*</span>
                  {loadingCategories && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                </label>
                
                {editId ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={lockedCategoryName || 'Existing Category'}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed outline-none"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  </div>
                ) : (
                  <select
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea 
                  name="description" 
                  rows={3} 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" 
                  placeholder="Tell us about your shop..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
             <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
               <MapPin className="w-4 h-4 text-slate-500" /> Location Details
             </h2>
             
             {/* Location Actions */}
             <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded transition-colors border border-slate-200"
                >
                  <MapIcon className="w-3 h-3" /> Pick on Map
                </button>
                <button 
                  type="button" 
                  onClick={handleUseCurrentLocation} 
                  className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors border border-blue-100"
                >
                  <Crosshair className="w-3 h-3" /> Auto-fill
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Full Address <span className="text-red-500">*</span></label>
              <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none" placeholder="Street Address" />
            </div>

            <div className="space-y-1">
               <label className="block text-xs font-semibold text-slate-700">City</label>
               <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none" />
            </div>
            
            <div className="space-y-1">
               <label className="block text-xs font-semibold text-slate-700">State</label>
               <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none" />
            </div>
            
            <div className="space-y-1 md:col-span-2">
               <label className="block text-xs font-semibold text-slate-700">Country</label>
               <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none" />
            </div>
            
             <div className="md:col-span-2 flex gap-4 text-[10px] text-slate-400">
               <span>Lat: {formData.latitude || 'N/A'}</span>
               <span>Lng: {formData.longitude || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Create Button (Bottom Only) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {editId ? 'Update Shop' : 'Create Shop'}
          </button>
        </div>

      </form>

      {/* Map Picker Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
                 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    Pick Location
                 </h3>
                 <button onClick={() => setIsMapOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              {/* Map Container */}
              <div className="relative flex-1 min-h-[300px] bg-slate-100">
                 {isMapLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                       <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Loading Maps...</p>
                       </div>
                    </div>
                 )}
                 {/* The actual Map DIV */}
                 <div ref={mapRef} className="w-full h-full" />
                 
                 {/* Current Address Overlay */}
                 <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-slate-200 text-xs z-10">
                    <span className="font-semibold text-slate-700">Selected: </span>
                    <span className="text-slate-600 truncate">{tempLocation.address || "Drag map to select..."}</span>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
                 <button 
                   onClick={() => setIsMapOpen(false)}
                   className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={confirmMapLocation}
                   className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm"
                   style={{ backgroundColor: primaryColor }}
                 >
                   Confirm Location
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}