import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { apiService } from '../../services/api';
import {
  ShoppingBag,
  Upload,
  MapPin,
  Loader2,
  ArrowLeft,
  Crosshair,
  Store,
  User,
  ChevronRight,
  X,
  Camera,
  Lock,
  Check,
  FileText,
  UploadCloud,
} from 'lucide-react';

// --- Interfaces ---
interface ShopLite {
  id: number;
  shop_name: string;
  photo?: { thumbnail: string };
}

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
}

interface DynamicFieldConfig {
  id: number;
  label: string;
  type: string; // text, number, textarea, dropdown, checkbox, radio, file
  options?: string[];
  required?: boolean;
}

// --- Helpers to normalize API shapes ---
const asArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

export default function CreateItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0073f0';

  // --- State ---
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Data Sources
  const [myShops, setMyShops] = useState<ShopLite[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [dynamicFieldConfigs, setDynamicFieldConfigs] = useState<DynamicFieldConfig[]>([]);

  // Form Data
  const [selectedShopId, setSelectedShopId] = useState<string>(''); // '' = Individual
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  // Details
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [listingType, setListingType] = useState('sell');
  const [rentDuration, setRentDuration] = useState('');

  // Media
  const [featurePhoto, setFeaturePhoto] = useState<File | null>(null);
  const [featurePhotoPreview, setFeaturePhotoPreview] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [existingFeatureUrl, setExistingFeatureUrl] = useState<string | null>(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);

  // Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Display names for Locked Edit Mode
  const [lockedCategoryName, setLockedCategoryName] = useState('');
  const [lockedSubcategoryName, setLockedSubcategoryName] = useState('');

  // Refs
  const featureInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const shopsRes: any = await apiService.getUserShops();
      setMyShops(asArray(shopsRes));

      const catsRes: any = await apiService.getCategories();
      setCategories(asArray(catsRes));

      if (editId) await loadEditData(editId);
    } catch (error) {
      console.error('Init Error', error);
    } finally {
      setInitialLoading(false);
    }
  };

  // keep your loadEditData (we will adjust dynamic fields in part 2)

    const loadEditData = async (id: string) => {
    try {
      const item: any = await apiService.getItemDetails(id);
      if (!item) return;

      setSelectedShopId(item.shop_id ? String(item.shop_id) : '');
      setTitle(item.name || '');
      setPrice(item.price || '');
      setDescription(item.description || '');
      setListingType(item.listing_type || 'sell');
      setRentDuration(item.rent_duration || '');
      setAddress(item.address || '');
      setCity(item.city || '');
      setState(item.state || '');
      setCountry(item.country || '');
      setLatitude(item.latitude || '');
      setLongitude(item.longitude || '');

      if (item.feature_photo?.url) setExistingFeatureUrl(item.feature_photo.url);
      if (item.item_photos?.length) setExistingGalleryUrls(item.item_photos.map((p: any) => p.url));

      if (item.category_id) {
        setCategoryId(String(item.category_id));
        setLockedCategoryName(item.category?.name || '');

        await fetchSubcategories(String(item.category_id));

        if (item.subcategory_id) {
          setSubcategoryId(String(item.subcategory_id));
          setLockedSubcategoryName(item.subcategory?.name || '');

          await fetchDynamicFields(String(item.subcategory_id));

          const values: Record<string, any> = {};
          item.dynamic_fields?.forEach((df: any) => {
            // normalize keys to string
            values[String(df.field_id)] = df.value;
          });
          setDynamicValues(values);
        }
      }
    } catch (e) {
      console.error('Failed to load item', e);
    }
  };

  // --- Category Logic ---
  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setCategoryId(id);
    setSubcategoryId('');
    setDynamicValues({});
    setDynamicFieldConfigs([]);
    setSubcategories([]);
    if (id) await fetchSubcategories(id);
  };

  const fetchSubcategories = async (catId: string) => {
    try {
      const res: any = await apiService.getSubcategories(catId);
      setSubcategories(asArray(res));
    } catch (e) {
      console.error(e);
      setSubcategories([]);
    }
  };

  const handleSubcategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSubcategoryId(id);
    setDynamicValues({});
    setDynamicFieldConfigs([]);
    if (id) await fetchDynamicFields(id);
  };

  const fetchDynamicFields = async (subId: string) => {
    try {
      const res: any = await apiService.getSubcategoryDetails(subId);

      // ✅ support multiple backend shapes
      const fields =
        res?.dynamic_fields ??
        res?.data?.dynamic_fields ??
        res?.data?.subcategory?.dynamic_fields ??
        res?.subcategory?.dynamic_fields ??
        [];

      setDynamicFieldConfigs(Array.isArray(fields) ? fields : []);
    } catch (e) {
      console.log('No dynamic fields found', e);
      setDynamicFieldConfigs([]);
    }
  };

  // --- Dynamic Field UI ---
  const handleDynamicChange = (fieldId: number, value: any) => {
    setDynamicValues((prev) => ({ ...prev, [String(fieldId)]: value }));
  };

  const renderDynamicField = (field: DynamicFieldConfig) => {
    const val = dynamicValues[String(field.id)] ?? '';
    const fieldType = (field.type || '').toLowerCase();

    if (fieldType === 'file') {
      return (
        <div key={field.id} className="space-y-2 col-span-2">
          <label className="text-sm font-medium text-slate-700 block">
            {field.label} {field.required && '*'}
          </label>

          <div className="relative">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files?.[0]) handleDynamicChange(field.id, e.target.files[0]);
              }}
            />

            <div
              className={`w-full p-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-3 transition-colors ${
                val ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-full ${val ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                {/* ✅ CloudUpload -> UploadCloud */}
                {val ? <Check className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
              </div>

              <div className="text-sm">
                {val ? (
                  <span className="text-blue-700 font-medium">File Selected</span>
                ) : (
                  <span className="text-slate-500">Tap to upload document</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // keep your other types as-is (checkbox/radio/dropdown/textarea/default),
    // but make sure you read/write dynamicValues using String(field.id) as above.

    // DEFAULT (Text/Number)
    return (
      <div key={field.id} className="space-y-2 col-span-2 md:col-span-1">
        <label className="text-sm font-medium text-slate-700 block">
          {field.label} {field.required && '*'}
        </label>
        <input
          type={fieldType === 'number' ? 'number' : 'text'}
          value={val}
          onChange={(e) => handleDynamicChange(field.id, e.target.value)}
          className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      </div>
    );
  };
  
{myShops.map((s) => (
  <option key={s.id} value={String(s.id)}>
    {s.shop_name}
  </option>
))}
