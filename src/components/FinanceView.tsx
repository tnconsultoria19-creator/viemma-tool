import React, { useState } from 'react';
import { AppState } from '../types';
import { 
  Coins, 
  Percent, 
  ShieldAlert, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Plane, 
  Hotel, 
  Car, 
  Tags, 
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface FinanceViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onUpdateFinance: (updates: Partial<AppState['finance']>) => void;
  totalCost: number;
  netProfit: number;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  state,
  onUpdateState,
  onUpdateFinance,
  totalCost,
  netProfit
}) => {
  const f = state.finance;

  // Active panel state for edit progressive disclosure
  const [activePanel, setActivePanel] = useState<string | null>('markup');

  // Calculations
  const ccRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
  const ccTotal = totalCost * ccRate;
  const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;
  const commTotal = f.commType === '%' ? (totalCost + markupTotal) * (f.comm / 100) : f.comm;
  const retailTotalZAR = Math.max(0, totalCost + markupTotal + f.buffer + ccTotal - f.discount);
  const selectedRate = f.currency === 'ZAR' ? 1 : f.rates[f.currency as keyof typeof f.rates] || 1;
  const retailTotalCurr = retailTotalZAR * selectedRate;

  // Segment totals for presentation
  const hotelCosts = state.rooms.reduce((acc, r) => acc + (r.rate * r.nights) + (r.supp * r.guestIds.length), 0);
  const flightCosts = state.flights.reduce((acc, fl) => acc + (fl.cost * fl.qty), 0);
  const transferCosts = state.transfers.reduce((acc, t) => acc + t.cost + t.tolls + t.parking, 0);
  const activityCosts = state.activities.reduce((acc, act) => acc + act.total, 0);

  const handleRateChange = (curr: 'USD' | 'EUR' | 'BRL' | 'AOA', val: number) => {
    onUpdateFinance({
      rates: {
        ...f.rates,
        [curr]: val
      }
    });
  };

  const currencySymbol = (curr: string) => {
    switch (curr) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'BRL': return 'R$';
      case 'AOA': return 'Kz';
      default: return 'R';
    }
  };

  return (
    <div className="space-y-12 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Header section with generous breathing room */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <Sparkles size={14} /> Stripe-Powered Financial System
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Finance Workspace</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Manage margins, partner agency commission rules, exchange rate registrations, and multi-currency billing structures in Southern Africa.
          </p>
        </div>
        
        {/* Quick billing summary pill */}
        <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-[#D4AF37] flex items-center justify-center">
            <Coins size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Proposal Currency</span>
            <span className="text-lg font-bold text-[#1A3326]">{f.currency} (1 ZAR = {f.currency === 'ZAR' ? '1.00' : selectedRate.toFixed(4)})</span>
          </div>
        </div>
      </div>

      {/* Modern SaaS Grand Retail Proposal & Performance Card */}
      <div className="bg-[#1A3326] text-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Ambient glow accent */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-4 max-w-xl z-10">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400">Grand Retail Proposal</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {f.currency !== 'ZAR' && (
              <span className="block text-yellow-400 text-4xl md:text-5xl font-extrabold mb-1">
                {currencySymbol(f.currency)} {retailTotalCurr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            )}
            <span className="text-sm text-gray-300 block">
              Equates to <strong className="text-white text-base">R {retailTotalZAR.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong> ZAR billing
            </span>
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            This total factors in the primary operating cost, target margin markups, gate surcharges, active discounts, and incident buffers.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 min-w-[300px] md:min-w-[450px] z-10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Total Cost Sum</span>
            <span className="text-lg font-bold block text-white">R {totalCost.toLocaleString()}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
            <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest block mb-1">Target Yield</span>
            <span className="text-lg font-bold block text-yellow-400">R {netProfit.toLocaleString()}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Commissions</span>
            <span className="text-lg font-bold block text-white">R {commTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Modern Grid - Multiple cards, no spreadsheet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Card 1: Profit Pricing Margin Target */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 text-[#D4AF37] flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Profit Pricing Margin</h3>
                <span className="text-xs text-gray-400 block font-medium">Markup target overlay</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Define the profit parameters applied to direct suppliers' operational costs.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Target Margin</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={f.margin} 
                  onChange={e => onUpdateFinance({ margin: Number(e.target.value) })}
                  className="custom-focus block w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-right text-[#1A3326]" 
                  placeholder="20" 
                />
                <select 
                  value={f.marginType} 
                  onChange={e => onUpdateFinance({ marginType: e.target.value as any })}
                  className="custom-focus px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-center bg-gray-50 text-[#1A3326] w-24"
                >
                  <option value="%">%</option>
                  <option value="Fixed">ZAR</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl">
              <span className="text-gray-500">Calculated Added Profit:</span>
              <strong className="text-[#1A3326] font-bold">R {markupTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Partner Agent Commission Owed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Partner Commission</h3>
                <span className="text-xs text-gray-400 block font-medium">B2B agency reward rules</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Set commission payouts for referring agents or third-party planners.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Commission Rate</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={f.comm} 
                  onChange={e => onUpdateFinance({ comm: Number(e.target.value) })}
                  className="custom-focus block w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-right text-[#1A3326]" 
                  placeholder="10" 
                />
                <select 
                  value={f.commType} 
                  onChange={e => onUpdateFinance({ commType: e.target.value as any })}
                  className="custom-focus px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-center bg-gray-50 text-[#1A3326] w-24"
                >
                  <option value="%">%</option>
                  <option value="Fixed">ZAR</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl">
              <span className="text-gray-500">Calculated Payout:</span>
              <strong className="text-emerald-700 font-bold">R {commTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Base Retail Currency */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Coins size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Proposal Currency</h3>
                <span className="text-xs text-gray-400 block font-medium">Client settlement currency</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Select the primary currency shown on the final proposal documentation.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Billing Currency</label>
              <select 
                value={f.currency} 
                onChange={e => onUpdateFinance({ currency: e.target.value as any })}
                className="custom-focus block w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-[#1A3326] bg-white"
              >
                <option value="ZAR">ZAR (South African Rand - R)</option>
                <option value="USD">USD (United States Dollar - $)</option>
                <option value="EUR">EUR (Euro - €)</option>
                <option value="BRL">BRL (Brazilian Real - R$)</option>
              </select>
            </div>

            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl">
              <span className="text-gray-500">Active Rate (per ZAR 1):</span>
              <strong className="text-purple-700 font-bold">{f.currency === 'ZAR' ? '1.00 ZAR' : `${selectedRate} ${f.currency}`}</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Surcharges & Gateway Fees */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Gateway & Surcharges</h3>
                <span className="text-xs text-gray-400 block font-medium">Merchant payment overheads</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Offset portal merchant transaction fees by selecting the client payment route.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Settlement Channel</label>
              <select 
                value={f.paymentMethod} 
                onChange={e => onUpdateFinance({ paymentMethod: e.target.value })}
                className="custom-focus block w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white text-[#1A3326]"
              >
                <option value="none">Bank EFT Wire Transfer (0.0% Fee)</option>
                <option value="visa">Visa / MasterCard (2.5% Surcharge)</option>
                <option value="amex">American Express Portal (3.8% Surcharge)</option>
              </select>
            </div>

            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl">
              <span className="text-gray-500">Calculated Surcharge:</span>
              <strong className="text-blue-700 font-bold">R {ccTotal.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Card 5: Discounts & Packages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Tags size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Discounts & Promos</h3>
                <span className="text-xs text-gray-400 block font-medium">Direct proposal reductions</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Apply a direct currency discount to incentivize the traveler or settle agency deals.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Discount (ZAR)</label>
              <input 
                type="number" 
                value={f.discount} 
                onChange={e => onUpdateFinance({ discount: Number(e.target.value) })}
                className="custom-focus block w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-right text-rose-600" 
                placeholder="R 0" 
              />
            </div>

            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl">
              <span className="text-gray-500">Deducted Price:</span>
              <strong className="text-rose-600 font-bold">- R {f.discount.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Card 6: Incident Contingency Buffer */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Incident & Buffer</h3>
                <span className="text-xs text-gray-400 block font-medium">Contingency safety fund</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Add a contingency buffer for weather fluctuations, peak seasons, or fuel surcharge risk.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-50">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block tracking-wider mb-2">Safety Buffer (ZAR)</label>
              <input 
                type="number" 
                value={f.buffer} 
                onChange={e => onUpdateFinance({ buffer: Number(e.target.value) })}
                className="custom-focus block w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold text-right text-amber-600" 
                placeholder="R 0" 
              />
            </div>

            <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl">
              <span className="text-gray-500">Protection Buffer:</span>
              <strong className="text-amber-600 font-bold">R {f.buffer.toLocaleString()}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Elegant Buffer Notes Block */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[#D4AF37]" />
          <h3 className="font-bold text-gray-900 text-sm font-sans">Financial & Operational Buffer Context</h3>
        </div>
        <textarea 
          value={f.bufferNotes}
          onChange={e => onUpdateFinance({ bufferNotes: e.target.value })}
          className="custom-focus block w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-[#1A3326] bg-gray-50/50"
          placeholder="Enter custom context explaining this buffer to other operators or accounting..."
          style={{ resize: 'vertical', minHeight: '80px' }}
        />
      </div>

      {/* Grand Operational Ledger & Segment-by-Segment Breakdowns */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-sm space-y-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-sans">Grand Operational Commercial Ledger</h3>
          <p className="text-xs text-gray-400 font-medium uppercase mt-1 tracking-wider">Itemized Cost Structure Audit Matrix</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          
          {/* Cost Block Summary */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#1A3326] uppercase tracking-wider text-[11px] pb-2 border-b border-gray-100">Functional Segment Cost Sums</h4>
            
            <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-1.5"><Hotel size={14} className="text-emerald-600" /> Accommodation Booking Core</span>
              <span className="font-bold text-[#1A3326]">R {hotelCosts.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-1.5"><Plane size={14} className="text-blue-600" /> Aviation Sectors Net Cost</span>
              <span className="font-bold text-[#1A3326]">R {flightCosts.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-1.5"><Car size={14} className="text-amber-600" /> Land Logistics & Transfers</span>
              <span className="font-bold text-[#1A3326]">R {transferCosts.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-100">
              <span className="text-gray-500 flex items-center gap-1.5"><Layers size={14} className="text-purple-600" /> Day Activities & Corridors</span>
              <span className="font-bold text-[#1A3326]">R {activityCosts.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs pt-2 font-bold text-[#1A3326]">
              <span>Primary Operating Cost Sum</span>
              <span>R {totalCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Exchange Rates Registry Sub-Workspace */}
          <div className="bg-slate-50/50 border border-gray-100 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h4 className="font-bold text-[#1A3326] uppercase tracking-wider text-[11px]">Exchange Rates Registry</h4>
              <span className="text-[10px] text-gray-400 uppercase font-medium">vs ZAR 1.00</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">ZAR to USD ($)</label>
                <input 
                  type="number" 
                  value={f.rates.USD} 
                  onChange={e => handleRateChange('USD', Number(e.target.value))}
                  className="custom-focus block w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-right text-[#1A3326]" 
                  step="0.001" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">ZAR to EUR (€)</label>
                <input 
                  type="number" 
                  value={f.rates.EUR} 
                  onChange={e => handleRateChange('EUR', Number(e.target.value))}
                  className="custom-focus block w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-right text-[#1A3326]" 
                  step="0.001" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">ZAR to BRL (R$)</label>
                <input 
                  type="number" 
                  value={f.rates.BRL} 
                  onChange={e => handleRateChange('BRL', Number(e.target.value))}
                  className="custom-focus block w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-right text-[#1A3326]" 
                  step="0.001" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">ZAR to AOA (Kz)</label>
                <input 
                  type="number" 
                  value={f.rates.AOA} 
                  onChange={e => handleRateChange('AOA', Number(e.target.value))}
                  className="custom-focus block w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-right text-[#1A3326]" 
                  step="0.001" 
                />
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
