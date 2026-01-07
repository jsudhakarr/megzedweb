import { useNavigate } from 'react-router-dom';

interface AdConfig {
  target_type?: string | null;
  link?: string | null;
  item_id?: string | number | null;
  shop_id?: string | number | null;
  screen_key?: string | null;
  image?: string | null;
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

  if (!ad.image) return null;

  const handleClick = () => {
    if (!target) return;
    if (target.type === 'external') {
      window.open(target.href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(target.href);
  };

  return (
    <section
      className={`py-6 ${showDivider ? 'border-t border-b border-slate-200' : ''}`}
      style={{ backgroundColor: backgroundColor || '#ffffff' }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleClick}
          className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
        >
          <img
            src={ad.image}
            alt="Advertisement"
            className="w-full h-auto object-cover"
          />
        </button>
      </div>
    </section>
  );
}
