/**
 * ImageUploader — Upload/URL image input with client-side auto-optimization
 * Uses browser-image-compression for TinyPNG-like compression before upload.
 */

import { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import imageCompression from "browser-image-compression";
import { ensureCsrfToken } from "@/shared/security/csrf";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  /** Max dimension (width or height) */
  maxDimension?: number;
  /** Max file size in MB after compression */
  maxSizeMB?: number;
}

export function ImageUploader({
  value,
  onChange,
  folder = "misc",
  label = "Изображение",
  maxDimension = 1200,
  maxSizeMB = 0.5,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<"upload" | "url">(value && !value.includes("supabase.asystem.kg") ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Только изображения (PNG, JPG, WebP)");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(10);
    setStats(null);

    try {
      const originalSize = file.size;

      // Compress using browser-image-compression
      setProgress(20);
      const compressed = await imageCompression(file, {
        maxSizeMB,
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.85,
        onProgress: (p) => setProgress(20 + Math.round(p * 0.5)),
      });

      setStats({ original: originalSize, compressed: compressed.size });
      setProgress(75);

      // Upload to backend
      const formData = new FormData();
      formData.append("file", compressed, compressed.name.replace(/\.[^.]+$/, ".webp"));
      formData.append("folder", folder);

      // Resolve API URL (in prod VITE_API_URL points to backend origin)
      const apiBase = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";
      const uploadUrl = `${apiBase}/api/v1/admin/equipment/upload-image`;

      const headers: Record<string, string> = {};
      const csrfToken = await ensureCsrfToken();
      if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

      const resp = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers,
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || `Upload failed (${resp.status})`);
      }

      const data = await resp.json();
      setProgress(100);
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              mode === "upload"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            Загрузить
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
              mode === "url"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragActive
              ? "border-red-400 bg-red-500/5"
              : uploading
                ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 cursor-wait"
                : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          {value && !uploading ? (
            <div className="flex items-center gap-3 w-full">
              <img src={value} alt="" className="w-16 h-16 rounded-lg object-contain bg-white dark:bg-zinc-700 p-1 border border-zinc-200 dark:border-zinc-700" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{value.split("/").pop()}</p>
                {stats && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    {formatBytes(stats.original)} → {formatBytes(stats.compressed)} (-{Math.round((1 - stats.compressed / stats.original) * 100)}%)
                  </p>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(""); setStats(null); }}
                  className="text-xs text-red-500 hover:text-red-600 mt-1"
                >
                  Удалить
                </button>
              </div>
            </div>
          ) : uploading ? (
            <div className="text-center py-2 w-full">
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 mb-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">
                {progress < 70 ? "Оптимизация изображения..." : "Загрузка на сервер..."}
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <Icon icon="solar:cloud-upload-linear" width={28} className="text-zinc-400 mx-auto mb-1" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Перетащите или нажмите для загрузки
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                PNG, JPG, WebP — авто-оптимизация до {maxSizeMB * 1000}KB
              </p>
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.png"
          className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors text-sm"
        />
      )}

      {/* Preview for URL mode */}
      {mode === "url" && value && (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt=""
            className="w-10 h-10 rounded-lg object-contain bg-zinc-100 dark:bg-zinc-800 p-0.5"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span className="text-xs text-zinc-400 truncate">{value.split("/").pop()}</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <Icon icon="solar:danger-circle-linear" width={14} />
          {error}
        </p>
      )}
    </div>
  );
}
