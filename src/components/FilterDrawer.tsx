import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface FilterDrawerProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function FilterDrawer({ open, title, onClose, children }: FilterDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">{title || 'Filters'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-5">{children}</div>
      </div>
    </div>
  );
}
