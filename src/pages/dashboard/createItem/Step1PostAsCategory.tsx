import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  UploadCloud,
  LayoutGrid,
  ListTree,
  User,
  Loader2,
  AlertCircle,
  ChevronDown,
  Store,
  Plus,
} from "lucide-react";
import type {
  Category,
  CreateItemForm,
  DynamicFieldConfig,
  ShopLite,
  Subcategory,
} from "./types";

type Props = {
  primaryColor: string;
  editLocked: boolean;

  myShops: ShopLite[];
  categories: Category[];
  subcategories: Subcategory[];
  dynamicFieldConfigs: DynamicFieldConfig[];

  form: CreateItemForm;
  setForm: React.Dispatch<React.SetStateAction<CreateItemForm>>;

  fetchSubcategories: (catId: string) => Promise<void>;
  fetchDynamicFields: (subId: string) => Promise<any>;

  clearDynamicFieldConfigs?: () => void;

  onNext: () => void;
  canNext: boolean;

  onCreateShop?: () => void;
};

function pickThumbUrl(obj: any): string | null {
  if (!obj) return null;
  return (
    obj?.icon?.thumbnail ||
    obj?.icon?.url ||
    obj?.icon_url ||
    obj?.photo?.thumbnail ||
    obj?.photo?.url ||
    obj?.logo?.thumbnail ||
    obj?.logo?.url ||
    obj?.image?.thumbnail ||
    obj?.image?.url ||
    null
  );
}

