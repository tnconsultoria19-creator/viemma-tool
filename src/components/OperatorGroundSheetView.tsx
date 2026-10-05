import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { getOperatorServiceView } from '../utils/roleFiltering';
import { buildNormalizedTimeline } from '../utils/timelineEngine';
import { 
  Car, 
  MapPin, 
  Clock, 
  Users, 
  Phone, 
  Luggage, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Printer, 
  Plane, 
  ShieldCheck, 
  Compass, 
  Navigation,
  MessageSquare,
  Filter,
  Check
} from 'lucide-react';

interface OperatorGroundSheetViewProps {
  state: AppState;
  serviceId?: string | number;
  onBackToWorkspace?: () => void;
}

export const OperatorGroundSheetView: React.FC<OperatorGroundSheetViewProps> = ({ 
  state: rawState, 
  serviceId: initialServiceId,
  onBackToWorkspace 
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string | number | undefined>(initialServiceId);
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');

  // Apply strict zero-financial operator projection
  const state = useMemo(() => getOperatorServiceView(rawState, selectedServiceId), [rawState, selectedServiceId]);

  // Normalized timeline events with verified dates
  const timeline = useMemo(() => buildNormalizedTimeline(state), [state]);

  // Extract all distinct dates across verified timeline
  const allDates = useMemo(() => {
    return Array.from(new Set(timeline.map(e => e.date).filter(Boolean)));
  }, [timeline]);

  const filteredTransfers = state.transfers.filter(t => {
    if (activeDateFilter === 'all') return true;
    return t.date === activeDateFilter;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 font-sans">
      
      {/* High-Contrast Mobile Header */}
      <div className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow">
              <Navigation size={16} />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">VIEMMA GROUND OPS</span>
              <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase block -mt-0.5">
                Driver & Guide Logistics Sheet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Service Scope Selector */}
            <select
              value={selectedServiceId ? String(selectedServiceId) : 'all'}
              onChange={(e) => setSelectedServiceId(e.target.value === 'all' ? undefined : e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold focus:outline-none"
            >
              <option value="all">Full Ground Manifest</option>
              {rawState.transfers.map(t => (
                <option key={`trans_${t.id}`} value={`trans_${t.id}`}>
                  Transfer {t.id}: {t.from.split(',')[0]} → {t.to.split(',')[0]}
                </option>
              ))}
              {rawState.activities.map(a => (
                <option key={`act_${a.id}`} value={`act_${a.id}`}>
                  Experience {a.id}: {a.name}
                </option>
              ))}
            </select>

            <button 
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
              title="Print Manifest"
            >
              <Printer size={16} />
            </button>
            {onBackToWorkspace && (
              <button 
                onClick={onBackToWorkspace}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow"
              >
                Owner Cockpit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Mission Briefing Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-0.5">
                Airport Meeting Signboard Text
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {state.transfers[0]?.sign || `${state.client.name.toUpperCase()} EXPEDITION`}
              </h1>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-0.5">Master File Ref</span>
              <span className="text-sm font-mono font-bold text-amber-300">{state.ref}</span>
            </div>
          </div>

          {/* Key Logistics Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passengers</span>
              <span className="text-xl font-black text-amber-400 mt-0.5 block">{state.guests.length} Pax</span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked & Hand Bags</span>
              <span className="text-xl font-black text-white mt-0.5 block">
                {state.transfers.reduce((sum, t) => sum + (t.bagCheck || 0) + (t.bagHand || 0), 0) || (state.guests.length * 2)} Bags
              </span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Contact</span>
              <span className="text-sm font-bold text-white mt-0.5 block truncate">{state.client.name}</span>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">24/7 Ops Desk</span>
              <span className="text-sm font-bold text-amber-400 mt-0.5 block">+27 21 555 0199</span>
            </div>
          </div>
        </div>

        {/* Guest Passenger Manifest (Names + Ages + Medical) */}
        <div className="bg-slate-800/70 border border-slate-700/70 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-amber-400" /> Passenger Roster & Ground Assistance
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.guests.map(guest => (
              <div key={guest.id} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/60 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{guest.first} {guest.last}</span>
                    {guest.isLead && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                        Lead
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Category: <strong className="text-slate-300">{guest.age}</strong> {guest.country ? `• ${guest.country}` : ''}
                  </p>
                  {(guest.accessibilityMobility?.length || guest.mob?.length || guest.notes) ? (
                    <p className="text-[11px] text-amber-300/90 font-medium pt-0.5">
                      ⚠️ Note: {guest.accessibilityMobility?.join(', ') || guest.mob?.join(', ') || guest.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Movements / Transfers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Car size={18} className="text-amber-400" /> Scheduled Vehicle Movements ({filteredTransfers.length})
            </h2>
          </div>

          <div className="space-y-4">
            {filteredTransfers.map((tr, index) => {
              const assignedGuests = state.guests.filter(g => tr.paxIds?.includes(g.id));

              return (
                <div key={tr.id} className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-md space-y-4">
                  
                  {/* Header of Movement */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow">
                        <Clock size={14} /> {tr.time}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-300 block">{tr.date}</span>
                        <h3 className="text-base font-bold text-white">{tr.type} (Assignment {tr.id})</h3>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold w-fit">
                      ✓ {tr.serviceStatus || tr.status}
                    </span>
                  </div>

                  {/* Pickup & Dropoff Routing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/70 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Pickup Point</span>
                      <p className="text-sm font-bold text-white">{tr.from}</p>
                      <p className="text-slate-400">{tr.meet || 'Main Arrival Concourse / Hotel Reception'}</p>
                      {tr.flight && (
                        <p className="text-amber-300 font-mono font-bold pt-1">
                          ✈️ Flight Number: {tr.flight}
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/70 space-y-1.5">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Drop-off Destination</span>
                      <p className="text-sm font-bold text-white">{tr.to}</p>
                      <p className="text-slate-400">Estimated transit: {tr.dur || '30 min'} ({tr.dist || '22 km'})</p>
                    </div>
                  </div>

                  {/* Assigned Passengers */}
                  {assignedGuests.length > 0 && (
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-700/40 text-xs text-slate-300">
                      <strong>Assigned Passengers ({assignedGuests.length}):</strong>{' '}
                      {assignedGuests.map(g => `${g.first} ${g.last}`).join(', ')}
                    </div>
                  )}

                  {/* Assigned Vehicle & Driver */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 block">Vehicle Specification:</span>
                      <span className="text-sm font-bold text-white">{tr.vehicle || 'Mercedes V-Class — Luxury Chauffeur'}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block">Assigned Driver:</span>
                      <span className="text-sm font-bold text-amber-400">{tr.driver || 'Sipho Khumalo'} ({tr.driverPhone || '+27 60 555 1234'})</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block">Signboard Text:</span>
                      <span className="text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 block">
                        "{tr.sign || 'HARRISON EXPEDITION'}"
                      </span>
                    </div>
                  </div>

                  {/* Driver Special VIP Notes */}
                  {tr.notes && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
                      <span><strong>Driver Note:</strong> {tr.notes}</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
