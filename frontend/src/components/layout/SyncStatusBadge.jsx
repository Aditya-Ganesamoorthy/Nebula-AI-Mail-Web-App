import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function SyncStatusBadge({ status = 'disconnected', lastSyncTime = null, onReconnect }) {
  const getBadgeContent = () => {
    switch (status) {
      case 'connected':
        return {
          wrapperClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70',
          dotClass: 'bg-emerald-500',
          ping: true,
          label: 'Live Sync',
          title: lastSyncTime
            ? `Real-time Pub/Sub push active. Last sync: ${new Date(lastSyncTime).toLocaleTimeString()}`
            : 'Real-time Pub/Sub push active and listening',
        };
      case 'connecting':
        return {
          wrapperClass: 'bg-amber-50 text-amber-700 border-amber-200',
          dotClass: 'bg-amber-500',
          ping: false,
          label: 'Connecting...',
          title: 'Establishing real-time WebSocket connection...',
        };
      case 'reconnecting':
        return {
          wrapperClass: 'bg-amber-50 text-amber-700 border-amber-200 cursor-pointer',
          dotClass: 'bg-amber-500',
          ping: true,
          label: 'Reconnecting...',
          title: 'Connection interrupted. Retrying with exponential backoff. Click to force reconnect.',
        };
      case 'disconnected':
      default:
        return {
          wrapperClass: 'bg-stone-100 text-slate-500 border-stone-200 cursor-pointer hover:bg-stone-200',
          dotClass: 'bg-slate-400',
          ping: false,
          label: 'Push Standby',
          title: 'Push notifications standby. Click to connect real-time listener.',
        };
    }
  };

  const config = getBadgeContent();

  return (
    <button
      type="button"
      onClick={onReconnect}
      title={config.title}
      className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${config.wrapperClass}`}
    >
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`} />
      </span>
      <span>{config.label}</span>
    </button>
  );
}