export default function Step1PostAsCategory({
  primaryColor,
  editLocked,
  myShops,
  categories,
  subcategories,
  dynamicFieldConfigs,
  form,
  setForm,
  fetchSubcategories,
  fetchDynamicFields,
  clearDynamicFieldConfigs,
  onNext,
  canNext,
  onCreateShop,
}: Props) {
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  const selectedShop = useMemo(
    () => myShops.find((s) => String(s.id) === String(form.selectedShopId)),
    [form.selectedShopId, myShops]
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(form.categoryId)),
    [form.categoryId, categories]
  );

  const selectedSubcategory = useMemo(
    () => subcategories.find((s) => String(s.id) === String(form.subcategoryId)),
    [form.subcategoryId, subcategories]
  );

  const shopImg = pickThumbUrl(selectedShop);
  const catIcon = pickThumbUrl(selectedCategory);
  const subIcon = pickThumbUrl(selectedSubcategory);

  const postAsLabel = useMemo(() => {
    if (selectedShop?.shop_name) return selectedShop.shop_name;
    return "Post as individual";
  }, [selectedShop]);

  const onShopChange = (v: string) => setForm((p) => ({ ...p, selectedShopId: v }));

  const loadFields = async (subId: string) => {
    if (!subId) return;
    setFieldsError(null);
    setFieldsLoading(true);
    try {
      await fetchDynamicFields(subId);
    } catch (e: any) {
      console.error("❌ fields fetch failed:", e);
      setFieldsError("Failed to load details. Please try again.");
    } finally {
      setFieldsLoading(false);
    }
  };

  const onCategoryChange = async (v: string) => {
    clearDynamicFieldConfigs?.();
    setFieldsError(null);

    setForm((p) => ({
      ...p,
      categoryId: v,
      subcategoryId: "",
      dynamicValues: {},
      lockedCategoryName: "",
      lockedSubcategoryName: "",
    }));

    if (v) await fetchSubcategories(v);
  };

  const onSubcategoryChange = async (v: string) => {
    clearDynamicFieldConfigs?.();
    setFieldsError(null);

    setForm((p) => ({
      ...p,
      subcategoryId: v,
      dynamicValues: {},
      lockedSubcategoryName: "",
    }));

    if (v) await loadFields(v);
  };

  // ✅ In edit mode ensure subcategories exist (so name/icon can resolve)
  useEffect(() => {
    if (!editLocked) return;
    if (!form.categoryId) return;
    if (subcategories.length > 0) return;
    fetchSubcategories(form.categoryId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLocked, form.categoryId]);

  // ✅ Always load dynamic fields (even editLocked)
  useEffect(() => {
    if (!form.subcategoryId) return;
    if (dynamicFieldConfigs.length > 0) return;
    if (fieldsLoading) return;
    loadFields(form.subcategoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subcategoryId, dynamicFieldConfigs.length]);

  const handleDynamicChange = (fieldId: number, value: any) => {
    setForm((p) => ({
      ...p,
      dynamicValues: { ...p.dynamicValues, [String(fieldId)]: value },
    }));
  };

  const normalizeOptions = (field: any) => {
    const raw = field?.options;
    if (Array.isArray(raw)) {
      return raw
        .filter((x) => x !== null && x !== undefined)
        .map((x) => (typeof x === "string" ? x : String(x)));
    }
    if (typeof raw === "string") {
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const isPillGroupType = (t: string) => {
    const type = (t || "").toLowerCase();
    return type === "radio" || type === "checkbox" || type === "multiselect";
  };

  const renderDynamicField = (field: DynamicFieldConfig) => {
    const key = String(field.id);
    const type = (field.type || "text").toLowerCase();
    const label = field.label || "Field";
    const required = !!field.required;
    const val = form.dynamicValues[key];

    // ✅ pill group types
    if (isPillGroupType(type)) {
      const options = normalizeOptions(field);
      let selected: string[] = [];

      if (type === "radio") selected = val ? [String(val)] : [];
      else {
        if (Array.isArray(val)) selected = val.map(String);
        else if (typeof val === "string" && val.length > 0) selected = val.split(",");
      }

      const toggle = (v: string) => {
        if (type === "radio") {
          handleDynamicChange(field.id, v);
          return;
        }
        const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
        handleDynamicChange(field.id, next);
      };

      return (
        <div key={field.id} className="space-y-3">
          <div className="text-sm font-semibold text-slate-800">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>

          <div className="flex flex-wrap gap-3">
            {options.map((o) => {
              const active = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold transition ${
                    active ? "text-white shadow-sm" : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  style={{
                    backgroundColor: active ? primaryColor : undefined,
                    borderColor: active ? primaryColor : "rgb(226 232 240)",
                  }}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    const labelEl = (
      <label className="text-sm font-semibold text-slate-800 block">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );

    // FILE
    if (type === "file") {
      const hasFile = val instanceof File;
      return (
        <div key={field.id} className="space-y-2">
          {labelEl}
          <div className="relative group">
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files?.[0]) handleDynamicChange(field.id, e.target.files[0]);
              }}
            />
            <div
              className={`w-full px-4 py-3 border-2 border-dashed rounded-2xl flex items-center gap-3 transition-all ${
                hasFile
                  ? "bg-blue-50 border-blue-200"
                  : "bg-slate-50 border-slate-200 group-hover:border-slate-300"
              }`}
            >
              <div
                className={`p-2 rounded-full shrink-0 ${
                  hasFile ? "bg-blue-100 text-blue-600" : "bg-white text-slate-500"
                }`}
              >
                {hasFile ? <Check className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
              </div>
              <div className="text-sm truncate">
                {hasFile ? (
                  <span className="text-blue-700 font-semibold truncate">{(val as File).name}</span>
                ) : (
                  <span className="text-slate-500">Tap to upload</span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // TEXTAREA
    if (type === "textarea") {
      return (
        <div key={field.id} className="space-y-2">
          {labelEl}
          <textarea
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 min-h-[110px] bg-white transition-colors"
            value={typeof val === "string" ? val : ""}
            onChange={(e) => handleDynamicChange(field.id, e.target.value)}
            placeholder="Enter details..."
          />
        </div>
      );
    }

    // DROPDOWN
    if (type === "dropdown" || type === "select") {
      const options = normalizeOptions(field);
      return (
        <div key={field.id} className="space-y-2">
          {labelEl}
          <div className="relative">
            <select
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none bg-white focus:ring-2 focus:ring-blue-100 appearance-none transition-colors"
              value={val ? String(val) : ""}
              onChange={(e) => handleDynamicChange(field.id, e.target.value)}
            >
              <option value="">Select</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      );
    }

    // DEFAULT TEXT/NUMBER
    const inputType = type === "number" ? "number" : "text";
    return (
      <div key={field.id} className="space-y-2">
        {labelEl}
        <input
          type={inputType}
          className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 bg-white transition-colors"
          value={val ?? ""}
          onChange={(e) => handleDynamicChange(field.id, e.target.value)}
          placeholder={type === "number" ? "0" : `Enter ${label}`}
        />
      </div>
    );
  };

  const BottomBar = () => (
    <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 mt-6 border-t border-slate-100">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => history.back()}
          className="flex-1 px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 px-6 py-3 rounded-2xl text-white font-semibold shadow-md disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-900">Category · Key details</h2>
        <p className="text-sm text-slate-500">Select a shop or post as individual.</p>
      </div>

      {/* ✅ POST FROM */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <Store className="w-5 h-5" />
            Post from
          </div>
          <div className="text-sm text-slate-500 mt-1">Select a shop or post as individual.</div>
        </div>

        <div className="p-5">
          {!editLocked && myShops.length === 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">Post as individual</div>
                  <div className="text-sm text-slate-500">Continue without a shop</div>
                </div>

                <button
                  type="button"
                  onClick={() => onShopChange("")}
                  className="ml-auto px-4 py-2 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue
                </button>
              </div>

              <button
                type="button"
                onClick={() => onCreateShop?.()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 font-semibold hover:bg-slate-50"
              >
                <Plus className="w-5 h-5" />
                Create Shop
              </button>

              {!onCreateShop && (
                <div className="text-xs text-slate-500">
                  (Parent: pass <code>onCreateShop</code> to open create shop page)
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {shopImg ? (
                  <img src={shopImg} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {editLocked ? (
                <div className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold flex items-center justify-between">
                  <span className="truncate">{postAsLabel}</span>
                  <span className="text-xs">🔒</span>
                </div>
              ) : (
                <div className="relative flex-1">
                  <select
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none font-semibold text-slate-900"
                    value={String(form.selectedShopId ?? "")}
                    onChange={(e) => onShopChange(e.target.value)}
                  >
                    <option value="">Post as individual</option>
                    {myShops.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.shop_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ✅ CATEGORY & DETAILS */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-slate-900 font-bold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Category & details
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-800">Main category</div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {catIcon ? (
                  <img src={catIcon} className="w-full h-full object-cover" alt="" />
                ) : (
                  <LayoutGrid className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {editLocked ? (
                <div className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold flex items-center justify-between">
                  <span className="truncate">
                    {form.lockedCategoryName || selectedCategory?.name || ""}
                  </span>
                  <span className="text-xs">🔒</span>
                </div>
              ) : (
                <div className="relative flex-1">
                  <select
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none font-semibold text-slate-900"
                    value={String(form.categoryId ?? "")}
                    onChange={(e) => onCategoryChange(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-800">Subcategory</div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                {subIcon ? (
                  <img src={subIcon} className="w-full h-full object-cover" alt="" />
                ) : (
                  <ListTree className="w-6 h-6 text-slate-400" />
                )}
              </div>

              {editLocked ? (
                <div className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold flex items-center justify-between">
                  <span className="truncate">
                    {form.lockedSubcategoryName || selectedSubcategory?.name || ""}
                  </span>
                  <span className="text-xs">🔒</span>
                </div>
              ) : (
                <div className="relative flex-1">
                  <select
                    key={String(form.categoryId ?? "")}
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-blue-100 appearance-none disabled:bg-slate-50 font-semibold text-slate-900"
                    value={String(form.subcategoryId ?? "")}
                    onChange={(e) => onSubcategoryChange(e.target.value)}
                    disabled={!form.categoryId}
                  >
                    <option value="">Select subcategory</option>
                    {subcategories.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ KEY DETAILS */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-slate-900 font-bold">Key details</div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-slate-500">
              {form.subcategoryId ? "Fill required fields below." : "Select a subcategory to see required fields."}
            </div>

            {fieldsLoading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-xl">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading...
              </div>
            )}
          </div>

          {fieldsError && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /> {fieldsError}
            </div>
          )}

          {dynamicFieldConfigs.length === 0 ? (
            <div className="text-sm text-slate-400 italic">
              {form.subcategoryId ? "No additional fields required." : "Select a subcategory to see required fields."}
            </div>
          ) : (
            <div className="space-y-6">{dynamicFieldConfigs.map(renderDynamicField)}</div>
          )}
        </div>
      </div>

      <BottomBar />
    </div>
  );
}
