import React, { useState, useEffect, useMemo } from 'react';
import {
  TripGroupStructure,
  FlightRecord,
  HotelBookingRecord,
  DriverProfileRecord,
} from '../utils/argonDomainModel';

export type OperationalNavTab = 'clients' | 'flights' | 'transfers' | 'hotels' | 'programme' | 'timeline' | 'drivers' | 'fleet' | 'finance';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  groups: TripGroupStructure[];
  flights: FlightRecord[];
  hotels: HotelBookingRecord[];
  drivers: DriverProfileRecord[];
  onSelectTrip: (tripId: string) => void;
  onNavigateTab: (tab: OperationalNavTab, recordId?: string) => void;
}

interface SearchHit {
  id: string;
  category: 'Trip' | 'Traveller' | 'Flight' | 'Driver' | 'Hotel';
  title: string;
  subtitle: string;
  badge: string;
  action: () => void;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  groups,
  flights,
  hotels,
  drivers,
  onSelectTrip,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    const hits: SearchHit[] = [];

    for (const grp of groups) {
      if (
        !q ||
        grp.tripId.toLowerCase().includes(q) ||
        grp.groupName.toLowerCase().includes(q)
      ) {
        hits.push({
          id: `trip_${grp.id}`,
          category: 'Trip',
          title: `${grp.tripId} — ${grp.groupName}`,
          subtitle: `${grp.travellers.length} Pax • ${grp.defaults.destination || 'Southern Africa'}`,
          badge: 'Trip Workspace',
          action: () => {
            onSelectTrip(grp.tripId);
            onNavigateTab('clients');
            onClose();
          },
        });
      }

      for (const t of grp.travellers) {
        if (
          q &&
          (t.fullName.toLowerCase().includes(q) ||
            (t.passportNo || '').toLowerCase().includes(q) ||
            (t.isProvisional ? 'provisional' : '').includes(q))
        ) {
          hits.push({
            id: `trv_${t.id}`,
            category: 'Traveller',
            title: t.fullName,
            subtitle: `Trip ${grp.tripId} (${grp.groupName}) • ${
              t.isLead ? 'Lead' : t.category
            }`,
            badge: t.isProvisional ? 'Provisional' : 'Confirmed',
            action: () => {
              onSelectTrip(grp.tripId);
              onNavigateTab('clients', t.id);
              onClose();
            },
          });
        }
      }
    }

    for (const fl of flights) {
      if (
        q &&
        (fl.flightNumber.toLowerCase().includes(q) ||
          (fl.pnr || '').toLowerCase().includes(q) ||
          (fl.airline || '').toLowerCase().includes(q))
      ) {
        hits.push({
          id: `flt_${fl.id}`,
          category: 'Flight',
          title: `${fl.flightNumber} (${fl.direction || 'Flight'})`,
          subtitle: `Trip ${fl.tripId} • ${fl.arrivalDate || fl.departureDate || ''} @ ${
            fl.arrivalTime || fl.departureTime || 'TBC'
          } • PNR: ${fl.pnr || 'N/A'}`,
          badge: 'Flights',
          action: () => {
            onSelectTrip(fl.tripId);
            onNavigateTab('flights', fl.id);
            onClose();
          },
        });
      }
    }

    for (const drv of drivers) {
      if (
        q &&
        (drv.fullName.toLowerCase().includes(q) ||
          drv.phone.toLowerCase().includes(q))
      ) {
        hits.push({
          id: `drv_${drv.id}`,
          category: 'Driver',
          title: drv.fullName,
          subtitle: `Phone: ${drv.phone} • PrDP: ${
            drv.prdpExpiryDate || 'Not Provided'
          }`,
          badge: drv.status,
          action: () => {
            onNavigateTab('drivers', drv.id);
            onClose();
          },
        });
      }
    }

    for (const h of hotels) {
      if (q && h.propertyName.toLowerCase().includes(q)) {
        hits.push({
          id: `htl_${h.id}`,
          category: 'Hotel',
          title: h.propertyName,
          subtitle: `Trip ${h.tripId} • ${h.checkInDate} to ${h.checkOutDate}`,
          badge: h.settlementStatus,
          action: () => {
            onSelectTrip(h.tripId);
            onNavigateTab('hotels', h.id);
            onClose();
          },
        });
      }
    }

    return hits.slice(0, 15);
  }, [query, groups, flights, drivers, hotels, onSelectTrip, onNavigateTab, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <span className="text-slate-400 font-mono text-sm">⌘K</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to Trip (VT-2026-001), Traveller name, Flight (BA059), PNR, or Driver..."
            className="w-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 text-xs text-slate-500 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching operational records found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-4 transition cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {item.category}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
                  {item.badge} ↵
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
