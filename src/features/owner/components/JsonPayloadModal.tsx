import { useState } from "react";
import { Icon } from "@iconify/react";

interface Props {
  title: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  onClose: () => void;
}

export function JsonPayloadModal({ title, requestPayload, responsePayload, onClose }: Props) {
  const [tab, setTab] = useState<"request" | "response">("request");
  const [copied, setCopied] = useState(false);

  const payload = tab === "request" ? requestPayload : responsePayload;
  const formatted = payload ? JSON.stringify(payload, null, 2) : null;

  const handleCopy = async () => {
    if (!formatted) return;
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Icon icon="solar:close-linear" width={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3">
          <button
            onClick={() => setTab("request")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === "request"
                ? "bg-red-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Request
          </button>
          <button
            onClick={() => setTab("response")}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === "response"
                ? "bg-red-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Response
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {formatted ? (
            <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-words">
              {formatted}
            </pre>
          ) : (
            <p className="text-sm text-zinc-500 text-center py-8">Нет данных</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            onClick={handleCopy}
            disabled={!formatted}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <Icon icon={copied ? "solar:check-read-linear" : "solar:copy-linear"} width={16} />
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>
      </div>
    </div>
  );
}
