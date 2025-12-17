import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Login from '../pages/Login';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300); // Match duration
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  if (!isVisible && !open) return null;

  const modal = (
    <div
      className={`fixed inset-0 z-[9999] flex p-0 md:p-4 transition-all duration-300 ease-out
        ${open ? 'bg-black/60 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0 pointer-events-none'}
        items-end md:items-center justify-center`} // ✅ Bottom on mobile, Center on desktop
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDownCapture={(e) => e.stopPropagation()}
    >
      <div
        className={`relative w-full md:w-full md:max-w-md bg-white shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-300 ease-out
          ${/* ✅ Mobile: Slide Up | Desktop: Scale Up */ ''}
          ${open ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-8 md:scale-95'}
          rounded-t-[32px] rounded-b-none md:rounded-3xl max-h-[90vh]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Visual */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-white sticky top-0 z-20">
          <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-8 custom-scrollbar">
          <Login isModal onSuccess={onClose} />
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}