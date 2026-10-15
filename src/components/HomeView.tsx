import React from 'react';
import { AppState } from '../types';
import { 
  Users, 
  Plane, 
  Hotel, 
  Route, 
  Printer, 
  FolderOpen,
  Car,
  ChevronRight,
  Plus,
  Truck,
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface HomeViewProps {
  state: AppState;
  onSwitchTab: (tabId: string) => void;
  onLoadTemplate: () => void;
  onNewBooking: () => void;
  totalCost?: number;
  netProfit?: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  onSwitchTab,
  onLoadTemplate,
  onNewBooking
}) => {
  const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  // Calculate operational stats
  const activeTransfersCount = state.transfers?.length || 0;
  const arrivalsCount = state.transfers?.filter(t => t.type === 'Airport Arrival').length || 0;
  const activeTripsCount = state.client?.name && state.client.name !== '' ? 1 : 0;
  const driversAssignedCount = state.drivers?.filter(d => d.status === 'Assigned').length || 0;

  return (
    <div className="w-full space-y-6 pb-8">
      
      {/* Main workspace heading */}
      <section className="w-full min-h-[250px] md:min-h-[280px] rounded-md border border-slate-200 bg-[#1A3326] flex items-center">
        <div className="w-full max-w-5xl p-6 md:p-9 text-white space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-xs font-semibold text-amber-300">Viemma Tours</span>
            <span className="text-xs text-white/70">{dateStr}</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-semibold leading-tight">Tour operations</h1>
            <p className="max-w-2xl text-sm text-white/80 leading-relaxed">
              Manage clients, flights, transfers, accommodation and the daily programme from one booking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onNewBooking}
              className="px-4 py-2.5 rounded-md bg-[#D4AF37] text-[#1A3326] font-semibold text-sm hover:bg-[#e0c15b] transition"
            >
              Create new itinerary
            </button>
            <button
              onClick={onLoadTemplate}
              className="px-4 py-2.5 rounded-md border border-white/40 text-white font-medium text-sm hover:bg-white/10 transition"
            >
              Load sample booking
            </button>
          </div>
        </div>
      </section>

      {/* TODAY'S BUSINESS METRICS (Operational Command Centre) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Today's overview
          </h2>
          <span className="text-xs text-slate-500 font-normal">Real-Time Status</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-md p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Transfers</span>
              <Car size={16} className="text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{activeTransfersCount}</div>
            <p className="text-[11px] text-gray-500">Scheduled transfers & dispatches</p>
          </div>

          <div className="bg-white rounded-md p-5 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Arrivals</span>
              <Plane size={16} className="text-slate-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{arrivalsCount}</div>
            <p className="text-[11px] text-gray-500">Airport arrivals expected</p>
          </div>

          <div className="bg-white rounded-md p-5 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Trips</span>
              <FolderOpen size={16} className="text-slate-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{activeTripsCount}</div>
            <p className="text-[11px] text-gray-500">Active itineraries in workspace</p>
          </div>

          <div className="bg-white rounded-md p-5 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Driver Assignments</span>
              <Truck size={16} className="text-slate-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{driversAssignedCount}</div>
            <p className="text-[11px] text-gray-500">Drivers currently dispatched</p>
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUTS TO OPERATIONAL MODULES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.15em] font-bold text-[#1A3326] flex items-center gap-1.5">
            Workspace
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-3.5">
          <button 
            onClick={() => onSwitchTab('guests')} 
            className="group bg-white border border-slate-200 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Clients</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Roster</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('activities')} 
            className="group bg-white border border-slate-200 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Route size={18} />
            </div>
            <div>
              <span className="text-xs font-black text-gray-900 block font-sans">Programme</span>
              <span className="text-[9px] text-amber-700 font-bold uppercase tracking-wider block mt-0.5">Experiences</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('timelines')} 
            className="group bg-white border border-gray-100 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Timelines</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Daily Ops</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('rooming')} 
            className="group bg-white border border-gray-100 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Hotel size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Hotels</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Lodges</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('flights')} 
            className="group bg-white border border-gray-100 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Plane size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Flights</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Schedules</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('transfers')} 
            className="group bg-white border border-gray-100 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Car size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Transfers</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Dispatch</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('fleet')} 
            className="group bg-white border border-gray-100 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Fleet</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Vehicles</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('drivers')} 
            className="group bg-white border border-gray-100 p-3.5 md:p-4 rounded-md flex flex-col items-center gap-2.5 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            
            <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Drivers</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Directory</span>
            </div>
          </button>
        </div>
      </div>

      {/* RECENT TOUR PROFILES & FILE ACTIONS */}
      <div className="bg-white rounded-md md:rounded-3xl border border-gray-100 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen size={15} className="text-[#D4AF37]" />
            Recent Tour Profiles & File Actions
          </h3>
          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg">
            Active Dossier: {state.ref || 'VT-2026-9999'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
          <div 
            onClick={onLoadTemplate} 
            className="flex items-center justify-between p-4 md:p-5 bg-slate-50 hover:bg-[#1A3326]/5 border border-gray-100 hover:border-[#1A3326]/20 rounded-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-md bg-emerald-50 text-[#1A3326] flex items-center justify-center border border-emerald-100 shrink-0">
                <FolderOpen size={19} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Angola - SA Premium Corridor [Template]</span>
                <span className="text-xs text-gray-400 font-medium block mt-0.5">VT-2026-9999 • 6 Days • 4 Pax</span>
              </div>
            </div>
            <span className="text-xs text-[#1A3326] font-bold group-hover:translate-x-1 transition flex items-center gap-1">
              Load Template <ChevronRight size={14} />
            </span>
          </div>

          <div 
            onClick={onNewBooking} 
            className="flex items-center justify-between p-4 md:p-5 bg-slate-50 hover:bg-rose-50 border border-gray-100 hover:border-rose-100 rounded-md transition cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Plus size={19} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Start Fresh Worksheet</span>
                <span className="text-xs text-gray-400 font-medium block mt-0.5">Completely reset and create new file master</span>
              </div>
            </div>
            <span className="text-xs text-gray-400 group-hover:text-rose-700 font-bold transition">Reset Worksheet</span>
          </div>
        </div>
      </div>

    </div>
  );
};
