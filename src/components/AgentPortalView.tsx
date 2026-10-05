import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { getAgentTripView } from '../utils/roleFiltering';
import { 
  Building2, 
  Download, 
  Printer, 
  Calendar, 
  Users, 
  Plane, 
  Hotel, 
  Car, 
  Route, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Mail, 
  Phone, 
  Clock, 
  DollarSign, 
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface AgentPortalViewProps {
  state: AppState;
  onBackToWorkspace?: () => void;
}

export const AgentPortalView: React.FC<AgentPortalViewProps> = ({ state: rawState, onBackToWorkspace }) => {
  const [selectedTab, setSelectedTab] = useState<'proposal' | 'schedule' | 'vouchers' | 'commercials'>('proposal');

  // Strictly sanitize data for B2B Agent view
  const state = useMemo(() => getAgentTripView(rawState), [rawState]);

  // Compute pricing for agency
  const flightCosts = state.flights.reduce((sum, f) => sum + (f.cost * f.qty), 0);
  const transferCosts = state.transfers.reduce((sum, tr) => sum + tr.cost + tr.tolls + tr.parking, 0);
  const roomCosts = state.rooms.reduce((sum, r) => sum + (r.rate * r.nights) + r.supp, 0);
  const activityCosts = state.activities.reduce((sum, a) => sum + (a.isFree ? 0 : a.total), 0);
  const totalCost = flightCosts + transferCosts + roomCosts + activityCosts;

  const f = state.finance;
  const ccRate = f.paymentMethod === 'visa' || f.paymentMethod === 'master' ? 0.025 : f.paymentMethod === 'amex' ? 0.038 : 0;
  const ccTotal = totalCost * ccRate;
  const markupTotal = f.marginType === '%' ? totalCost * (f.margin / 100) : f.margin;
  
  // Gross Retail Proposal in ZAR
  const retailTotalZAR = Math.max(0, totalCost + markupTotal + f.buffer + ccTotal - f.discount);
  
  // Agency Commission
  const commTotal = f.commType === '%' ? (totalCost + markupTotal) * (f.comm / 100) : f.comm;
  const netDueViemma = Math.max(0, retailTotalZAR - commTotal);

  return (
    <div className="min-h-screen text-gray-900 pb-20 font-sans">
      
      {/* Top B2B Navigation Ribbon */}
      <div className="bg-[#1A3326] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#1A3326] font-black flex items-center justify-center text-sm shadow">
              V
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wide block">VIEMMA TOURS</span>
              <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-widest block -mt-0.5">
                B2B Partner Portal • Confirmed Quotation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
            >
              <Printer size={13} /> Print Proposal
            </button>
            {onBackToWorkspace && (
              <button 
                onClick={onBackToWorkspace}
                className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c59f2e] text-[#1A3326] text-xs font-bold transition-all shadow-sm"
              >
                Owner Cockpit
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        
        {/* Proposal Header Card */}
        <div className="bg-white rounded-[28px] p-8 md:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-gray-100">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold tracking-wider uppercase border border-emerald-100">
                <ShieldCheck size={13} /> Official B2B Partner Dossier
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-gray-900 tracking-tight">
                {state.title || `${state.client.name}'s Bespoke Journey`}
              </h1>
              <p className="text-sm text-gray-500 font-medium flex items-center gap-3">
                <span>Ref: <strong className="text-gray-900 font-mono">{state.ref}</strong></span>
                <span>•</span>
                <span>Partner Agency: <strong className="text-gray-900">{state.agent.agencyName || state.agent.contact || 'Safari Dreams Travel'}</strong></span>
              </p>
            </div>

            {/* Commercial Summary Box */}
            <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 p-6 rounded-2xl border border-gray-200/80 min-w-[280px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Client Gross Retail
              </span>
              <span className="text-3xl font-black text-gray-900 block font-mono">
                R {Math.round(retailTotalZAR).toLocaleString()}
              </span>
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold">Agency Commission ({f.comm}%):</span>
                <span className="font-mono font-bold text-emerald-800">R {Math.round(commTotal).toLocaleString()}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Net Remittance to Viemma:</span>
                <span className="font-mono font-bold text-gray-900">R {Math.round(netDueViemma).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Dates</span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-700" /> {state.client.startDate} to {state.client.endDate}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Party Size</span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Users size={14} className="text-emerald-700" /> {state.guests.length} Travellers
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Lead Traveller</span>
              <span className="text-sm font-bold text-gray-900 block truncate">
                {state.client.name}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Assigned Specialist</span>
              <span className="text-sm font-bold text-emerald-800 block">
                {state.consultant || 'Elena Rostova'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          {[
            { id: 'proposal', label: 'Client Proposal Summary' },
            { id: 'schedule', label: 'Itemized Schedule' },
            { id: 'vouchers', label: 'Service Vouchers' },
            { id: 'commercials', label: 'Terms & Conditions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTab === tab.id
                  ? 'bg-[#1A3326] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Proposal Summary */}
        {selectedTab === 'proposal' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-serif text-gray-900">Included High-End Services</h2>
                <span className="text-xs text-emerald-800 bg-emerald-50 font-bold px-3 py-1 rounded-full">
                  Partner Overview
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flights */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                    <Plane size={16} className="text-emerald-700" /> Air Travel Segments ({state.flights.length})
                  </div>
                  <div className="space-y-2">
                    {state.flights.map((f, i) => (
                      <div key={f.id} className="text-xs bg-white p-3 rounded-xl border border-gray-200/60">
                        <div className="flex items-center justify-between font-bold">
                          <span>{f.airline} ({f.flightNo})</span>
                          <span className="text-emerald-700">{f.cabin}</span>
                        </div>
                        <p className="text-gray-500 mt-1">{f.from} → {f.to} • {f.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hotels */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
                    <Hotel size={16} className="text-emerald-700" /> Luxury Lodging ({state.rooms.length})
                  </div>
                  <div className="space-y-2">
                    {state.rooms.map((r, i) => (
                      <div key={r.id} className="text-xs bg-white p-3 rounded-xl border border-gray-200/60">
                        <div className="flex items-center justify-between font-bold">
                          <span>{r.hotel}</span>
                          <span className="text-emerald-700">{r.meal}</span>
                        </div>
                        <p className="text-gray-500 mt-1">{r.cin} to {r.cout} ({r.nights} Nights) • {r.roomType}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Partner Confirmation & Info Submission Form */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#1A3326]">Submit Booking Information & Guest Notes</h3>
                  <p className="text-xs text-gray-500">Transmit confirmed client details or adjustments directly to Viemma Operations.</p>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Direct Dispatch
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Agent Contact Person</label>
                  <input 
                    type="text" 
                    defaultValue={state.agent.contact || ''} 
                    placeholder="e.g., Jane Doe (Senior Consultant)" 
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700">Agent Email for Dispatch</label>
                  <input 
                    type="email" 
                    defaultValue={state.agent.email || ''} 
                    placeholder="agent@partner.com" 
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="font-bold text-gray-700">Special Guest Requests / Room Requirements</label>
                  <textarea 
                    rows={3} 
                    placeholder="Enter any dietary restrictions, anniversary notes, or private charter preferences to send to Viemma..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-emerald-600 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => alert('Booking information and notes successfully transmitted to Viemma Operations.')}
                  className="px-6 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold transition shadow-xs flex items-center gap-2"
                >
                  <ShieldCheck size={14} className="text-[#D4AF37]" /> Send Info to Viemma
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Itemized Schedule */}
        {selectedTab === 'schedule' && (
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold font-serif text-gray-900">Chronological Logistics Flow</h2>
            <div className="space-y-4">
              {state.activities.map((act, i) => (
                <div key={act.id} className="p-4 rounded-xl border border-gray-200 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold">Day</span>
                    <span className="text-sm font-black">{act.day}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-sm">{act.name}</h3>
                    <p className="text-xs text-gray-500">{act.desc}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {act.inc?.map((inc, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                          ✓ {inc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Terms */}
        {selectedTab === 'commercials' && (
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4 text-xs text-gray-600 leading-relaxed">
            <h2 className="text-xl font-bold font-serif text-gray-900">B2B Commercial Agreement & Payment Terms</h2>
            <p>
              1. <strong>Deposit & Confirmation:</strong> A 30% non-refundable deposit is required within 7 days of quotation acceptance to secure lodge holds and private charter availability.
            </p>
            <p>
              2. <strong>Balance Due:</strong> The remaining 70% balance is payable strictly 45 days prior to arrival.
            </p>
            <p>
              3. <strong>Commission Settlement:</strong> Partner agency commission ({f.comm}%) is deductible at source on final remittance.
            </p>
            <p>
              4. <strong>Confidentiality:</strong> This proposal contains trade-protected pricing exclusively for authorized agent partners.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
