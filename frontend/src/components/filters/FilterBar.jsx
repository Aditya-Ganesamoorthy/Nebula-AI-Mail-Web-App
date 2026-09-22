import React, { useState } from 'react';
import { Filter, Calendar, User, Eye, X, Check } from 'lucide-react';
import ActiveFilterChip from './ActiveFilterChip';

export default function FilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  isFiltered = false
}) {
  const [isSenderInputOpen, setIsSenderInputOpen] = useState(false);
  const [senderInput, setSenderInput] = useState(filters.sender || '');

  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'Last 10 Days', value: 'last_10_days' },
    { label: 'This Week', value: 'this_week' },
    { label: 'Last 30 Days', value: 'last_30_days' },
  ];

  const handleDatePresetClick = (presetValue) => {
    if (filters.datePreset === presetValue) {
      // Toggle off
      onFilterChange({ ...filters, datePreset: '', dateFrom: '', dateTo: '' });
    } else {
      onFilterChange({ ...filters, datePreset: presetValue, dateFrom: '', dateTo: '' });
    }
  };

  const handleUnreadToggle = () => {
    onFilterChange({ ...filters, unreadOnly: !filters.unreadOnly });
  };

  const handleSenderSubmit = (e) => {
    if (e) e.preventDefault();
    onFilterChange({ ...filters, sender: senderInput.trim() });
    setIsSenderInputOpen(false);
  };

  const handleClearSender = () => {
    setSenderInput('');
    onFilterChange({ ...filters, sender: '' });
  };

  return (
    <div className="px-6 py-2.5 bg-stone-50/80 border-b border-stone-200 flex flex-col gap-2">
      {/* Top: Preset Pills & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-slate-400" />
          Filters:
        </span>

        {/* Unread Toggle Pill */}
        <button
          type="button"
          onClick={handleUnreadToggle}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            filters.unreadOnly
              ? 'bg-amber-600 text-white shadow-2xs font-semibold'
              : 'bg-white hover:bg-stone-100 text-slate-600 border border-stone-200'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>Unread Only</span>
        </button>

        {/* Date Presets */}
        {datePresets.map((preset) => {
          const isSelected = filters.datePreset === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleDatePresetClick(preset.value)}
              className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                isSelected
                  ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                  : 'bg-white hover:bg-stone-100 text-slate-600 border border-stone-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        {/* Sender Filter Input Pill */}
        <div className="relative">
          {isSenderInputOpen ? (
            <form onSubmit={handleSenderSubmit} className="flex items-center gap-1 bg-white border border-amber-500 rounded-full px-2 py-0.5 shadow-2xs">
              <input
                type="text"
                value={senderInput}
                onChange={(e) => setSenderInput(e.target.value)}
                placeholder="Sender name or email..."
                autoFocus
                className="text-xs text-slate-800 focus:outline-none w-36 px-1"
              />
              <button type="submit" className="p-0.5 text-amber-700 hover:text-amber-900">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsSenderInputOpen(false)}
                className="p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsSenderInputOpen(true)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                filters.sender
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-white hover:bg-stone-100 text-slate-600 border border-stone-200'
              }`}
            >
              <User className="w-3 h-3" />
              <span>{filters.sender ? `From: ${filters.sender}` : 'Filter by Sender'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom: Active Filter Chips & Clear All */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-medium">Active:</span>

          {filters.unreadOnly && (
            <ActiveFilterChip
              label="Status"
              value="Unread"
              onRemove={handleUnreadToggle}
            />
          )}

          {filters.datePreset && (
            <ActiveFilterChip
              label="Date"
              value={datePresets.find((p) => p.value === filters.datePreset)?.label || filters.datePreset}
              onRemove={() => onFilterChange({ ...filters, datePreset: '', dateFrom: '', dateTo: '' })}
            />
          )}

          {filters.sender && (
            <ActiveFilterChip
              label="Sender"
              value={filters.sender}
              onRemove={handleClearSender}
            />
          )}

          {filters.keyword && (
            <ActiveFilterChip
              label="Keyword"
              value={filters.keyword}
              onRemove={() => onFilterChange({ ...filters, keyword: '' })}
            />
          )}

          <button
            type="button"
            onClick={onClearFilters}
            className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 ml-2 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
