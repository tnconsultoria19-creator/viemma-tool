import React, { useState } from 'react';
import { AppState, Transfer } from '../types';
import { Truck, Phone, Navigation, Play, CheckCircle2, MapPin, Clock, User, Shield, AlertCircle, FileText, Printer, Check } from 'lucide-react';

interface DriverItineraryViewProps {
  state: AppState;
  onUpdateState: (updated: Partial<AppState>) => void;
}

export const DriverItineraryView: React.FC<DriverItineraryViewProps> = ({ state, onUpdateState }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(state.drivers?.[0]?.id || 'all');
  const [activeTabDay, setActiveTabDay] = useState<'today' | 'tomorrow' | 'upcoming'>('today');

  const drivers = state.drivers || [];
  const transfers = state.transfers || [];

  const activeDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];
  const driverName = activeDriver?.name || 'Michael';

  const driverTransfers = transfers.filter(t => {
    if (selectedDriverId === 'all') return true;
    return t.driver === driverName || t.driver === activeDriver?.id;
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  const handleStatusUpdate = (transferId: number, status: Transfer['status']) => {
    const updated = transfers.map(t => t.id === transferId ? { ...t, status } : t);
    onUpdateState({ transfers: updated });
  };

  const nextAssignment = driverTransfers[0];

  return (
    <div className="w-full max-w-[900px] mx-auto space-y-6 pb-24 px-3 sm:px-6 animate-in fade-in">
      {/* MOBILE-FIRST HEADER */}
      <div className="bg-[#1A3326] text-white rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-black uppercase tracking-widest">
            <Shield size={14} /> Driver Portal & Execution Sheet
          </div>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#1A3326] text-xs font-black transition shadow-xs flex items-center gap-1"
          >
            <Printer size={13} /> Print
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Logged-in Driver / Operator</span>
            <h1 className="text-2xl font-bold font-serif text-white">{driverName}</h1>
            <p className="text-xs text-[#D4AF37] font-medium mt-0.5">Status: On Duty & Ready</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20 font-bold text-xs focus:outline-none"
            >
              <option value="all" className="text-gray-900">All Drivers (View Mode)</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id} className="text-gray-900">{d.name} ({d.status})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex items-center gap-2 pt-2">
          {(['today', 'tomorrow', 'upcoming'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTabDay(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTabDay === tab ? 'bg-[#D4AF37] text-[#1A3326]' : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* NEXT ASSIGNMENT FEATURED CARD */}
      {nextAssignment && activeTabDay === 'today' && (
        <div className="bg-gradient-to-br from-emerald-900 to-[#1A3326] text-white rounded-3xl p-6 shadow-xl border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Clock size={14} /> Next Assignment — {nextAssignment.time}
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
              ● {nextAssignment.status || 'Assigned'}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif">{nextAssignment.type}: {nextAssignment.from} → {nextAssignment.to}</h3>
            <p className="text-xs text-gray-300">Flight: <strong className="text-white font-mono">{nextAssignment.flight || 'N/A'}</strong> | Passengers: <strong className="text-white">{nextAssignment.paxCount}</strong></p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
            <div className="bg-white/10 p-3 rounded-2xl">
              <span className="text-[10px] text-gray-300 uppercase tracking-wider block font-bold">Lead Passenger</span>
              <p className="font-bold text-white text-sm">{state.client.name}</p>
              <p className="text-gray-300 text-xs">{state.client.phone}</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl">
              <span className="text-[10px] text-gray-300 uppercase tracking-wider block font-bold">Vehicle & Luggage</span>
              <p className="font-bold text-white text-sm">{nextAssignment.vehicle || 'Assigned Fleet Vehicle'}</p>
              <p className="text-gray-300 text-xs">Hand: {nextAssignment.bagHand} | Check-in: {nextAssignment.bagCheck}</p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <a
              href={`tel:${state.client.phone}`}
              className="flex-1 py-3 px-4 rounded-xl bg-[#D4AF37] text-[#1A3326] font-extrabold text-xs flex items-center justify-center gap-2 transition hover:bg-[#c29d2f] active:scale-95 shadow-md"
            >
              <Phone size={15} /> CALL LEAD PASSENGER
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(nextAssignment.to)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition hover:bg-white/20 active:scale-95"
            >
              <Navigation size={15} /> OPEN LOCATION
            </a>
          </div>
        </div>
      )}

      {/* CHRONOLOGICAL ASSIGNMENTS LIST */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-1">
          {activeTabDay === 'today' ? "Today's Chronological Schedule" : `Scheduled Services (${activeTabDay})`}
        </h2>

        {driverTransfers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-xs text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
              <Truck size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Services Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">There are no assignments for this driver for the selected period.</p>
          </div>
        ) : (
          driverTransfers.map((t, idx) => {
            const isCompleted = t.status === 'Completed';
            return (
              <div 
                key={t.id} 
                className={`bg-white rounded-3xl border transition shadow-sm p-6 space-y-5 ${
                  isCompleted ? 'opacity-60 bg-gray-50/50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#1A3326] text-[#D4AF37] font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">{t.time}</span>
                        <span className="text-xs font-bold text-gray-600 uppercase">{t.type}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">{t.from} → {t.to}</h3>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-800'
                  }`}>
                    ● {t.status || 'Assigned'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Flight & Passengers</span>
                    <p className="font-bold text-gray-900">Flight: {t.flight || 'None'}</p>
                    <p className="text-gray-600">👥 {t.paxCount} Passengers</p>
                    <p className="text-gray-500 font-mono text-[11px]">Lead: {state.client.name}</p>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Vehicle & Luggage</span>
                    <p className="font-bold text-gray-900">{t.vehicle || 'Assigned Fleet'}</p>
                    <p className="text-gray-600">🧳 Hand: {t.bagHand} | Check-in: {t.bagCheck}</p>
                    <p className="text-gray-500 font-mono text-[11px]">Sign: "{t.sign}"</p>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Special Instructions</span>
                    <p className="font-bold text-gray-900">{t.meet || 'Standard Meet & Greet'}</p>
                    {t.notes && <p className="text-amber-800 mt-1">⚠️ {t.notes}</p>}
                  </div>
                </div>

                {/* Touch Status Workflow Buttons */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${state.client.phone}`}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Phone size={13} /> Call Passenger
                    </a>
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(t.to)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Navigation size={13} /> Navigate
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['Assigned', 'EN ROUTE', 'ARRIVED', 'PASSENGERS COLLECTED', 'Completed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleStatusUpdate(t.id, st)}
                        className={`px-3 py-2 rounded-xl text-[11px] font-bold transition active:scale-95 shadow-xs ${
                          t.status === st 
                            ? 'bg-[#1A3326] text-[#D4AF37] ring-2 ring-[#D4AF37]' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
