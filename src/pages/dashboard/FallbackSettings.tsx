import { useEffect, useState } from 'react';
import { useAppSettings } from '../../contexts/AppSettingsContext';

export default function FallbackSettings() {
  const { fallbackConfig, updateFallbackConfig } = useAppSettings();
  const [formData, setFormData] = useState(fallbackConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(fallbackConfig);
  }, [fallbackConfig]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDemoChange = (field: keyof typeof formData.demoData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      demoData: {
        ...prev.demoData,
        [field]: value,
      },
    }));
  };

  const handleListChange = (field: 'highlights' | 'categories', value: string) => {
    const list = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      demoData: {
        ...prev.demoData,
        [field]: list,
      },
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFallbackConfig(formData);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Fallback Configuration</h2>
        <p className="text-sm text-slate-600">
          Control offline branding, demo data, and site colors used when the API is unreachable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Branding & Assets</h3>
            <p className="text-sm text-slate-500">
              These assets come from the local <span className="font-medium">/assets</span> folder to keep the
              experience consistent offline.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[140px_1fr]">
            <div className="flex items-center justify-center border border-dashed border-slate-300 rounded-xl bg-slate-50 p-4">
              <img src={formData.logoUrl} alt="Fallback app logo" className="h-16 w-auto" />
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">Logo:</span> {formData.logoUrl}
              </p>
              <p>
                <span className="font-medium text-slate-800">Favicon:</span> {formData.faviconUrl}
              </p>
              <p>
                These assets auto-replace remote URLs when the server is down or the network is offline.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Site Identity & Colors</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">App name</span>
              <input
                type="text"
                value={formData.appName}
                onChange={(event) => handleChange('appName', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Site name</span>
              <input
                type="text"
                value={formData.siteName}
                onChange={(event) => handleChange('siteName', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={formData.description}
                onChange={(event) => handleChange('description', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Primary color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(event) => handleChange('primaryColor', event.target.value)}
                  className="h-10 w-12 rounded border border-slate-300"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(event) => handleChange('primaryColor', event.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Secondary color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(event) => handleChange('secondaryColor', event.target.value)}
                  className="h-10 w-12 rounded border border-slate-300"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(event) => handleChange('secondaryColor', event.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Footer text</span>
              <input
                type="text"
                value={formData.footerText}
                onChange={(event) => handleChange('footerText', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Contact email</span>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(event) => handleChange('contactEmail', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Contact phone</span>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(event) => handleChange('contactPhone', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Fallback Demo Data</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Hero title</span>
              <input
                type="text"
                value={formData.demoData.heroTitle}
                onChange={(event) => handleDemoChange('heroTitle', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Hero subtitle</span>
              <textarea
                value={formData.demoData.heroSubtitle}
                onChange={(event) => handleDemoChange('heroSubtitle', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={2}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">CTA label</span>
              <input
                type="text"
                value={formData.demoData.ctaLabel}
                onChange={(event) => handleDemoChange('ctaLabel', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Highlights (comma separated)</span>
              <input
                type="text"
                value={formData.demoData.highlights.join(', ')}
                onChange={(event) => handleListChange('highlights', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Categories (comma separated)</span>
              <input
                type="text"
                value={formData.demoData.categories.join(', ')}
                onChange={(event) => handleListChange('categories', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>
        </section>

        <section
          className="rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
          style={{ backgroundColor: formData.secondaryColor }}
        >
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-wide text-slate-500">Preview</p>
            <h4 className="text-2xl font-semibold" style={{ color: formData.primaryColor }}>
              {formData.demoData.heroTitle}
            </h4>
            <p className="text-sm text-slate-600 mt-2">{formData.demoData.heroSubtitle}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {formData.demoData.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${formData.primaryColor}20`, color: formData.primaryColor }}
                >
                  {highlight}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: formData.primaryColor }}
            >
              {formData.demoData.ctaLabel}
            </button>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
          >
            Save fallback settings
          </button>
          {saved && <span className="text-sm text-green-600">Saved locally.</span>}
        </div>
      </form>
    </div>
  );
}
