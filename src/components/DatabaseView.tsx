import React, { useState } from 'react';
import { DB_DEFAULT } from '../dbDefaults';
import { 
  Briefcase, 
  Hotel, 
  Compass, 
  Car, 
  Plus, 
  Check, 
  Database,
  Globe,
  Tag,
  Star
} from 'lucide-react';

export const DatabaseView: React.FC = () => {
  const [subTab, setSubTab] = useState<'hotels' | 'activities' | 'extras' | 'agents' | 'drivers'>('hotels');

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <Database size={14} /> Global Preset Catalog
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Resource Database Masters</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Review pre-registered 5-star lodging rates, game-drive operator contacts, welcoming champagne packages, partnership agency incentives, and chauffeured fleet assignments.
          </p>
        </div>
      </div>

      {/* HORIZONTAL DB TABS */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xs gap-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'hotels', label: 'Hotel Properties', icon: <Hotel size={14} /> },
          { id: 'activities', label: 'Experiences & Excursions', icon: <Compass size={14} /> },
          { id: 'extras', label: 'Welcoming Amenities', icon: <Plus size={14} /> },
          { id: 'agents', label: 'Partnership Agents', icon: <Briefcase size={14} /> },
          { id: 'drivers', label: 'Drivers & Fleet Vehicles', icon: <Car size={14} /> }
        ].map(tab => {
          const isSelected = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-5 text-xs font-bold rounded-xl transition-all select-none shrink-0 ${
                isSelected 
                  ? 'bg-[#1A3326] text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SUB-TABS VIEWS */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-sm">
        
        {subTab === 'hotels' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base font-sans">Hotel Properties Master List</h3>
                <p className="text-xs text-gray-400">Standard contracts with 5-star Southern Africa retreats</p>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-yellow-50 border border-[#D4AF37]/20 px-3 py-1 rounded-xl uppercase tracking-wider">3 active presets</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Hotel Property Name</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Regional Corridor</th>
                    <th className="p-4 pr-6 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {DB_DEFAULT.hotels.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6 font-bold text-[#1A3326]">{h.name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: h.stars }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-gray-500">{h.area}</td>
                      <td className="p-4 pr-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <Check size={10} /> Active Preset
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'activities' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base font-sans">Excursion & Tour Catalog</h3>
                <p className="text-xs text-gray-400">Pre-negotiated net tour operator rates</p>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-yellow-50 border border-[#D4AF37]/20 px-3 py-1 rounded-xl uppercase tracking-wider">6 active presets</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Experience / Activity Name</th>
                    <th className="p-4">Standard Net Adult</th>
                    <th className="p-4">Standard Net Child</th>
                    <th className="p-4 pr-6">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {DB_DEFAULT.activities.map(act => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6 font-bold text-[#1A3326]">{act.name}</td>
                      <td className="p-4 font-bold text-gray-900">R {act.adPrice.toLocaleString()}</td>
                      <td className="p-4 font-bold text-gray-900">R {act.chPrice.toLocaleString()}</td>
                      <td className="p-4 pr-6 text-gray-400 max-w-xs truncate">{act.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'extras' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base font-sans">Arrival Welcoming Extras Catalog</h3>
                <p className="text-xs text-gray-400">In-room amenities and gift packages</p>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-yellow-50 border border-[#D4AF37]/20 px-3 py-1 rounded-xl uppercase tracking-wider">3 active presets</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Product Name</th>
                    <th className="p-4">Unit Cost</th>
                    <th className="p-4 pr-6 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {DB_DEFAULT.extras.map(ex => (
                    <tr key={ex.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6 font-bold text-[#1A3326]">{ex.name}</td>
                      <td className="p-4 font-bold text-gray-900">R {ex.basePrice.toLocaleString()}</td>
                      <td className="p-4 pr-6 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                          <Check size={10} /> Active Preset
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'agents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base font-sans">Partner Travel Agents Master List</h3>
                <p className="text-xs text-gray-400">Agencies referring high-net-worth client accounts</p>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-yellow-50 border border-[#D4AF37]/20 px-3 py-1 rounded-xl uppercase tracking-wider">4 active presets</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Partner Agency</th>
                    <th className="p-4">Coordinator</th>
                    <th className="p-4">Contact Email</th>
                    <th className="p-4">Phone Line</th>
                    <th className="p-4 pr-6 text-right">Standard Comm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {DB_DEFAULT.agents.map(ag => (
                    <tr key={ag.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6 font-bold text-[#1A3326]">{ag.name}</td>
                      <td className="p-4 text-gray-900">{ag.contact}</td>
                      <td className="p-4 text-gray-500">{ag.email}</td>
                      <td className="p-4 text-gray-500">{ag.phone || '—'}</td>
                      <td className="p-4 pr-6 text-right text-emerald-700 font-extrabold">{ag.comm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'drivers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* DRIVERS LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-[#1A3326] text-sm uppercase tracking-wider">Assigned Driver Roster</h4>
                  <p className="text-[10px] text-gray-400">Professionally licensed private guides</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400">3 active presets</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4 pl-6">Driver Name</th>
                      <th className="p-4 pr-6">Phone Line Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                    {DB_DEFAULT.drivers.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 pl-6 font-bold text-[#1A3326]">{d.name}</td>
                        <td className="p-4 pr-6 text-gray-500 font-bold">{d.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* VEHICLES LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h4 className="font-bold text-[#1A3326] text-sm uppercase tracking-wider">Fleet Core Vehicles</h4>
                  <p className="text-[10px] text-gray-400">Luxury SUVs, off-road game trackers, and mini-buses</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400">6 active presets</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4 pl-6">Vehicle Details</th>
                      <th className="p-4 pr-6 text-right">Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                    {DB_DEFAULT.vehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 pl-6 font-bold text-[#1A3326]">{v.name}</td>
                        <td className="p-4 pr-6 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <Check size={10} /> Fully Available
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
