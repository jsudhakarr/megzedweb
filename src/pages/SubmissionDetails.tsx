import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Phone, Navigation, Star } from "lucide-react";
import { apiService } from "../services/api";
import { useAppSettings } from "../contexts/AppSettingsContext";
import SubmissionStatusBadge from "../components/SubmissionStatusBadge";
import SubmissionFields from "../components/SubmissionFields";
import type { ActionSubmission } from "../types/action";

type SubmissionField = {
  label: string;
  value: string;
};

const normalizeFields = (submission: ActionSubmission | null): SubmissionField[] => {
  if (!submission) return [];
  const sources = [
    (submission as any).submitted_values,
    submission.form_fields,
    submission.form_data,
    submission.fields,
    submission.data,
  ];

  for (const source of sources) {
    if (!source) continue;

    if (Array.isArray(source)) {
      const fields = source
        .map((entry: any, index: number) => ({
          label:
            entry?.label ||
            entry?.name ||
            entry?.field_label ||
            entry?.field_name ||
            `Field ${index + 1}`,
          value:
            entry?.value ??
            entry?.field_value ??
            entry?.answer ??
            entry?.response ??
            "",
        }))
        .filter((entry: SubmissionField) => entry.value !== "");

      if (fields.length) return fields;
    } else if (typeof source === "object") {
      const fields = Object.entries(source).map(([key, value]) => ({
        label: key,
        value: value === null || value === undefined ? "" : String(value),
      }));
      if (fields.length) return fields;
    }
  }

  return [];
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatActionLabel = (value?: string | null) => {
  if (!value) return "Action";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getCategoryIcon = (submission: ActionSubmission | null) => {
  if (!submission) return null;
  const anySubmission = submission as any;
  return (
    anySubmission?.category_icon ||
    anySubmission?.categoryIcon ||
    submission.item?.category?.icon?.url ||
    submission.item?.category?.icon ||
    submission.item?.subcategory?.icon?.url ||
    submission.item?.subcategory?.icon ||
    null
  );
};

const getActionIcon = (submission: ActionSubmission | null) => {
  if (!submission) return null;
  const anySubmission = submission as any;
  return (
    anySubmission?.action_button_icon_url ||
    anySubmission?.actionButtonIconUrl ||
    anySubmission?.action_button_icon ||
    anySubmission?.actionButtonIcon ||
    submission.action?.icon_url ||
    submission.action?.icon ||
    null
  );
};

const getCounterpartyAvatar = (submission: ActionSubmission | null, isSellerView: boolean) => {
  if (!submission) return null;
  const anySubmission = submission as any;

  if (isSellerView) {
    return (
      anySubmission?.buyer_profile_url ||
      anySubmission?.buyerProfileUrl ||
      anySubmission?.buyer_avatar ||
      anySubmission?.buyerAvatar ||
      anySubmission?.buyer_image ||
      anySubmission?.buyerImage ||
      anySubmission?.buyer?.profile_photo_url ||
      anySubmission?.buyer?.profile_url ||
      anySubmission?.buyer?.avatar ||
      anySubmission?.buyer?.photo ||
      null
    );
  }

  return (
    anySubmission?.seller_profile_url ||
    anySubmission?.sellerProfileUrl ||
    anySubmission?.seller_avatar ||
    anySubmission?.sellerAvatar ||
    anySubmission?.seller_image ||
    anySubmission?.sellerImage ||
    anySubmission?.owner_profile_url ||
    anySubmission?.ownerProfileUrl ||
    anySubmission?.owner_image ||
    anySubmission?.ownerImage ||
    anySubmission?.seller?.profile_photo_url ||
    anySubmission?.seller?.profile_url ||
    anySubmission?.seller?.avatar ||
    anySubmission?.seller?.image ||
    anySubmission?.seller?.logo ||
    anySubmission?.owner?.profile_photo_url ||
    anySubmission?.owner?.profile_url ||
    anySubmission?.owner?.avatar ||
    anySubmission?.owner?.image ||
    anySubmission?.shop?.logo_url ||
    anySubmission?.shop?.logo ||
    null
  );
};

export default function SubmissionDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const primaryColor = settings?.primary_color || "#0ea5e9";
  const variant = (location.state as { variant?: "received" | "sent" } | null)?.variant;

  const [submission, setSubmission] = useState<ActionSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getActionSubmission(Number(id), variant);
        setSubmission(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load submission details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id, variant]);

  const fields = useMemo(() => normalizeFields(submission), [submission]);

  const status = submission?.status ?? "pending";
  const normalizedStatus = status.toLowerCase();

  const item = submission?.item;
  const itemName =
    (submission as any)?.item_name ||
    item?.name ||
    item?.title ||
    "Item";
  const itemPrice = item?.price ? `₹ ${Number(item.price).toLocaleString()}` : "Price on request";
  const itemImage =
    (submission as any)?.item_image ||
    item?.feature_photo?.url ||
    item?.item_photos?.find((photo) => photo?.url)?.url ||
    null;
  const itemAddress =
    (submission as any)?.item_address ||
    item?.address ||
    "-";
  const itemLat = (submission as any)?.item_lat || item?.latitude;
  const itemLng = (submission as any)?.item_lng || item?.longitude;

  const actionLabel =
    submission?.action_label ||
    submission?.actionLabel ||
    submission?.action?.label ||
    formatActionLabel((submission as any)?.action_code);
  const actionIcon = getActionIcon(submission);

  const isSellerView = variant === "received";
  const contactPhone = isSellerView
    ? ((submission as any)?.buyer_mobile || "").toString()
    : (submission as any)?.owner_mobile ||
      submission?.contact?.phone ||
      item?.shop?.phone ||
      item?.shop?.user?.mobile ||
      item?.user?.mobile ||
      "";
  const contactWhatsapp =
    submission?.contact?.whatsapp ||
    (isSellerView ? contactPhone : contactPhone);
  const counterpartyLabel = isSellerView ? "Buyer" : "Seller";
  const counterpartyName = isSellerView
    ? (submission as any)?.buyer_name
    : (submission as any)?.lister_name;
  const counterpartyAvatar = getCounterpartyAvatar(submission, isSellerView);
  const categoryIcon = getCategoryIcon(submission);

  const handleCancel = async () => {
    if (!submission?.id) return;
    try {
      setCancelLoading(true);
      await apiService.cancelActionSubmission(submission.id);
      const data = await apiService.getActionSubmission(submission.id, variant);
      setSubmission(data);
    } catch (err) {
      console.error("Failed to cancel submission:", err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleStatusUpdate = async (nextStatus: "accepted" | "rejected") => {
    if (!submission?.id) return;
    try {
      setStatusUpdating(true);
      await apiService.updateActionSubmissionStatus(submission.id, {
        status: nextStatus,
        reason: nextStatus === "rejected" && rejectReason ? rejectReason : undefined,
      });
      const data = await apiService.getActionSubmission(submission.id, variant);
      setSubmission(data);
    } catch (err) {
      console.error("Failed to update submission status:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!submission?.transaction_id || !submission?.transaction_type) return;
    try {
      setReviewSubmitting(true);
      await apiService.createReview({
        transaction_id: submission.transaction_id,
        transaction_type: submission.transaction_type,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      setReviewComment("");
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading submission...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load submission</h2>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-48 h-40 rounded-2xl bg-slate-100 overflow-hidden">
              {itemImage ? (
                <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    {actionIcon ? (
                      <img src={actionIcon} alt="" className="w-4 h-4 rounded object-contain" />
                    ) : null}
                    <span>{actionLabel}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">{itemName}</h1>
                  <p className="text-sm text-slate-500 mt-2">{itemPrice}</p>
                </div>
                <SubmissionStatusBadge status={status} />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-500">
                <div>
                  <span className="font-medium text-slate-700">Submitted:</span>{" "}
                  {formatDate(submission.submission_created_at || submission.created_at)}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Last Update:</span>{" "}
                  {formatDate(submission.submission_updated_at || submission.updated_at)}
                </div>
                <div>
                  <span className="font-medium text-slate-700">Request ID:</span>{" "}
                  {(submission as any)?.uid || submission.id}
                </div>
                {counterpartyName ? (
                  <div>
                    <span className="font-medium text-slate-700">{counterpartyLabel}:</span>{" "}
                    {counterpartyName}
                  </div>
                ) : null}
                {categoryIcon ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">Category:</span>
                    <img src={categoryIcon} alt="" className="w-5 h-5 rounded object-contain" />
                  </div>
                ) : null}
                <div>
                  <span className="font-medium text-slate-700">Location:</span> {itemAddress}
                </div>
              </div>
            </div>
          </div>
        </div>

        {(counterpartyName || counterpartyAvatar) && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-4">
              {counterpartyAvatar ? (
                <img
                  src={counterpartyAvatar}
                  alt={counterpartyName || counterpartyLabel}
                  className="w-14 h-14 rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <span className="text-lg font-semibold">{counterpartyLabel?.[0]}</span>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">{counterpartyLabel}</p>
                <p className="text-base font-semibold text-slate-900">{counterpartyName || "-"}</p>
                {contactPhone ? (
                  <p className="text-sm text-slate-500 mt-1">{contactPhone}</p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Submitted Details</h2>
          <SubmissionFields fields={fields} />
        </div>

        {normalizedStatus === "pending" && !isSellerView && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Request Actions</h2>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 font-semibold"
            >
              {cancelLoading ? "Cancelling..." : "Cancel Request"}
            </button>
          </div>
        )}

        {normalizedStatus === "pending" && isSellerView && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Request Actions</h2>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-600">Reject reason (optional)</label>
              <input
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Add a reason for rejection"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleStatusUpdate("accepted")}
                disabled={statusUpdating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold"
              >
                {statusUpdating ? "Updating..." : "Accept"}
              </button>
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={statusUpdating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 font-semibold"
              >
                {statusUpdating ? "Updating..." : "Reject"}
              </button>
            </div>
          </div>
        )}

        {normalizedStatus === "accepted" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Next Steps</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/dashboard/chat")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
              {contactPhone ? (
                <a
                  href={`tel:${contactPhone}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
              ) : null}
              {contactWhatsapp ? (
                <a
                  href={`https://wa.me/${contactWhatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
              ) : null}
              {itemLat && itemLng ? (
                <a
                  href={`https://www.google.com/maps?q=${itemLat ?? item?.latitude},${itemLng ?? item?.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  <Navigation className="w-4 h-4" />
                  Navigate
                </a>
              ) : null}
            </div>
          </div>
        )}

        {normalizedStatus === "completed" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Leave a Review</h2>
            {submission.transaction_id && submission.transaction_type ? (
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-600">Rating</label>
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(Number(event.target.value))}
                  className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} Star{value > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder="Share your feedback..."
                  className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: primaryColor, opacity: reviewSubmitting ? 0.7 : 1 }}
                >
                  <Star className="w-4 h-4" />
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Review details will be available once the transaction is ready.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
