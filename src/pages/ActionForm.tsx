import { useLocation, useNavigate } from 'react-router-dom';
import ActionFormRenderer from '../components/actionForm/ActionFormRenderer';
import { useAppSettings } from '../contexts/AppSettingsContext';
import type { Item } from '../services/api';
import type { ItemAction } from '../types/action';

type ActionFormLocationState = {
  item?: Item;
  action?: ItemAction;
};

export default function ActionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || '#0ea5e9';
  const state = location.state as ActionFormLocationState | null;
  const item = state?.item;
  const action = state?.action;

  if (!item || !action) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Action not available</h2>
          <p className="text-sm text-slate-600 mb-4">Please return to the item and try again.</p>
          <button
            onClick={() => navigate('/items')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
          >
            Browse Items
          </button>
        </div>
      </div>
    );
  }

  const categoryId = Number(item.category_id || 0);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-10">
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Submitting request for</p>
            <h1 className="text-2xl font-bold text-slate-900">{action.label}</h1>
            <p className="text-sm text-slate-500 mt-2">{item.name}</p>
          </div>

          {categoryId ? (
            <ActionFormRenderer
              itemId={item.id}
              categoryId={categoryId}
              actionCode={action.code}
              onCancel={() => navigate(`/item/${item.id}`)}
              onSuccess={() => navigate(`/item/${item.id}`)}
            />
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              Missing category information for this item.
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          :root {
            --action-primary: ${primaryColor};
          }
        `}
      </style>
    </div>
  );
}
