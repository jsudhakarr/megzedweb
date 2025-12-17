import { useMemo, useRef } from "react";
import { Star, Images, X } from "lucide-react";
import type { CreateItemForm } from "./types";

type Props = {
  primaryColor: string;
  form: CreateItemForm;
  setForm: React.Dispatch<React.SetStateAction<CreateItemForm>>;
  onBack: () => void;
  onNext: () => void;
};

export default function Step2DetailsDynamicFields({
  primaryColor,
  form,
  setForm,
  onBack,
  onNext,
}: Props) {
  const featureInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ✅ safe fallbacks (no TS undefined errors)
  const existingGalleryUrls = form.existingGalleryUrls ?? [];
  const galleryPhotos = form.galleryPhotos ?? [];

  const setVal = (k: keyof CreateItemForm, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  // --- Listing Type ---
  const listingTypes = [
    { id: "sell", label: "Sell" },
    { id: "rent", label: "Rent" },
    { id: "stay", label: "Stay" },
    { id: "service", label: "Service" },
    { id: "job", label: "Job" },
  ];

  const rentDurations = ["Daily", "Weekly", "Monthly", "Yearly"];
  const showRentDuration = form.listingType !== "sell";

  const handleTypeChange = (type: string) => {
    setForm((prev) => {
      const updates: any = { listingType: type };
      if (type === "sell") updates.rentDuration = "";
      else if (!prev.rentDuration) updates.rentDuration = "Monthly";
      return { ...prev, ...updates };
    });
  };

  // --- Photos ---
  const handleFeaturePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setForm((p) => ({
        ...p,
        featurePhoto: f,
        // keep existingFeatureUrl as fallback (UI shows new file)
      }));
    }
    // allow re-select same file
    e.currentTarget.value = "";
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
      setForm((prev) => ({
        ...prev,
        galleryPhotos: [...(prev.galleryPhotos ?? []), ...newFiles],
      }));
    }
    e.currentTarget.value = "";
  };

  const featurePreview = useMemo(() => {
    if (form.featurePhoto) return URL.createObjectURL(form.featurePhoto);
    if (form.existingFeatureUrl) return form.existingFeatureUrl;
    return null;
  }, [form.featurePhoto, form.existingFeatureUrl]);

  const newGalleryPreviews = useMemo(() => {
    return (form.galleryPhotos ?? []).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
  }, [form.galleryPhotos]);

  // ✅ FIXED: remove existing gallery url
  const removeExistingGalleryUrl = (url: string) => {
    setForm((p) => ({
      ...p,
      existingGalleryUrls: (p.existingGalleryUrls ?? []).filter((u) => u !== url),
    }));
  };

  const removeNewGalleryIndex = (idx: number) => {
    setForm((p) => ({
      ...p,
      galleryPhotos: (p.galleryPhotos ?? []).filter((_, i) => i !== idx),
    }));
  };

  const clearFeature = () => {
    setForm((p) => ({
      ...p,
      featurePhoto: null,
      existingFeatureUrl: null, // if you want to KEEP old, remove this line
    }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* 1. Listing Type Chips */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-900">Listing Type</label>
        <div className="flex flex-wrap gap-2">
          {listingTypes.map((type) => {
            const isSelected = form.listingType === type.id;
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                style={{ backgroundColor: isSelected ? primaryColor : undefined }}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          value={form.title}
          placeholder="e.g. 10g Gold Bar"
          onChange={(e) => setVal("title", e.target.value)}
        />
      </div>

      {/* 3. Price & Duration */}
      <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium text-slate-700">
            Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={form.price}
            placeholder="e.g. 48000"
            onChange={(e) => setVal("price", e.target.value)}
          />
        </div>

        {showRentDuration && (
          <div className="space-y-2 w-1/3">
            <label className="text-sm font-medium text-slate-700">Duration</label>
            <select
              className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              value={form.rentDuration}
              onChange={(e) => setVal("rentDuration", e.target.value)}
            >
              {rentDurations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          className="w-full p-3 border border-slate-300 rounded-xl min-h-[120px] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
          value={form.description}
          placeholder="Add some details buyers should know..."
          onChange={(e) => setVal("description", e.target.value)}
        />
      </div>

      {/* 5. Photos */}
      <div className="space-y-3">
        <label className="text-base font-semibold text-slate-900">Photos</label>

        <div className="flex gap-4 h-[110px]">
          {/* Feature input */}
          <input
            type="file"
            accept="image/*"
            ref={featureInputRef}
            className="hidden"
            onChange={handleFeaturePick}
          />

          {/* Feature tile (click always opens picker, remove button won’t block) */}
          <div
            onClick={() => featureInputRef.current?.click()}
            className="relative w-[110px] h-full rounded-xl border border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden group"
          >
            {featurePreview ? (
              <>
                <img src={featurePreview} alt="Feature" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearFeature();
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70 z-20"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                  <Star className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600">Feature</span>
              </>
            )}
          </div>

          {/* Gallery input */}
          <input
            type="file"
            accept="image/*"
            multiple
            ref={galleryInputRef}
            className="hidden"
            onChange={handleGalleryPick}
          />

          {/* Gallery pick tile */}
          <div
            onClick={() => galleryInputRef.current?.click()}
            className="relative flex-1 h-full rounded-xl border border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center transition-colors overflow-hidden group"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <Images className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600">Add Gallery Photos</span>
            <div className="mt-1 text-[11px] text-slate-500">
              {existingGalleryUrls.length + galleryPhotos.length} selected
            </div>
          </div>
        </div>

        {/* Existing gallery grid */}
        {existingGalleryUrls.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-600 mb-2">Existing photos</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {existingGalleryUrls.map((url) => (
                <div key={url} className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={url} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingGalleryUrl(url)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New gallery grid */}
        {galleryPhotos.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-600 mb-2">New photos</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {newGalleryPreviews.map((p, idx) => (
                <div key={p.url} className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={p.url} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewGalleryIndex(idx)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="pt-4 flex justify-between border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl text-white font-medium shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryColor }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
