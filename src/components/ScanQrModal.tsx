import { useEffect, useRef, useState } from "react";
import { X, Camera, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
type QrScannerConstructor = typeof import("qr-scanner").default;
type QrScannerInstance = InstanceType<QrScannerConstructor>;

let qrScannerLoader: Promise<QrScannerConstructor> | null = null;

const loadQrScanner = async () => {
  if (!qrScannerLoader) {
    qrScannerLoader = import("qr-scanner").then((module) => {
      const QrScanner = module.default;
      // ✅ Vite worker path
      QrScanner.WORKER_PATH = new URL(
        "qr-scanner/qr-scanner-worker.min.js",
        import.meta.url
      ).toString();
      return QrScanner;
    });
  }

  return qrScannerLoader;
};

type Props = {
  open: boolean;
  onClose: () => void;
  primaryColor: string;
};

function extractItemIdFromQr(text: string): number | null {
  if (!text) return null;
  const trimmed = text.trim();

  // pure number
  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  // /item/123 or /items/123
  const m =
    trimmed.match(/\/item\/(\d+)/i) ||
    trimmed.match(/\/items\/(\d+)/i) ||
    trimmed.match(/[?&]item_id=(\d+)/i) ||
    trimmed.match(/[?&]id=(\d+)/i) ||
    trimmed.match(/item_id[:=]\s*(\d+)/i);

  if (m?.[1]) return Number(m[1]);

  // fallback: last number
  const end = trimmed.match(/(\d+)\s*$/);
  if (end?.[1]) return Number(end[1]);

  return null;
}

export default function ScanQrModal({ open, onClose, primaryColor }: Props) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerInstance | null>(null);

  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const closeModal = () => {
    setError(null);
    setBusy(false);
    onClose();
  };

  const goToItem = (qrText: string) => {
    const id = extractItemIdFromQr(qrText);
    if (!id) {
      setError("QR not recognized. Please scan a valid item QR code.");
      return;
    }
    onClose();
    navigate(`/item/${id}`);
  };

  // Start / stop camera scanning
  useEffect(() => {
    if (!open) return;

    setError(null);

    if (mode !== "camera") return;

    const video = videoRef.current;
    if (!video) return;

    let active = true;

    loadQrScanner()
      .then((QrScanner) => {
        if (!active) return;

        const scanner = new QrScanner(
          video,
          (result) => {
            const text = typeof result === "string" ? result : result?.data;
            if (text) goToItem(text);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          }
        );

        scannerRef.current = scanner;

        scanner.start().catch(() => {
          setError("Camera permission denied or camera not available.");
        });
      })
      .catch(() => {
        setError("QR scanner failed to load.");
      });

    return () => {
      active = false;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [open, mode]);

  // Cleanup when closing
  useEffect(() => {
    if (!open && scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="font-bold text-slate-900">Scan QR</div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("camera")}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                mode === "camera"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Camera className="w-4 h-4" /> Camera
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition ${
                mode === "upload"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload QR
              </span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {/* Camera */}
          {mode === "camera" && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
              <video ref={videoRef} className="w-full h-[320px] object-cover" />
            </div>
          )}

          {/* Upload */}
          {mode === "upload" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-600 mb-3">
                Upload an image that contains the QR code.
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer font-semibold text-sm">
                <Upload className="w-4 h-4" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setBusy(true);
                    setError(null);

                    try {
                      const QrScanner = await loadQrScanner();
                      const result = await QrScanner.scanImage(file, {
                        returnDetailedScanResult: true,
                      });
                      const text = (result as any)?.data || (result as any);
                      if (text) goToItem(text);
                      else setError("QR not found in this image.");
                    } catch {
                      setError("QR not found in this image.");
                    } finally {
                      setBusy(false);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </label>

              {busy && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning image...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={closeModal}
            className="w-full py-3 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50"
            style={{ borderColor: `${primaryColor}40` }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
