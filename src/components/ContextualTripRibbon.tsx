import React from 'react';
import { TripGroupStructure } from '../utils/argonDomainModel';
import {
  OperationalStatusPill,
  WorkspaceDensityMode,
} from './ui/OperationalStatusPill';

interface ContextualTripRibbonProps {
  group: TripGroupStructure;
  density: WorkspaceDensityMode;
  onChangeDensity: (mode: WorkspaceDensityMode) => void;
  onOpenCommandPalette: () => void;
}

export const ContextualTripRibbon: React.FC<ContextualTripRibbonProps> = ({
  group,
  density,
  onChangeDensity,
  onOpenCommandPalette,
}) => {
  const lead =
    group.travellers.find((t) => t.id === group.leadTravellerId) ||
    group.travellers[0];
  const provisionalCount = group.travellers.filter((t) => t.isProvisional).length;
  const missingFieldsCount = group.travellers.reduce(
    (sum, t) => sum + (t.missingFields?.length || 0),
    0
  );

  return (
    <div className="sticky top-14 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-2 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Persistent Breadcrumb Context */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
            {group.tripId}
          </span>
          <span className="font-semibold text-slate-900 truncate">
            {group.groupName}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700 font-medium">
            {group.travellers.length} Pax
          </span>
          <span className="text-slate-300 hidden md:inline">|</span>
          <span className="text-slate-600 hidden md:inline truncate">
            Lead:{' '}
            <strong className="text-slate-900">
              {lead?.fullName || 'Unassigned'}
            </strong>
          </span>
          <span className="text-slate-300 hidden lg:inline">|</span>
          <span className="font-mono text-[11px] text-slate-600 hidden lg:inline">
            {group.defaults.startDate || 'TBC'} → {group.defaults.endDate || 'TBC'}
          </span>

          {/* Semantic Status Pills */}
          <div className="flex items-center gap-1.5 ml-1">
            {missingFieldsCount > 0 ? (
              <OperationalStatusPill
                tier="critical"
                label={`${missingFieldsCount} Missing Details`}
              />
            ) : (
              <OperationalStatusPill tier="confirmed" label="Manifest Complete" />
            )}
            {provisionalCount > 0 && (
              <OperationalStatusPill
                tier="provisional"
                label={`${provisionalCount} Provisional`}
              />
            )}
          </div>
        </div>

        {/* Right: Quick Search (Cmd+K) & Density Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Global Operational Search (Cmd+K / Ctrl+K)"
          >
            <span>Search Ops...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500">
              ⌘K
            </kbd>
          </button>

          <div
            className="hidden sm:inline-flex rounded-md border border-slate-300 bg-slate-50 p-0.5"
            role="group"
            aria-label="Workspace visual density"
          >
            {(
              [
                { id: 'dense', label: 'Ops Dense' },
                { id: 'comfortable', label: 'Standard' },
                { id: 'editorial', label: 'Editorial' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeDensity(opt.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  density === opt.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
