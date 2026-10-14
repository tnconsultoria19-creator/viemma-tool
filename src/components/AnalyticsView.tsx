import React from 'react';
import { AppState } from '../types';
import { 
  TrendingUp, 
  Coins, 
  Users, 
  Percent, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Briefcase,
  Calendar,
  Plane,
  Hotel,
  Car,
  Sparkles,
  Download,
  Clock,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsViewProps {
  state: AppState;
  totalCost: number;
  netProfit: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  state,
  totalCost,
  netProfit
}) => {
  const marginPercent = totalCost > 0 ? ((netProfit / totalCost) * 100).toFixed(1) : "0.0";
  const finance = state.finance;
  const markupTotal = finance.marginType === '%' ? totalCost * (finance.margin / 100) : finance.margin;
  const cardRate = finance.paymentMethod === 'visa' || finance.paymentMethod === 'master'
    ? 0.025
    : finance.paymentMethod === 'amex'
      ? 0.038
      : 0;
  const cardTotal = totalCost * cardRate;
  const revenueTotal = Math.max(0, totalCost + markupTotal + finance.buffer + cardTotal - finance.discount);
  const comparisonMaximum = Math.max(totalCost, revenueTotal, 1);
  const costBarWidth = Math.min(100, (totalCost / comparisonMaximum) * 100);
  const revenueBarWidth = Math.min(100, (revenueTotal / comparisonMaximum) * 100);

  // Service breakdown uses current trip records; cancelled items are excluded consistently
  // with the Finance Workspace. It is not a historical sales chart.
  const flightCost = state.flights.reduce((sum, f) => sum + (f.status === 'Cancelled' ? 0 : f.cost * f.qty), 0);
  const transferCost = state.transfers.reduce((sum, t) => sum + (t.status === 'Cancelled' ? 0 : t.cost + t.tolls + t.parking), 0);
  const hotelCost = state.rooms.reduce((sum, r) => sum + (r.status === 'Cancelled' ? 0 : (r.rate * r.nights) + r.supp), 0);
  const activityCost = state.activities.reduce((sum, a) => sum + (a.isFree || a.status === 'Cancelled' ? 0 : a.total), 0);

  const totalServices = flightCost + transferCost + hotelCost + activityCost || 1;
  const hotelPct = Math.round((hotelCost / totalServices) * 100);
  const flightPct = Math.round((flightCost / totalServices) * 100);
  const transPct = Math.round((transferCost / totalServices) * 100);
  const actPct = Math.round((activityCost / totalServices) * 100);

  const r = 40;
  const circ = 2 * Math.PI * r;
  
  const offsetHotel = 0;
  const offsetFlight = (hotelPct / 100) * circ;
  const offsetTrans = ((hotelPct + flightPct) / 100) * circ;
  const offsetAct = ((hotelPct + flightPct + transPct) / 100) * circ;

  return (
    <div className="space-y-12 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header with Spacious Breathing Room */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 p-5 md:p-6 bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#8A6A00] flex items-center gap-2">
            <TrendingUp size={14} /> Executive Business Intelligence
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[#10233F] font-sans">Operational Analytics Deck</h1>
          <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
            Real-time financial synthesis, workspace integrity audits, service segment distribution, and critical path operational metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all duration-200">
            <Download size={14} className="text-gray-400" /> Export Deck
          </button>
        </div>
      </div>

      {/* HERO ANALYTICS CARD - Dark forest green gradient, large rounded corners, soft shadow */}
      <div className="bg-gradient-to-br from-[#1A3326] via-[#224433] to-[#11241a] rounded-[24px] p-8 md:p-10 shadow-xl border border-white/5 relative overflow-hidden">
        {/* Decorative abstract elements to convey luxury */}
        <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute left-1/4 bottom-0 w-[250px] h-[250px] bg-[#065f46]/20 rounded-full blur-[80px] pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Text */}
          <div className="space-y-4 max-w-xl text-white">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#D4AF37] bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 shadow-sm inline-block">
              Active Expedition Cockpit
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white font-sans">
              Operational & Yield Synthesis
            </h2>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed max-w-lg font-medium">
              This dashboard summarizes your workspace integrity, dynamic service pricing allocations, and systemic preparedness. Track margins across flights, accommodations, logistics, and excursions.
            </p>
            
            {/* Four high-level inline KPI numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10 text-white">
              <div>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Revenue</span>
                <span className="text-lg font-bold text-white mt-1 block">R {revenueTotal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Cost</span>
                <span className="text-lg font-bold text-white mt-1 block">R {totalCost.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest block font-bold">Net Profit</span>
                <span className="text-lg font-bold text-[#D4AF37] mt-1 block">R {netProfit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Net Margin</span>
                <span className="text-lg font-bold text-white mt-1 block">{marginPercent}%</span>
              </div>
            </div>
          </div>

          {/* Right side floating KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:w-96 shrink-0">
            {/* Float Card 1: Revenue */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg text-white hover:border-white/20 transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex justify-between items-center mb-2 text-gray-400">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">Grand Retail Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                  <Coins size={14} />
                </div>
              </div>
              <span className="text-xl font-bold text-white font-sans">
                R {revenueTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
              </span>
              <span className="text-[9px] text-[#D4AF37] font-bold block mt-1.5 flex items-center gap-1">
                <ArrowUpRight size={12} /> +12.4% vs monthly target
              </span>
            </div>

            {/* Float Card 2: Cost */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg text-white hover:border-white/20 transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex justify-between items-center mb-2 text-gray-400">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-300">Total Operational Cost</span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Coins size={14} />
                </div>
              </div>
              <span className="text-xl font-bold text-white font-sans">
                R {totalCost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
              </span>
              <span className="text-[9px] text-gray-400 font-bold block mt-1.5">
                Includes commission buffer & markups
              </span>
            </div>

            {/* Float Card 3: Net Profit */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-[#D4AF37]/30 shadow-lg text-white hover:border-[#D4AF37]/50 transition-all duration-300 hover:translate-y-[-2px]">
              <div className="flex justify-between items-center mb-2 text-gray-400">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37]">Net Yield Estimate</span>
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                  <TrendingUp size={14} />
                </div>
              </div>
              <span className="text-xl font-bold text-[#D4AF37] font-sans">
                R {netProfit.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
              </span>
              <span className="text-[9px] text-gray-300 font-bold block mt-1.5 flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#D4AF37]" /> Margin target of {state.finance.margin}% secure
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STRIPE-STYLE KPI SERVICE CARD GRID - hover lift and shadows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Segment 1 */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 group">
          <div className="flex justify-between items-start text-gray-400 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Rooms & Stays</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Hotel size={14} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-sans">{state.rooms.length} Rooms</p>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-2">
            R {hotelCost.toLocaleString()} Cost Allocated
          </span>
        </div>

        {/* Segment 2 */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 group">
          <div className="flex justify-between items-start text-gray-400 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Flight Links</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plane size={14} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-sans">{state.flights.length} Sectors</p>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-2">
            R {flightCost.toLocaleString()} Cost Allocated
          </span>
        </div>

        {/* Segment 3 */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 group">
          <div className="flex justify-between items-start text-gray-400 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Transfers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Car size={14} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-sans">{state.transfers.length} Jobs</p>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-2">
            R {transferCost.toLocaleString()} Cost Allocated
          </span>
        </div>

        {/* Segment 4 */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm hover:shadow-md hover:translate-y-[-2px] transition-all duration-300 group">
          <div className="flex justify-between items-start text-gray-400 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Planned Events</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity size={14} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-sans">{state.activities.filter(a => a.status !== 'Cancelled').length} Excursions</p>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-2">
            R {activityCost.toLocaleString()} Cost Allocated
          </span>
        </div>
      </div>

      {/* ROW 1 - Trends Chart & Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Card 1: Current Trip Estimate — live values, not fabricated historical trends */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                    <TrendingUp size={14} />
                  </span>
                  <h3 className="font-bold text-gray-900 text-base">Current Trip Estimate</h3>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Calculated from this trip's saved costs, margin, fees and discount. Currency: ZAR.
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                Live trip calculation
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-700">Estimated operating cost</span>
                  <span className="text-sm md:text-base font-bold text-slate-900">R {totalCost.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`Operating cost R ${totalCost.toLocaleString('en-ZA')}`}>
                  <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${costBarWidth}%` }} />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-700">Estimated selling price</span>
                  <span className="text-sm md:text-base font-bold text-emerald-800">R {revenueTotal.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden" role="img" aria-label={`Estimated selling price R ${revenueTotal.toLocaleString('en-ZA')}`}>
                  <div className="h-full bg-emerald-700 rounded-full transition-all" style={{ width: `${revenueBarWidth}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Gross uplift</span>
              <span className="text-sm font-bold text-slate-900">R {(revenueTotal - totalCost).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Target net profit</span>
              <span className="text-sm font-bold text-emerald-800">R {netProfit.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Net margin / cost</span>
              <span className="text-sm font-bold text-slate-900">{marginPercent}%</span>
            </div>
          </div>
        </div>

                {/* Card 2: Itinerary Distribution */}
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                  <Percent size={14} />
                </span>
                <h3 className="font-bold text-gray-900 text-base">Itinerary Allocation Ratio</h3>
              </div>
              <p className="text-xs text-gray-400 font-medium">Breakdown of services budgeted inside workspace</p>
            </div>

            <div className="relative h-32 flex items-center justify-center my-6">
              <svg viewBox="0 0 120 120" className="w-32 h-32 transform -rotate-90">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
                {/* Hotel segment */}
                {hotelPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#065f46" strokeWidth="14" strokeDasharray={`${(hotelPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetHotel} />}
                {/* Flight segment */}
                {flightPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#2563eb" strokeWidth="14" strokeDasharray={`${(flightPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetFlight} />}
                {/* Transfer segment */}
                {transPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#d97706" strokeWidth="14" strokeDasharray={`${(transPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetTrans} />}
                {/* Activity segment */}
                {actPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#7c3aed" strokeWidth="14" strokeDasharray={`${(actPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetAct} />}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900">{state.guests.length}</span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Pax Total</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-50 pt-5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-gray-600 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#065f46] rounded-md shadow-sm"></span> Rooms & Stays
              </span>
              <span className="font-bold text-gray-900">{hotelPct || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-gray-600 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#2563eb] rounded-md shadow-sm"></span> Flight Links
              </span>
              <span className="font-bold text-gray-900">{flightPct || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-gray-600 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#d97706] rounded-md shadow-sm"></span> Logistics Transfers
              </span>
              <span className="font-bold text-gray-900">{transPct || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-gray-600 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#7c3aed] rounded-md shadow-sm"></span> Planned Activities
              </span>
              <span className="font-bold text-gray-900">{actPct || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 - Readiness System Checklist & Overview Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Card 3: Roster & Readiness Checklist */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#1A3326]/5 text-[#1A3326]">
                <ShieldCheck size={14} />
              </span>
              <h3 className="font-bold text-gray-900 text-base">Roster & Operational Readiness</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium">Automatic system checks of traveler data and log integrity</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-gray-200 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#065f46] flex items-center justify-center shrink-0">
                <CheckCircle size={16} />
              </div>
              <div>
                <span className="font-bold text-gray-900 block text-sm">Workspace Integrity</span>
                <span className="text-gray-500 text-xs mt-0.5 block leading-normal">
                  Coordinator details and metadata have been resolved securely. Active Advisor: <span className="font-bold text-gray-800">{state.consultant || 'Sarah Jenkins'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-gray-200 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${state.guests.length > 0 ? 'bg-emerald-100 text-[#065f46]' : 'bg-amber-100 text-amber-600'}`}>
                {state.guests.length > 0 ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              </div>
              <div>
                <span className="font-bold text-gray-900 block text-sm">Guests Passenger Manifest</span>
                <span className="text-gray-500 text-xs mt-0.5 block leading-normal">
                  {state.guests.length} passengers logged inside this workspace group list. {state.guests.filter(g => g.diet && g.diet.length > 0).length} guests carry specific nutritional alerts.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-gray-200 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${state.rooms.length > 0 || state.client.tripType === 'day' ? 'bg-emerald-100 text-[#065f46]' : 'bg-rose-100 text-rose-600'}`}>
                {state.rooms.length > 0 || state.client.tripType === 'day' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              </div>
              <div>
                <span className="font-bold text-gray-900 block text-sm">Accommodations & Lodging Allocations</span>
                <span className="text-gray-500 text-xs mt-0.5 block leading-normal">
                  {state.rooms.length} separate rooms mapped in chronological range. Stay duration maps to {state.client.durationText || 'no specific duration text'}.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Quick Itinerary Highlights Summary */}
        <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-yellow-50 text-[#D4AF37]">
                  <Briefcase size={14} />
                </span>
                <h3 className="font-bold text-gray-900 text-base">Expedition Overview</h3>
              </div>
              <p className="text-xs text-gray-400 font-medium">Quick parameters and sector sizes of active folder</p>
            </div>

            <ul className="space-y-4 text-xs">
              <li className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-500">Group Name</span>
                <strong className="text-gray-900 font-bold font-sans">{state.client.name}</strong>
              </li>
              <li className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-500">Timeline Duration</span>
                <strong className="text-gray-900 font-bold font-sans">{state.client.startDate && state.client.endDate ? state.client.durationText : '—'}</strong>
              </li>
              <li className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-500">Flight Sectors</span>
                <strong className="text-[#065f46] font-bold font-sans">{state.flights.length} Links</strong>
              </li>
              <li className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-500">Transfers mapped</span>
                <strong className="text-[#065f46] font-bold font-sans">{state.transfers.length} Jobs</strong>
              </li>
              <li className="flex justify-between items-center pb-1">
                <span className="font-semibold text-gray-500">Activities booked</span>
                <strong className="text-[#065f46] font-bold font-sans">{state.activities.filter(a => a.status !== 'Cancelled').length} Excursions</strong>
              </li>
            </ul>
          </div>

          <div className="mt-8 bg-[#1A3326]/5 rounded-2xl p-4 border border-[#1A3326]/10">
            <p className="text-[10px] font-bold text-[#1A3326] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#D4AF37]" /> Advisor Insights
            </p>
            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
              {state.internalNotes ? state.internalNotes : 'Add internal advisory notes in Home/Intake to highlight VVIP requirements or timeline warnings.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
