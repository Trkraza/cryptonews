'use client';

export default function WebhookStatus() {
  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
      <span className="w-2 h-2 bg-white rounded-full"></span>
      <span className="text-sm font-medium">Auto-updates via webhooks</span>
    </div>
  );
}