import { useNavigate } from 'react-router-dom';

interface AdConfig {
  type?: string | null;
  target_type?: string | null;
  link?: string | null;
  item_id?: string | number | null;
  shop_id?: string | number | null;
  screen_key?: string | null;
  unit_id?: string | null;
  image?: string | null;
  title?: string | null;
  description?: string | null;
}

interface HomeAdSectionProps {
  ad: AdConfig;
  backgroundColor?: string;
  showDivider?: boolean;
}

const resolveAdTarget = (ad: AdConfig) => {
  if (ad.target_type === 'item' && ad.item_id) {
    return { type: 'internal', href: `/item/${ad.item_id}` };
  }
  if (ad.target_type === 'shop' && ad.shop_id) {
    return { type: 'internal', href: `/shop/${ad.shop_id}` };
  }
  if (ad.link) {
    const isExternal = ad.link.startsWith('http');
    return { type: isExternal ? 'external' : 'internal', href: ad.link };
  }
  if (ad.screen_key === 'search') {
    return { type: 'internal', href: '/items' };
  }
  if (ad.screen_key === 'item_details' && ad.item_id) {
    return { type: 'internal', href: `/item/${ad.item_id}` };
  }
  return null;
};

export default function HomeAdSection({
  ad,
  backgroundColor,
  showDivider,
}: HomeAdSectionProps) {
  const navigate = useNavigate();
  const target = resolveAdTarget(ad);
  const adKind =
    ad.type ?? (ad.unit_id ? 'google' : ad.image ? 'custom' : 'native');

  if (!ad.image && adKind === 'custom') return null;

  const handleClick = () => {
    if (!target) return;
    if (target.type === 'external') {
      window.open(target.href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(target.href);
  };

  const renderGoogleAd = () => (
    <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
        Advertisement
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-500">
        Google Ad Placeholder
      </div>
      {ad.unit_id && (
        <div className="mt-1 text-xs text-slate-400">Unit ID: {ad.unit_id}</div>
      )}
    </div>
  );

  const renderNativeAdContent = () => (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {ad.image ? (
        <img
          src={ad.image}
          alt={ad.title || 'Sponsored content'}
          className="w-full h-auto object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Sponsored
          </span>
          <p className="text-base font-semibold text-slate-700">
            {ad.title || 'Discover something new'}
          </p>
          {ad.description && <p className="text-sm text-slate-500">{ad.description}</p>}
        </div>
      )}
    </div>
  );

  const renderCustomAdContent = () => (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <img
        src={ad.image as string}
        alt="Advertisement"
        className="w-full h-auto object-cover"
      />
    </div>
  );

  if (adKind === 'google') {
    return (
      <section
        className={`py-6 ${showDivider ? 'border-t border-b border-slate-200' : ''}`}
        style={{ backgroundColor: backgroundColor || '#ffffff' }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">{renderGoogleAd()}</div>
      </section>
    );
  }

  const content = adKind === 'native' ? renderNativeAdContent() : renderCustomAdContent();
  const Wrapper = target ? 'button' : 'div';

  return (
    <section
      className={`py-6 ${showDivider ? 'border-t border-b border-slate-200' : ''}`}
      style={{ backgroundColor: backgroundColor || '#ffffff' }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <Wrapper
          {...(target
            ? {
                type: 'button',
                onClick: handleClick,
                className: 'w-full text-left',
              }
            : { className: 'block w-full' })}
        >
          {content}
        </Wrapper>
      </div>
    </section>
  );
}
