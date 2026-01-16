import { AlertTriangle, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  isOffline?: boolean;
  onRetry: () => void;
}

export default function ErrorState({ title, message, isOffline, onRetry }: ErrorStateProps) {
  const Icon = isOffline ? WifiOff : AlertTriangle;

  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800">{title}</p>
          <p className="text-slate-500 mt-1">{message}</p>
          {isOffline && (
            <p className="text-sm text-slate-400 mt-2">Check your connection and try again.</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
