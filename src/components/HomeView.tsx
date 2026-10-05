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
  Sparkles,
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
    <div className="w-full space-y-6 md:space-y-7 animate-in fade-in duration-300">
      
      {/* Hero Welcome banner - Clean Editorial Rectangular Card */}
      <div 
        className="w-full min-h-[320px] md:min-h-[380px] rounded-2xl md:rounded-3xl relative flex items-end overflow-hidden shadow-lg border border-white/10"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/7843687/pexels-photo-7843687.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Controlled Hero Readability System: Natural photographic gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25 sm:from-black/90 sm:via-black/50 sm:to-black/20 z-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent z-0" />

        <div className="p-6 md:p-10 w-full max-w-4xl relative z-10 text-white space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 shadow-xs">
              Operational Command Centre
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-200 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 shadow-xs">
              {dateStr}
            </span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-serif leading-tight">
              Viemma Tours Operations
            </h1>
            <p className="text-xs md:text-sm text-gray-100 font-medium max-w-2xl leading-relaxed">
              Real-time dispatching, fleet tracking, driver itineraries, and multi-day luxury safari execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onNewBooking}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#1A3326] font-black text-xs hover:bg-[#b89528] transition shadow-md flex items-center gap-2"
            >
              <Plus size={15} /> Create New Itinerary
            </button>
            <button
              onClick={onLoadTemplate}
              className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-bold text-xs hover:bg-white/20 transition border border-white/20 flex items-center gap-2"
            >
              Load Sample Template
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S BUSINESS METRICS (Operational Command Centre) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.15em] font-bold text-[#1A3326] flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#D4AF37]" /> Today's Business Overview
          </h2>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Real-Time Status</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Transfers</span>
              <Car size={16} className="text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{activeTransfersCount}</div>
            <p className="text-[11px] text-gray-500">Scheduled transfers & dispatches</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Arrivals</span>
              <Plane size={16} className="text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{arrivalsCount}</div>
            <p className="text-[11px] text-gray-500">Airport arrivals expected</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Trips</span>
              <FolderOpen size={16} className="text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{activeTripsCount}</div>
            <p className="text-[11px] text-gray-500">Active itineraries in workspace</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Driver Assignments</span>
              <Truck size={16} className="text-purple-600" />
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
            <Sparkles size={13} className="text-[#D4AF37]" /> Operational Modules
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 md:gap-4">
          <button 
            onClick={() => onSwitchTab('guests')} 
            className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-3 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1A3326]" />
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#7c3aed] flex items-center justify-center group-hover:scale-110 transition duration-300 shrink-0">
              <Users size={19} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Clients & Pax</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Roster</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('flights')} 
            className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-3 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1A3326]" />
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center group-hover:scale-110 transition duration-300 shrink-0">
              <Plane size={19} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Flights</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Schedules</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('transfers')} 
            className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-3 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1A3326]" />
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#d97706] flex items-center justify-center group-hover:scale-110 transition duration-300 shrink-0">
              <Car size={19} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Transfers</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Dispatch</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('fleet')} 
            className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-3 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1A3326]" />
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition duration-300 shrink-0">
              <Truck size={19} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Transport Fleet</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Vehicles</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('drivers')} 
            className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-3 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1A3326]" />
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition duration-300 shrink-0">
              <Users size={19} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Drivers</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Directory</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('timelines')} 
            className="group bg-white border border-gray-100 p-4 md:p-5 rounded-2xl flex flex-col items-center gap-3 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden focus:outline-none"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#1A3326]" />
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition duration-300 shrink-0">
              <Calendar size={19} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Daily Timelines</span>
              <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block mt-0.5">Operations</span>
            </div>
          </button>
        </div>
      </div>

      {/* RECENT TOUR PROFILES & FILE ACTIONS */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 p-5 md:p-6 shadow-xs space-y-4">
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
            className="flex items-center justify-between p-4 md:p-5 bg-slate-50 hover:bg-[#1A3326]/5 border border-gray-100 hover:border-[#1A3326]/20 rounded-2xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1A3326] flex items-center justify-center border border-emerald-100 shrink-0">
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
            className="flex items-center justify-between p-4 md:p-5 bg-slate-50 hover:bg-rose-50 border border-gray-100 hover:border-rose-100 rounded-2xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
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
