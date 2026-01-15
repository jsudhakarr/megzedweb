import type { CSSProperties } from 'react';
import { TrendingUp } from 'lucide-react';

export type PromotedBadgeVariant = 'icon' | 'label';

interface PromotedBadgeProps {
  variant?: PromotedBadgeVariant;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function PromotedBadge({
  variant = 'label',
  label = 'Promoted',
  className = '',
  style,
}: PromotedBadgeProps) {
  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white shadow ${className}`}
        style={style}
      >
        <TrendingUp className="w-4 h-4" />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-semibold shadow ${className}`}
      style={style}
    >
      <TrendingUp className="w-3.5 h-3.5" />
      <span>{label}</span>
    </span>
  );
}
