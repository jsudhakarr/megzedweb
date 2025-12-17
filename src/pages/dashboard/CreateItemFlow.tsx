// src/pages/dashboard/CreateItemFlow.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "../../services/api";
import { useAppSettings } from "../../contexts/AppSettingsContext";

import Step1PostAsCategory from "./createItem/Step1PostAsCategory";
import Step2DetailsDynamicFields from "./createItem/Step2DetailsDynamicFields";
import Step3PhotosLocationSubmit from "./createItem/Step3PhotosLocationSubmit";

import type {
  Category,
  CreateItemForm,
  DynamicFieldConfig,
  ShopLite,
  Subcategory,
} from "./createItem/types";

const asArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

export default function CreateItemFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0073f0";

  const [step, setStep] = useState(1);
  const [initialLoading, setInitialLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [myShops, setMyShops] = useState<ShopLite[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [dynamicFieldConfigs, setDynamicFieldConfigs] = useState<DynamicFieldConfig[]>([]);

  const [form, setForm] = useState<CreateItemForm>({
    selectedShopId: "",
    categoryId: "",
    subcategoryId: "",

    title: "",
    price: "",
    description: "",
    listingType: "sell",
    rentDuration: "",
    dynamicValues: {},

    featurePhoto: null,
    galleryPhotos: [],
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: "",
    longitude: "",

    editId,
    existingFeatureUrl: null,
    existingGalleryUrls: [],
    lockedCategoryName: "",
    lockedSubcategoryName: "",
  });

  // ✅ Step-1 validation (your original behavior)
  const canGoNextFromStep1 = useMemo(() => {
    if (!form.categoryId || !form.subcategoryId) return false;

    return dynamicFieldConfigs.every((field) => {
      if (!field.required) return true;
      const val = form.dynamicValues[String(field.id)];
      return val !== null && val !== undefined && val !== "";
    });
  }, [form.categoryId, form.subcategoryId, form.dynamicValues, dynamicFieldConfigs]);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitial = async () => {
    setInitialLoading(true);
    try {
      const shopsRes: any = await apiService.getUserShops();
      setMyShops(asArray(shopsRes));

      const catsRes: any = await apiService.getCategories();
      setCategories(asArray(catsRes));

      if (editId) {
        await loadEditItem(editId);
      }
    } catch (e) {
      console.error("CreateItem init failed:", e);
    } finally {
      setInitialLoading(false);
    }
  };

  // ✅ FIXED: don't clear dynamic configs in edit-mode loading
  const fetchSubcategories = async (
    categoryId: string,
    opts?: { keepDynamic?: boolean }
  ) => {
    try {
      const res: any = await apiService.getSubcategories(categoryId);
      setSubcategories(asArray(res));

      // only clear when user changes category manually
      if (!opts?.keepDynamic) {
        setDynamicFieldConfigs([]);
      }
    } catch (e) {
      console.error("subcategories error", e);
      setSubcategories([]);
      if (!opts?.keepDynamic) setDynamicFieldConfigs([]);
    }
  };

  const fetchDynamicFields = async (subcategoryId: string) => {
    if (!subcategoryId) {
      setDynamicFieldConfigs([]);
      return;
    }

    try {
      const res: any = await apiService.getSubcategoryFields(subcategoryId);


      const raw =
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res?.fields) ? res.fields :
        Array.isArray(res?.data?.data) ? res.data.data :
        Array.isArray(res?.data?.fields) ? res.data.fields :
        [];

      const fields: DynamicFieldConfig[] = raw.map((f: any) => ({
        id: Number(f.id),
        label: f.label ?? f.name ?? "",
        type: (f.type ?? "text").toLowerCase(),
        required: f.required === true || f.required === 1 || f.required === "1",
        options: Array.isArray(f.options) ? f.options : [],
      }));

      setDynamicFieldConfigs(fields);
    } catch (e) {
      console.error("dynamic fields load failed", e);
      setDynamicFieldConfigs([]);
    }
  };

  // ✅ FIXED: load options + configs FIRST, then setForm (prevents blank locked selects)
  const loadEditItem = async (id: string) => {
  try {
    const res: any = await apiService.getItemDetails(id);

    // ✅ handle different API shapes
    const item =
      res?.data?.item ?? res?.data ?? res?.item ?? res;

    if (!item) return;

    // ✅ ids can be in different keys
    const catId =
      item?.category_id ?? item?.categoryId ?? item?.category?.id ?? "";
    const subId =
      item?.subcategory_id ?? item?.subcategoryId ?? item?.subcategory?.id ?? "";

    const catIdStr = catId ? String(catId) : "";
    const subIdStr = subId ? String(subId) : "";

    // ✅ load lists + fields (so dynamic fields work even if locked)
    if (catIdStr) await fetchSubcategories(catIdStr, { keepDynamic: true });
    if (subIdStr) await fetchDynamicFields(subIdStr);

    // ✅ dynamic fields value mapping (supports multiple shapes)
    const dyn =
      item?.dynamic_fields ??
      item?.dynamicFields ??
      item?.fields ??
      [];

    setForm((p) => ({
      ...p,
      editId: id,
      selectedShopId: item?.shop_id ? String(item.shop_id) : (item?.shopId ? String(item.shopId) : ""),

      categoryId: catIdStr,
      subcategoryId: subIdStr,

      lockedCategoryName:
        item?.category?.name ??
        item?.category_name ??
        p.lockedCategoryName ??
        "",
      lockedSubcategoryName:
        item?.subcategory?.name ??
        item?.subcategory_name ??
        p.lockedSubcategoryName ??
        "",

      title: item?.name ?? item?.title ?? "",
      price: item?.price ?? "",
      description: item?.description ?? "",

      listingType: item?.listing_type ?? item?.listingType ?? "sell",
      rentDuration: item?.rent_duration ?? item?.rentDuration ?? "",

      address: item?.address ?? "",
      city: item?.city ?? "",
      state: item?.state ?? "",
      country: item?.country ?? "",
      latitude: item?.latitude ? String(item.latitude) : "",
      longitude: item?.longitude ? String(item.longitude) : "",

      existingFeatureUrl: item?.feature_photo?.url ?? item?.featurePhoto?.url ?? null,
      existingGalleryUrls:
        (item?.item_photos ?? item?.itemPhotos ?? []).map((x: any) => x?.url).filter(Boolean),

      dynamicValues: Array.isArray(dyn)
        ? dyn.reduce((acc: any, df: any) => {
            const fid = df?.field_id ?? df?.fieldId ?? df?.id;
            const val = df?.value ?? df?.field_value ?? df?.fieldValue;
            if (fid !== undefined && fid !== null) acc[String(fid)] = val ?? "";
            return acc;
          }, {})
        : {},
    }));
  } catch (e) {
    console.error("load edit item failed:", e);
  }
};


  // ✅ Safety: if edit mode + subcategory set but configs empty, re-fetch configs
  useEffect(() => {
    if (editId && form.subcategoryId && dynamicFieldConfigs.length === 0) {
      fetchDynamicFields(form.subcategoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, form.subcategoryId]);


  // ✅ Flutter-compatible submit (create + update)
  const submit = async () => {
    setLoading(true);
    try {
      const data = new FormData();

      // Optional shop
      if (form.selectedShopId) data.append("shop_id", form.selectedShopId);

      // Flutter required
      data.append("subcategory_id", form.subcategoryId);
      data.append("name", form.title);

      // Keep category_id if your backend accepts/ignores (safe)
      if (form.categoryId) data.append("category_id", form.categoryId);

      // Optional text fields
      if (form.price?.trim()) data.append("price", form.price.trim());
      if (form.description?.trim()) data.append("description", form.description.trim());

      if (form.listingType?.trim()) data.append("listing_type", form.listingType.trim());
      if (form.listingType === "rent" && form.rentDuration?.trim()) {
        data.append("rent_duration", form.rentDuration.trim());
      }

      if (form.address?.trim()) data.append("address", form.address.trim());
      if (form.city?.trim()) data.append("city", form.city.trim());
      if (form.state?.trim()) data.append("state", form.state.trim());
      if (form.country?.trim()) data.append("country", form.country.trim());

      // IMPORTANT: don't send empty numeric fields (causes 422 often)
      if (form.latitude?.trim()) data.append("latitude", form.latitude.trim());
      if (form.longitude?.trim()) data.append("longitude", form.longitude.trim());

      // Feature photo
      if (form.featurePhoto) data.append("feature_photo", form.featurePhoto);

      // Item photos (Flutter style: item_photos[i])
      form.galleryPhotos.forEach((file, i) => {
        data.append(`item_photos[${i}]`, file);
      });

      // Dynamic fields (Flutter style: dynamic_fields[i][field_id], dynamic_fields[i][value])
      const entries = Object.entries(form.dynamicValues).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      );

      entries.forEach(([fieldId, value], i) => {
        data.append(`dynamic_fields[${i}][field_id]`, String(fieldId));
        data.append(`dynamic_fields[${i}][value]`, String(value).trim());
      });

      if (form.editId) await apiService.updateItem(form.editId, data);
      else await apiService.createItem(data);

      navigate("/dashboard/items");
    } catch (e: any) {
      console.error("submit failed:", e);
      alert(e?.message ? String(e.message) : "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-600">
        Loading...
      </div>
    );
  }

  const title =
    step === 1 ? "New item · Category" :
    step === 2 ? "New item · Details" :
    "New item · Photos & Location";

  const subtitle =
    step === 1 ? "Choose category and key details" :
    step === 2 ? "Fill required item information" :
    "Upload photos and submit";

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8 sm:px-6 space-y-3">
      {/* AppBar */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              Step {step}/3
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/items")}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="mt-4 h-[3px] w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%`, backgroundColor: primaryColor }}
          />
        </div>
      </div>

      {/* Steps */}
     {step === 1 && (
  <Step1PostAsCategory
    primaryColor={primaryColor}
    editLocked={!!form.editId}
    myShops={myShops}
    categories={categories}
    subcategories={subcategories}
    dynamicFieldConfigs={dynamicFieldConfigs}
    form={form}
    setForm={setForm}
    fetchSubcategories={(catId: string) => fetchSubcategories(catId)}
    fetchDynamicFields={fetchDynamicFields}
    onCreateShop={() => navigate("/dashboard/shops/create")} // ✅ ADD
    onNext={() => setStep(2)}
    canNext={canGoNextFromStep1}
  />
)}


      {step === 2 && (
        <Step2DetailsDynamicFields
          primaryColor={primaryColor}
          form={form}
          setForm={setForm}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <Step3PhotosLocationSubmit
          primaryColor={primaryColor}
          loading={loading}
          form={form}
          setForm={setForm}
          onBack={() => setStep(2)}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
