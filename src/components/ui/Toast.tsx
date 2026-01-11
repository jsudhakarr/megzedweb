import { CheckCircle2, AlertTriangle } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

type ToastProps = {
  message: string;
  variant?: ToastVariant;
};

export default function Toast({ message, variant = 'success' }: ToastProps) {
  const styles =
    variant === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700';

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-sm ${styles}`}
      role="status"
    >
      {variant === 'success' ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <span>{message}</span>
    </div>
  );
}
