import React from 'react';
import { AppState } from '../types';
import { 
  Users, 
  Plane, 
  Hotel, 
  Route, 
  Coins, 
  Printer, 
  Clock, 
  Signal, 
  CheckCircle, 
  FolderOpen,
  Car
} from 'lucide-react';

interface HomeViewProps {
  state: AppState;
  onSwitchTab: (tabId: string) => void;
  onLoadTemplate: () => void;
  onNewBooking: () => void;
  totalCost: number;
  netProfit: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  onSwitchTab,
  onLoadTemplate,
  onNewBooking,
  totalCost,
  netProfit
}) => {
  const dateStr = new Date().toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Hero Welcome banner - UNBLURRED background */}
      <div 
        className="w-full min-h-[260px] rounded-lg border border-gray-300 relative flex items-end overflow-hidden shadow-sm"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.1) 100%), url('https://images.pexels.com/photos/20406699/pexels-photo-20406699.jpeg?auto=compress&cs=tinysrgb&w=1200')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="p-6 md:p-8 max-w-2xl relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#065f46] bg-white px-3 py-1 rounded-full border border-accentBorder shadow-sm">Workspace Home</span>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">{dateStr}</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Viemma Tours Workspace OS</h1>
          <p className="text-xs font-medium text-gray-700 leading-relaxed mt-1.5">
            Configure premium multi-day itineraries and regional corridor logistics across Southern Africa. Start planning for your group.
          </p>

          {/* Mini Stats Row */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <div className="bg-white/90 border border-gray-200 rounded-lg px-4 py-2 shadow-sm min-w-[100px]">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Est. Revenue</span>
              <span className="text-sm font-bold text-gray-900">R {(totalCost + (state.finance.marginType === '%' ? totalCost * (state.finance.margin / 100) : state.finance.margin)).toLocaleString()}</span>
            </div>
            <div className="bg-white/90 border border-gray-200 rounded-lg px-4 py-2 shadow-sm min-w-[100px]">
              <span className="text-[9px] text-[#065f46] font-bold uppercase tracking-wider block">Net Profit</span>
              <span className="text-sm font-bold text-[#065f46]">R {netProfit.toLocaleString()}</span>
            </div>
            <div className="bg-white/90 border border-gray-200 rounded-lg px-4 py-2 shadow-sm min-w-[100px]">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Guests Roster</span>
              <span className="text-sm font-bold text-gray-900">{state.guests.length} Pax</span>
            </div>
            <div className="bg-white/90 border border-gray-200 rounded-lg px-4 py-2 shadow-sm min-w-[100px]">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Days</span>
              <span className="text-sm font-bold text-[#065f46]">{state.client.startDate && state.client.endDate ? state.client.durationText : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <i className="fa-solid fa-bolt text-accent text-xs"></i> Quick Planning Modules
          </h2>
          <span className="text-[10px] text-gray-400 font-semibold uppercase">Jump to workflow</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <button onClick={() => onSwitchTab('guests')} className="action-card bg-white border border-gray-200 hover:border-accent hover:shadow-md p-4 rounded-lg flex flex-col items-center gap-2.5 text-center transition group">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#7c3aed] flex items-center justify-center text-sm group-hover:scale-110 transition">
              <Users size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Intake & Guests</span>
              <span className="text-[9px] text-gray-400 font-medium">Roster & Profile</span>
            </div>
          </button>

          <button onClick={() => onSwitchTab('flights')} className="action-card bg-white border border-gray-200 hover:border-accent hover:shadow-md p-4 rounded-lg flex flex-col items-center gap-2.5 text-center transition group">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center text-sm group-hover:scale-110 transition">
              <Plane size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Flights Panel</span>
              <span className="text-[9px] text-gray-400 font-medium">Airlines & Stops</span>
            </div>
          </button>

          <button onClick={() => onSwitchTab('transfers')} className="action-card bg-white border border-gray-200 hover:border-accent hover:shadow-md p-4 rounded-lg flex flex-col items-center gap-2.5 text-center transition group">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#d97706] flex items-center justify-center text-sm group-hover:scale-110 transition">
              <Car size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Logistics Transfers</span>
              <span className="text-[9px] text-gray-400 font-medium">Split Assigned Pax</span>
            </div>
          </button>

          <button onClick={() => onSwitchTab('rooming')} className="action-card bg-white border border-gray-200 hover:border-accent hover:shadow-md p-4 rounded-lg flex flex-col items-center gap-2.5 text-center transition group">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#0d9668] flex items-center justify-center text-sm group-hover:scale-110 transition">
              <Hotel size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Rooming Board</span>
              <span className="text-[9px] text-gray-400 font-medium">Nights & Matrices</span>
            </div>
          </button>

          <button onClick={() => onSwitchTab('activities')} className="action-card bg-white border border-gray-200 hover:border-accent hover:shadow-md p-4 rounded-lg flex flex-col items-center gap-2.5 text-center transition group">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-[#e11d48] flex items-center justify-center text-sm group-hover:scale-110 transition">
              <Route size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Activities</span>
              <span className="text-[9px] text-gray-400 font-medium">Timeline Timeline</span>
            </div>
          </button>

          <button onClick={() => onSwitchTab('exporthub')} className="action-card bg-white border border-gray-200 hover:border-accent hover:shadow-md p-4 rounded-lg flex flex-col items-center gap-2.5 text-center transition group">
            <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center text-sm group-hover:scale-110 transition">
              <Printer size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 block">Print Hub</span>
              <span className="text-[9px] text-gray-400 font-medium">Generate PDFs</span>
            </div>
          </button>
        </div>
      </div>

      {/* TWO COLUMN ROW: RECENT FILES & SYSTEM STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* RECENT FILES */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen size={14} className="text-accent" />
              Recent Tour Profiles
            </h3>
            <span className="text-[9px] font-bold text-gray-400 uppercase">LocalStorage</span>
          </div>

          <div className="space-y-2">
            <div onClick={onLoadTemplate} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-[#ecfdf5] border border-transparent hover:border-[#a7f3d0] rounded-lg transition cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#ecfdf5] flex items-center justify-center text-accent border border-accentBorder"><i className="fa-solid fa-folder"></i></div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Angola - SA Premium Corridor</span>
                  <span className="text-[9px] text-gray-400 font-medium">VT-2026-9999 • 6 Days • 4 Pax</span>
                </div>
              </div>
              <span className="text-[10px] text-accent font-bold group-hover:translate-x-1 transition flex items-center">Load Template <i className="fa-solid fa-chevron-right ml-1"></i></span>
            </div>

            <div onClick={onNewBooking} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-transparent rounded-lg transition cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-500"><i className="fa-solid fa-plus"></i></div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Start Fresh Worksheet</span>
                  <span className="text-[9px] text-gray-400 font-medium">Completely reset and create new file master</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 group-hover:text-gray-900 font-medium transition">Reset</span>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <Signal size={14} className="text-accent" />
              Local Workspace Services
            </h3>
            <span className="badge bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">Online</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <span className="font-medium text-gray-700 flex items-center gap-2"><i className="fa-solid fa-calculator text-[#065f46]"></i> Commercial Pricing Engine</span>
              <span className="font-bold text-[#065f46] flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Active</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <span className="font-medium text-gray-700 flex items-center gap-2"><i className="fa-solid fa-cloud-arrow-up text-blue-500"></i> Auto-Save (LocalStorage)</span>
              <span className="font-bold text-[#065f46] flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Active</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
              <span className="font-medium text-gray-700 flex items-center gap-2"><i className="fa-solid fa-print text-[#7c3aed]"></i> jsPDF Document Compiler</span>
              <span className="font-bold text-[#065f46] flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> Active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
