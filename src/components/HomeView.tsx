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

  // Guided 8-Step Operational Workflow Progression
  const workflowSteps = [
    {
      step: 1,
      title: 'Client & Dates',
      tab: 'guests',
      done: Boolean(state.client?.name?.trim() && state.client?.startDate),
      detail: state.client?.name?.trim() || 'Enter lead client',
    },
    {
      step: 2,
      title: 'Travellers & Groups',
      tab: 'guests',
      done: (state.guests?.length || 0) > 0,
      detail: `${state.guests?.length || 0} Pax · ${state.namedGroups?.length || 0} Group(s)`,
    },
    {
      step: 3,
      title: 'Flights',
      tab: 'flights',
      done: (state.flights?.filter(f => f.status !== 'Cancelled').length || 0) > 0,
      detail: `${state.flights?.filter(f => f.status !== 'Cancelled').length || 0} Flights`,
    },
    {
      step: 4,
      title: 'Accommodation',
      tab: 'rooming',
      done: (state.rooms?.filter(r => r.status !== 'Cancelled').length || 0) > 0,
      detail: `${state.rooms?.filter(r => r.status !== 'Cancelled').length || 0} Stays`,
    },
    {
      step: 5,
      title: 'Transfers',
      tab: 'transfers',
      done: (state.transfers?.filter(t => t.status !== 'Cancelled').length || 0) > 0,
      detail: `${state.transfers?.filter(t => t.status !== 'Cancelled').length || 0} Transfers`,
    },
    {
      step: 6,
      title: 'Daily Programme',
      tab: 'activities',
      done: (state.activities?.filter(a => a.status !== 'Cancelled').length || 0) > 0,
      detail: `${state.activities?.filter(a => a.status !== 'Cancelled').length || 0} Activities`,
    },
    {
      step: 7,
      title: 'Drivers & Fleet',
      tab: 'drivers',
      done: driversAssignedCount > 0 || (state.drivers?.length || 0) > 0,
      detail: `${state.drivers?.length || 0} Drivers · ${state.vehicles?.length || 0} Fleet`,
    },
    {
      step: 8,
      title: 'PDF & Job Sheets',
      tab: 'printhub',
      done: state.publishing?.publishStatus === 'Published' || (state.activities?.length || 0) > 0,
      detail: 'Editorial PDF, Driver & Translator Sheets',
    },
  ];

  const completedStepsCount = workflowSteps.filter(s => s.done).length;

  return (
    <div className="w-full space-y-6 pb-8">
      
      {/* Main workspace heading with restored /hero-bg.jpg background */}
      <section className="relative w-full min-h-[250px] md:min-h-[280px] rounded-xl border border-slate-200 bg-[#1A3326] flex items-center overflow-hidden shadow-sm">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A3326]/95 via-[#1A3326]/85 to-[#1A3326]/65" />

        <div className="relative z-10 w-full max-w-5xl p-6 md:p-9 text-white space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Viemma Tours</span>
            <span className="text-xs text-white/75">{dateStr}</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-semibold leading-tight">Tour Operations Workspace</h1>
            <p className="max-w-2xl text-sm text-white/85 leading-relaxed">
              Manage clients, flights, transfers, accommodation, South African experience catalogue, operational job sheets, and client itineraries from one booking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onNewBooking}
              className="px-4 py-2.5 rounded-lg bg-[#D4AF37] text-[#1A3326] font-semibold text-sm hover:bg-[#e0c15b] transition cursor-pointer"
            >
              Create new itinerary
            </button>
            <button
              onClick={onLoadTemplate}
              className="px-4 py-2.5 rounded-lg border border-white/40 bg-white/10 backdrop-blur-xs text-white font-medium text-sm hover:bg-white/20 transition cursor-pointer"
            >
              Load sample booking
            </button>
            <button
              onClick={() => onSwitchTab('client-view')}
              className="px-4 py-2.5 rounded-lg border border-[#D4AF37]/50 bg-[#1A3326]/80 text-[#D4AF37] font-semibold text-sm hover:bg-[#1A3326] transition cursor-pointer"
            >
              Preview Mobile Client Itinerary
            </button>
          </div>
        </div>
      </section>

      {/* GUIDED 8-STEP OPERATIONAL WORKFLOW STEPPER */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
              STANDARD OPERATING PROCEDURE
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              Guided Trip Completion Workflow
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#1A3326] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-center">
            {completedStepsCount} of {workflowSteps.length} Steps Populated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {workflowSteps.map((ws) => (
            <button
              key={ws.step}
              type="button"
              onClick={() => onSwitchTab(ws.tab)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                ws.done
                  ? 'bg-emerald-50/50 border-emerald-200 hover:border-[#1A3326]'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`w-6 h-6 rounded-lg text-[11px] font-extrabold flex items-center justify-center ${
                  ws.done ? 'bg-[#1A3326] text-[#D4AF37]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {ws.step}
                </span>
                <span className={`text-[10px] font-bold ${ws.done ? 'text-emerald-800' : 'text-slate-400'}`}>
                  {ws.done ? 'Ready' : 'To Do'}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-snug">{ws.title}</span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">{ws.detail}</span>
              </div>
            </button>
          ))}
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
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Transfers</span>
              <Car size={16} className="text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{activeTransfersCount}</div>
            <p className="text-[11px] text-gray-500">Scheduled transfers & dispatches</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Arrivals</span>
              <Plane size={16} className="text-slate-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{arrivalsCount}</div>
            <p className="text-[11px] text-gray-500">Airport arrivals expected</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Trips</span>
              <FolderOpen size={16} className="text-slate-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{activeTripsCount}</div>
            <p className="text-[11px] text-gray-500">Active itineraries in workspace</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Driver Assignments</span>
              <Truck size={16} className="text-slate-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A3326]">{driversAssignedCount}</div>
            <p className="text-[11px] text-gray-500">Drivers currently dispatched</p>
          </div>
        </div>
      </div>

      {/* QUICK SHORTCUTS TO OPERATIONAL MODULES & RESOURCE DIRECTORIES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.15em] font-bold text-[#1A3326] flex items-center gap-1.5">
            Operational Modules & Directories
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <button 
            onClick={() => onSwitchTab('guests')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Clients</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Traveller Roster</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('activities')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-[#1A3326] flex items-center justify-center shrink-0">
              <Route size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Programme</span>
              <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">+ Add Activities</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('library')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">SA Catalogue</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">35+ Experiences</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('rooming')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Hotel size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Hotels</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Lodges & Stays</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('flights')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Plane size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Flights</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Arrivals & Deps</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('transfers')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Car size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Transfers</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Ground Dispatch</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('drivers')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Drivers</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Chauffeur Roster</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('fleet')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Truck size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Fleet</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Vehicles & Reg</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('timelines')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Timeline</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Master Sequence</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('printhub')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1A3326] text-[#D4AF37] flex items-center justify-center shrink-0">
              <Printer size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Print Hub</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">PDF & Job Sheets</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('client-view')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#1A3326] flex items-center justify-center shrink-0">
              <FolderOpen size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Client Mobile</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Digital Companion</span>
            </div>
          </button>

          <button 
            onClick={() => onSwitchTab('database')} 
            className="group bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center gap-2.5 text-center hover:bg-slate-50 hover:border-[#1A3326]/40 transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Plus size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block font-sans">Master DB</span>
              <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Hotels, Guides, Rates</span>
            </div>
          </button>
        </div>
      </div>

      {/* RECENT TOUR PROFILES & FILE ACTIONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen size={15} className="text-[#D4AF37]" />
            Recent Tour Profiles & File Actions
          </h3>
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg">
            Active Dossier: {state.ref || 'VT-2026-9999'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
          <div 
            onClick={onLoadTemplate} 
            className="flex items-center justify-between p-4 md:p-5 bg-slate-50 hover:bg-[#1A3326]/5 border border-gray-200 hover:border-[#1A3326]/30 rounded-xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-50 text-[#1A3326] flex items-center justify-center border border-emerald-100 shrink-0">
                <FolderOpen size={19} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Angola - SA Premium Corridor [Template]</span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">VT-2026-9999 • 6 Days • 4 Pax</span>
              </div>
            </div>
            <span className="text-xs text-[#1A3326] font-bold group-hover:translate-x-1 transition flex items-center gap-1">
              Load Template <ChevronRight size={14} />
            </span>
          </div>

          <div 
            onClick={onNewBooking} 
            className="flex items-center justify-between p-4 md:p-5 bg-slate-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 rounded-xl transition cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Plus size={19} />
              </div>
              <div>
                <span className="text-sm font-bold text-gray-900 block">Start Fresh Worksheet</span>
                <span className="text-xs text-gray-500 font-medium block mt-0.5">Completely reset and create new file master</span>
              </div>
            </div>
            <span className="text-xs text-gray-500 group-hover:text-rose-700 font-bold transition">Reset Worksheet</span>
          </div>
        </div>
      </div>

    </div>
  );
};
