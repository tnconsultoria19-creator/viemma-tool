import React from 'react';
import { AppState } from '../types';
import { Coins, Percent, ShieldAlert, DollarSign } from 'lucide-react';

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

  // CC fee
  const ccRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
  const ccTotal = totalCost * ccRate;

  // Markup
  const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;

  // Commission
  const commTotal = f.commType === '%' ? (totalCost + markupTotal) * (f.comm / 100) : f.comm;

  // Total Retail price (ZAR)
  const retailTotalZAR = Math.max(0, totalCost + markupTotal + f.buffer + ccTotal - f.discount);

  // Selected Currency Rate
  const selectedRate = f.currency === 'ZAR' ? 1 : f.rates[f.currency as keyof typeof f.rates] || 1;
  const retailTotalCurr = retailTotalZAR * selectedRate;

  const handleRateChange = (curr: 'USD' | 'EUR' | 'BRL' | 'AOA', val: number) => {
    onUpdateFinance({
      rates: {
        ...f.rates,
        [curr]: val
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Commercial Controls</span>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Financial Parameters & Conversion Engine</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* ROW 1: CONTROLS */}
        <div className="card md:col-span-2 space-y-4">
          <div className="stitle"><i className="fa-solid fa-sliders"></i> Costing Multipliers & Markups</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="lbl">Base Retail Currency</label>
              <select 
                value={f.currency} 
                onChange={e => onUpdateFinance({ currency: e.target.value as any })}
                className="field-input font-bold"
              >
                <option value="ZAR">ZAR (South African Rand - R)</option>
                <option value="USD">USD (United States Dollar - $)</option>
                <option value="EUR">EUR (Euro - €)</option>
                <option value="BRL">BRL (Brazilian Real - R$)</option>
              </select>
            </div>

            <div>
              <label className="lbl">Payment Settlement Method Surcharge</label>
              <select 
                value={f.paymentMethod} 
                onChange={e => onUpdateFinance({ paymentMethod: e.target.value })}
                className="field-input"
              >
                <option value="none">EFT / Direct Bank Wire Transfer (0.0% Fee)</option>
                <option value="visa">Visa / MasterCard Secure Portal (2.5% Fee)</option>
                <option value="amex">American Express Secure Portal (3.8% Fee)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-gray-100 pt-4">
            <div>
              <label className="lbl">Profit Pricing Margin Target</label>
              <div className="flex gap-1">
                <input 
                  type="number" 
                  value={f.margin} 
                  onChange={e => onUpdateFinance({ margin: Number(e.target.value) })}
                  className="field-input font-bold" 
                  placeholder="20" 
                />
                <select 
                  value={f.marginType} 
                  onChange={e => onUpdateFinance({ marginType: e.target.value as any })}
                  className="field-input font-bold w-20"
                >
                  <option value="%">%</option>
                  <option value="Fixed">ZAR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="lbl">Partner Agent Commission Owed</label>
              <div className="flex gap-1">
                <input 
                  type="number" 
                  value={f.comm} 
                  onChange={e => onUpdateFinance({ comm: Number(e.target.value) })}
                  className="field-input font-bold" 
                  placeholder="0" 
                />
                <select 
                  value={f.commType} 
                  onChange={e => onUpdateFinance({ commType: e.target.value as any })}
                  className="field-input font-bold w-20"
                >
                  <option value="%">%</option>
                  <option value="Fixed">ZAR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-t border-gray-100 pt-4">
            <div>
              <label className="lbl">Direct Package Discount Offered (ZAR)</label>
              <input 
                type="number" 
                value={f.discount} 
                onChange={e => onUpdateFinance({ discount: Number(e.target.value) })}
                className="field-input font-bold text-red-700" 
                placeholder="R 0" 
              />
            </div>

            <div>
              <label className="lbl">Incident & Weather Fluctuation Buffer (ZAR)</label>
              <input 
                type="number" 
                value={f.buffer} 
                onChange={e => onUpdateFinance({ buffer: Number(e.target.value) })}
                className="field-input font-bold text-orange-700" 
                placeholder="R 0" 
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="lbl">Buffer / Extra Explanation Note</label>
            <textarea 
              value={f.bufferNotes}
              onChange={e => onUpdateFinance({ bufferNotes: e.target.value })}
              className="field-input font-medium"
              placeholder="e.g. Added emergency fuel/toll road fluctuation buffer for high season Cape Peninsula regional transfers..."
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
          </div>
        </div>

        {/* EXCHANGE RATES TABLE */}
        <div className="card text-xs">
          <div className="stitle"><i className="fa-solid fa-coins"></i> Exchange Rates Registry</div>
          <p className="text-[10px] text-gray-400 font-medium mb-3.5 uppercase">Conversion rate relative to ZAR 1.00</p>
          
          <div className="space-y-3">
            <div>
              <label className="lbl flex justify-between">
                <span>ZAR to USD Rate ($)</span>
                <span className="font-bold text-gray-500">1 ZAR = ${f.rates.USD}</span>
              </label>
              <input 
                type="number" 
                value={f.rates.USD} 
                onChange={e => handleRateChange('USD', Number(e.target.value))}
                className="field-input font-bold" 
                step="0.001" 
              />
            </div>
            <div>
              <label className="lbl flex justify-between">
                <span>ZAR to EUR Rate (€)</span>
                <span className="font-bold text-gray-500">1 ZAR = €{f.rates.EUR}</span>
              </label>
              <input 
                type="number" 
                value={f.rates.EUR} 
                onChange={e => handleRateChange('EUR', Number(e.target.value))}
                className="field-input font-bold" 
                step="0.001" 
              />
            </div>
            <div>
              <label className="lbl flex justify-between">
                <span>ZAR to BRL Rate (R$)</span>
                <span className="font-bold text-gray-500">1 ZAR = R${f.rates.BRL}</span>
              </label>
              <input 
                type="number" 
                value={f.rates.BRL} 
                onChange={e => handleRateChange('BRL', Number(e.target.value))}
                className="field-input font-bold" 
                step="0.001" 
              />
            </div>
            <div>
              <label className="lbl flex justify-between">
                <span>ZAR to AOA Rate (Kz)</span>
                <span className="font-bold text-gray-500">1 ZAR = Kz{f.rates.AOA}</span>
              </label>
              <input 
                type="number" 
                value={f.rates.AOA} 
                onChange={e => handleRateChange('AOA', Number(e.target.value))}
                className="field-input font-bold" 
                step="0.001" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED GRAND LEDGER BILL OF QUANTITIES */}
      <div className="card">
        <div className="stitle"><i className="fa-solid fa-file-invoice-dollar"></i> Grand Operational Commercial Ledger</div>
        <p className="text-[10px] text-gray-400 font-medium mb-4 uppercase">Itemized summary showing final costing build blocks</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600 font-medium">
          
          {/* ITEM COST BLOCKS */}
          <div className="space-y-2.5">
            <div className="flex justify-between pb-1.5 border-b border-gray-100">
              <span>Primary Operating Cost Sum</span>
              <span className="text-gray-900 font-bold">R {totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-gray-100">
              <span>Incident Contingency Buffer</span>
              <span className="text-gray-900 font-bold">R {f.buffer.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-gray-100 text-amber-800">
              <span>Gateway Surcharge Transaction Fees ({f.paymentMethod})</span>
              <span className="font-bold">R {ccTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-gray-100 text-rose font-semibold">
              <span>Direct Special Package Discount</span>
              <span>- R {f.discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-gray-200 text-[#065f46] font-bold text-[13px] pt-1">
              <span>Markup Added Overage</span>
              <span>R {markupTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* NET REVENUE & YIELDS */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Grand Retail Proposal (ZAR)</span>
                <span className="text-lg font-bold font-serif text-gray-900">R {retailTotalZAR.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>

              {f.currency !== 'ZAR' && (
                <div className="flex justify-between items-center border-t border-gray-200 pt-2.5">
                  <span className="text-accent font-bold uppercase tracking-wider text-[10px]">Grand Retail Proposal ({f.currency})</span>
                  <span className="text-lg font-bold font-serif text-accent">
                    {f.currency === 'USD' ? '$' : f.currency === 'EUR' ? '€' : 'R$'} {retailTotalCurr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4 grid grid-cols-2 gap-3.5 text-center">
              <div className="bg-white border border-gray-200 p-2.5 rounded-md">
                <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Commissions Owed</span>
                <strong className="text-xs font-serif font-bold text-gray-900 block mt-0.5">R {commTotal.toLocaleString()}</strong>
              </div>
              <div className="bg-[#ecfdf5] border border-accentBorder p-2.5 rounded-md">
                <span className="block text-[8px] text-accent font-bold uppercase tracking-wider">Expected Yield (Profit)</span>
                <strong className="text-xs font-serif font-bold text-accent block mt-0.5">R {netProfit.toLocaleString()}</strong>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
