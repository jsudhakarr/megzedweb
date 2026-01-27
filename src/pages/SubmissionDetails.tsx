import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  MessageCircle,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { apiService } from "../services/api";
import { useAppSettings } from "../contexts/AppSettingsContext";
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

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
  const categoryLabel =
    item?.category?.name ||
    item?.subcategory?.name ||
    (submission as any)?.category_name ||
    "House & Apartments";
  const requestId = (submission as any)?.uid || submission.id;

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
  const rejectReasonValue =
    (submission as any)?.reject_reason ||
    (submission as any)?.rejection_reason ||
    (submission as any)?.status_reason ||
    "";
  const statusColor =
    normalizedStatus === "completed"
      ? "text-blue-600"
      : normalizedStatus === "accepted"
        ? "text-emerald-600"
        : normalizedStatus === "rejected"
          ? "text-rose-600"
          : "text-amber-600";

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Manage Request</h1>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500 font-semibold">
              <span>iD : {requestId}</span>
              <span>
                Status : <span className={`capitalize ${statusColor}`}>{normalizedStatus}</span>
              </span>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                {itemImage ? (
                  <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 line-clamp-1">{itemName}</h2>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      {categoryIcon ? (
                        <img src={categoryIcon} alt="" className="w-4 h-4 object-contain" />
                      ) : null}
                      <span>{categoryLabel}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      {actionIcon ? (
                        <img src={actionIcon} alt="" className="w-4 h-4 object-contain" />
                      ) : (
                        <CalendarDays className="w-4 h-4" />
                      )}
                      <span>{actionLabel}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {(counterpartyName || counterpartyAvatar) && (
            <div className="border-t border-slate-100 px-6 py-5 space-y-4">
              <p className="text-sm font-medium text-slate-500">Submitted By</p>
              <div className="flex items-center gap-4">
                {counterpartyAvatar ? (
                  <img
                    src={counterpartyAvatar}
                    alt={counterpartyName || counterpartyLabel}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <span className="text-lg font-semibold">{counterpartyLabel?.[0]}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-slate-900">{counterpartyName || "-"}</p>
                    <BadgeCheck className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <CalendarDays className="w-4 h-4" />
                    <span>Date {formatDisplayDate(submission.submission_created_at || submission.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/dashboard/chat")}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-blue-700 text-white py-3 font-semibold"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </button>
                <a
                  href={contactPhone ? `tel:${contactPhone}` : undefined}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full py-3 font-semibold ${
                    contactPhone
                      ? "bg-slate-200 text-slate-600"
                      : "bg-slate-100 text-slate-400 pointer-events-none"
                  }`}
                >
                  <Phone className="w-5 h-5" />
                  Call
                </a>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <span className="text-lg font-semibold">Submission Details</span>
            </div>
            <div className="space-y-3">
              {fields.length ? (
                fields.map((field, index) => (
                  <div key={`${field.label}-${index}`} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-slate-500">{field.label}</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {field.value || "-"}
                    </span>
                  </div>
                ))
              ) : (
                <SubmissionFields fields={fields} />
              )}
            </div>
          </div>
        </div>

        {normalizedStatus === "rejected" && rejectReasonValue ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl px-6 py-5">
            <p className="font-semibold">Reject Reason</p>
            <p className="text-sm mt-2">{rejectReasonValue}</p>
          </div>
        ) : null}

        {normalizedStatus === "pending" && !isSellerView && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Request Actions</h2>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="px-6 py-3 rounded-full border border-rose-200 text-rose-600 font-semibold"
            >
              {cancelLoading ? "Cancelling..." : "Cancel Request"}
            </button>
          </div>
        )}

        {normalizedStatus === "pending" && isSellerView && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-600">Reject reason (optional)</label>
              <input
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Add a reason for rejection"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusUpdate("rejected")}
                disabled={statusUpdating}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-rose-300 text-rose-500 font-semibold"
              >
                {statusUpdating ? "Updating..." : "Reject"}
              </button>
              <button
                onClick={() => handleStatusUpdate("accepted")}
                disabled={statusUpdating}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold"
              >
                {statusUpdating ? "Updating..." : "Accept"}
              </button>
            </div>
          </div>
        )}

        {normalizedStatus === "accepted" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Next Steps</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/dashboard/chat")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-700 text-white font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </button>
                {contactPhone ? (
                  <a
                    href={`tel:${contactPhone}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-200 text-slate-700 font-semibold"
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
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold"
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
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-semibold"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {normalizedStatus === "completed" && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Leave a review for the buyer</h2>
              <p className="text-sm text-slate-500">
                Share your experience once this request is completed.
              </p>
            </div>
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
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-white font-semibold"
                  style={{ backgroundColor: primaryColor, opacity: reviewSubmitting ? 0.7 : 1 }}
                >
                  {reviewSubmitting ? "Submitting..." : "Write a Review"}
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
