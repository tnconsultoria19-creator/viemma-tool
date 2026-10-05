import React, { useState } from 'react';
import { DB_DEFAULT } from '../dbDefaults';
import { 
  Briefcase, 
  Hotel, 
  Compass, 
  Car,
  Plus,
  Users,
  Phone,
  Mail,
  MessageCircle, 
  Check, 
  Database,
  Globe,
  Tag,
  Star
} from 'lucide-react';

export const DatabaseView: React.FC = () => {
  const [subTab, setSubTab] = useState<'hotels' | 'activities' | 'extras' | 'agents' | 'guides' | 'drivers'>('hotels');

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
          { id: 'agents', label: 'Partner Agencies', icon: <Briefcase size={14} /> },
          { id: 'guides', label: 'Guide Contacts', icon: <Users size={14} /> },
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
                <h3 className="font-bold text-gray-900 text-base font-sans">Partner Agency Contacts</h3>
                <p className="text-xs text-gray-400">Quick-access contact directory supplied by Viemma</p>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-yellow-50 border border-[#D4AF37]/20 px-3 py-1 rounded-xl uppercase tracking-wider">
                {DB_DEFAULT.agents.length} contacts
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Agency</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4 pr-6 text-right">Quick Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-medium">
                  {DB_DEFAULT.agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 pl-6 font-bold text-[#1A3326]">{agent.name}</td>
                      <td className="p-4 text-gray-500">{agent.email || '—'}</td>
                      <td className="p-4 text-gray-500">{agent.phone || '—'}</td>
                      <td className="p-4 pr-6">
                        <div className="flex justify-end gap-2">
                          {agent.phone && (
                            <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100" aria-label={`Call ${agent.name}`}>
                              <Phone size={11} /> Call
                            </a>
                          )}
                          {agent.email && (
                            <a href={`mailto:${agent.email}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 font-bold hover:bg-slate-100" aria-label={`Email ${agent.name}`}>
                              <Mail size={11} /> Email
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'guides' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base font-sans">Guide Contact Directory</h3>
                <p className="text-xs text-gray-400">Quick-access guide contacts and language details supplied in the contact list.</p>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37] bg-yellow-50 border border-[#D4AF37]/20 px-3 py-1 rounded-xl uppercase tracking-wider">
                {DB_DEFAULT.guides.length} contacts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {DB_DEFAULT.guides.map(guide => (
                <div key={guide.id} className="rounded-2xl border border-gray-100 bg-slate-50/60 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[#1A3326] text-sm">{guide.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{guide.phone}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <a
                        href={`tel:${guide.phone}`}
                        className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center hover:bg-emerald-100"
                        aria-label={`Call ${guide.name}`}
                        title={`Call ${guide.name}`}
                      >
                        <Phone size={13} />
                      </a>
                      <a
                        href={`https://wa.me/${guide.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100"
                        aria-label={`WhatsApp ${guide.name}`}
                        title={`WhatsApp ${guide.name}`}
                      >
                        <MessageCircle size={13} />
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.languages.portuguese === true && <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-800 text-[9px] font-bold">Portuguese</span>}
                    {guide.languages.spanish === true && <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-800 text-[9px] font-bold">Spanish</span>}
                    {guide.languages.english === true && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-bold">English</span>}
                    {guide.languages.english === null && <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-[9px] font-bold">English: not listed</span>}
                  </div>
                </div>
              ))}
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
