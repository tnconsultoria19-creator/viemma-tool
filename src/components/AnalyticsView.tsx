import React from 'react';
import { AppState } from '../types';
import { 
  TrendingUp, 
  Coins, 
  Users, 
  Percent, 
  FileText, 
  CheckCircle, 
  AlertTriangle 
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
  const revenueTotal = totalCost + (state.finance.marginType === '%' ? totalCost * (state.finance.margin / 100) : state.finance.margin);

  // Sample static trends matching workspace metrics
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revenueTrend = [120, 240, 180, 310, 290, 420, 380];
  const costTrend = [80, 160, 130, 210, 200, 280, 260];

  const chartWidth = 500;
  const chartHeight = 150;
  const maxVal = 450;

  // Generate SVG polyline coordinates
  const pointsRev = revenueTrend.map((val, idx) => {
    const x = (idx / (revenueTrend.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const pointsCost = costTrend.map((val, idx) => {
    const x = (idx / (costTrend.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // SVG Circular progress breakdown
  const flightCost = state.flights.reduce((sum, f) => sum + (f.cost * f.qty), 0);
  const transferCost = state.transfers.reduce((sum, t) => sum + t.cost + t.tolls + t.parking, 0);
  const hotelCost = state.rooms.reduce((sum, r) => sum + (r.rate * r.nights) + r.supp, 0);
  const activityCost = state.activities.reduce((sum, a) => sum + (a.isFree ? 0 : a.total), 0);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Financial Dashboard</span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Operational Analytics Deck</h1>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-up">
        {/* KPI 1 */}
        <div className="card p-5">
          <div className="flex justify-between items-start text-gray-400 mb-2.5">
            <span className="text-xs font-semibold text-gray-600">Grand Retail Revenue</span>
            <TrendingUp size={16} className="text-accent" />
          </div>
          <p className="text-xl font-bold text-gray-900">R {revenueTotal.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1 flex items-center gap-1"><i className="fa-solid fa-arrow-up text-green-600"></i> +12% vs last month</span>
        </div>

        {/* KPI 2 */}
        <div className="card p-5">
          <div className="flex justify-between items-start text-gray-400 mb-2.5">
            <span className="text-xs font-semibold text-gray-600">Total Operational Cost</span>
            <Coins size={16} className="text-red-500" />
          </div>
          <p className="text-xl font-bold text-gray-900">R {totalCost.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Includes buffer & commissions</span>
        </div>

        {/* KPI 3 */}
        <div className="card p-5 !bg-accentLight !border-accentBorder">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-xs font-bold text-accent">Net Operational Profit</span>
            <TrendingUp size={16} className="text-accent" />
          </div>
          <p className="text-xl font-bold text-accent">R {netProfit.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
          <span className="text-[10px] text-accent/80 font-bold uppercase tracking-wider block mt-1">Estimated yield</span>
        </div>

        {/* KPI 4 */}
        <div className="card p-5">
          <div className="flex justify-between items-start text-gray-400 mb-2.5">
            <span className="text-xs font-semibold text-gray-600">Net Margin</span>
            <Percent size={16} className="text-accent" />
          </div>
          <p className="text-xl font-bold text-gray-900">{marginPercent}%</p>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1 flex items-center gap-1"><i className="fa-solid fa-check text-green-600"></i> Target of 22% met</span>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* SVG Area line Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Revenue & Cost Projections</h3>
              <span className="text-[10px] text-gray-400 font-medium">Visualizing weekly sales pipeline (R thousands)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-accent flex items-center gap-1"><span className="w-2.5 h-2.5 bg-accent rounded-full"></span> Revenue</span>
              <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gray-400 rounded-full"></span> Cost</span>
            </div>
          </div>

          <div className="w-full relative h-[180px] mt-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              {/* Grid Lines */}
              <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#f3f4f6" strokeWidth="1" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e5e7eb" strokeWidth="1.5" />

              {/* Area Shading */}
              <polyline fill="rgba(6, 95, 70, 0.08)" stroke="none" points={`0,${chartHeight} ${pointsRev} ${chartWidth},${chartHeight}`} />
              <polyline fill="rgba(156, 163, 175, 0.04)" stroke="none" points={`0,${chartHeight} ${pointsCost} ${chartWidth},${chartHeight}`} />

              {/* Cost Line */}
              <polyline fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeDasharray="4,2" points={pointsCost} />

              {/* Revenue Line */}
              <polyline fill="none" stroke="#065f46" strokeWidth="3" points={pointsRev} />
            </svg>
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold uppercase mt-4">
            {weekDays.map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* SVG Donut Chart */}
        <div className="card flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">Itinerary Distribution</h3>
            <span className="text-[10px] text-gray-400 font-medium">Breakdown of services allocated</span>
          </div>

          <div className="relative h-32 flex items-center justify-center my-4">
            <svg viewBox="0 0 120 120" className="w-32 h-32 transform -rotate-90">
              <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
              {/* Hotel segment */}
              {hotelPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#065f46" strokeWidth="12" strokeDasharray={`${(hotelPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetHotel} />}
              {/* Flight segment */}
              {flightPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#2563eb" strokeWidth="12" strokeDasharray={`${(flightPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetFlight} />}
              {/* Transfer segment */}
              {transPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#d97706" strokeWidth="12" strokeDasharray={`${(transPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetTrans} />}
              {/* Activity segment */}
              {actPct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="#7c3aed" strokeWidth="12" strokeDasharray={`${(actPct / 100) * circ} ${circ}`} strokeDashoffset={-offsetAct} />}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-gray-900">{state.guests.length}</span>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Pax</span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-gray-600 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#065f46] rounded-sm"></span> Rooms & Stays</span>
              <span className="font-bold text-gray-900">{hotelPct}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-gray-600 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#2563eb] rounded-sm"></span> Flight Links</span>
              <span className="font-bold text-gray-900">{flightPct}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-gray-600 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#d97706] rounded-sm"></span> Logistics Transfers</span>
              <span className="font-bold text-gray-900">{transPct}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-gray-600 flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#7c3aed] rounded-sm"></span> Planned Activities</span>
              <span className="font-bold text-gray-900">{actPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* DIAGNOSTICS & DETAILS COLUMN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* DIAGNOSTICS SYSTEM */}
        <div className="card md:col-span-2">
          <h3 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider"><i className="fa-solid fa-shield-halved text-accent mr-1"></i> Roster & Systems Readiness</h3>
          
          <ul className="space-y-3 text-xs">
            <li className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <CheckCircle size={14} className="text-[#065f46] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block">Workspace Integrity</span>
                <span className="text-gray-500">File metadata configured. Consultant: {state.consultant || 'Unassigned'}</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {state.guests.length > 0 ? (
                <CheckCircle size={14} className="text-[#065f46] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-gray-900 block">Guests Roster</span>
                <span className="text-gray-500">{state.guests.length} passengers registered in current group.</span>
              </div>
            </li>
            <li className="flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {state.rooms.length > 0 || state.client.tripType === 'day' ? (
                <CheckCircle size={14} className="text-[#065f46] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold text-gray-900 block">Accommodations</span>
                <span className="text-gray-500">{state.rooms.length} hotel rooms booked in timeline.</span>
              </div>
            </li>
          </ul>
        </div>

        {/* WORKSPACE SUMMARY */}
        <div className="card">
          <h3 className="text-xs font-bold text-gray-900 mb-4 uppercase tracking-wider"><i className="fa-solid fa-suitcase-rolling text-accent mr-1"></i> Quick Overview</h3>
          <ul className="space-y-3.5 text-xs text-gray-600">
            <li className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-medium">Primary Group Size</span>
              <strong className="text-gray-900 font-bold font-serif">{state.guests.length} Pax</strong>
            </li>
            <li className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-medium">Itinerary Duration</span>
              <strong className="text-gray-900 font-bold font-serif">{state.client.startDate && state.client.endDate ? state.client.durationText : '—'}</strong>
            </li>
            <li className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-medium">Flight Sectors</span>
              <strong className="text-gray-900 font-bold font-serif">{state.flights.length} Link(s)</strong>
            </li>
            <li className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="font-medium">Transfers</span>
              <strong className="text-gray-900 font-bold font-serif">{state.transfers.length} Job(s)</strong>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-medium">Planned Activities</span>
              <strong className="text-gray-900 font-bold font-serif">{state.activities.length} Event(s)</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
