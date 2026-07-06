import React, { useState } from 'react';
import { DB_DEFAULT } from '../dbDefaults';
import { Briefcase, Hotel, Compass, Car, Users, Plus, Check } from 'lucide-react';

export const DatabaseView: React.FC = () => {
  const [subTab, setSubTab] = useState<'hotels' | 'activities' | 'extras' | 'agents' | 'drivers'>('hotels');

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Presets & Masters</span>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Resource Database Masters</h1>
      </div>

      {/* HORIZONTAL DB TABS */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'hotels', label: 'Hotel Stays', icon: <Hotel size={13} /> },
          { id: 'activities', label: 'Experiences & Excursions', icon: <Compass size={13} /> },
          { id: 'extras', label: 'Arrival Boutique Extras', icon: <Plus size={13} /> },
          { id: 'agents', label: 'Travel Agents', icon: <Briefcase size={13} /> },
          { id: 'drivers', label: 'Drivers & Fleet', icon: <Car size={13} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition select-none shrink-0 ${subTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TABS VIEWS */}
      <div className="card">
        {subTab === 'hotels' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-serif font-bold text-gray-900 text-sm">Hotel Properties Master List</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">3 presets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                    <th className="p-3">Hotel Property Name</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Regional Corridor</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                  {DB_DEFAULT.hotels.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{h.name}</td>
                      <td className="p-3 text-amber-500 font-bold">{'★'.repeat(h.stars)}</td>
                      <td className="p-3 text-gray-500">{h.area}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold">Active Preset</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'activities' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-serif font-bold text-gray-900 text-sm">Excursion & Tour Catalog</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">6 presets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                    <th className="p-3">Experience / Activity Name</th>
                    <th className="p-3">Standard Net Adult</th>
                    <th className="p-3">Standard Net Child</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                  {DB_DEFAULT.activities.map(act => (
                    <tr key={act.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{act.name}</td>
                      <td className="p-3 font-bold text-gray-900">R {act.adPrice}</td>
                      <td className="p-3 font-bold text-gray-900">R {act.chPrice}</td>
                      <td className="p-3 text-gray-500 max-w-xs truncate">{act.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'extras' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-serif font-bold text-gray-900 text-sm">Arrival Welcoming Extras Catalog</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">3 presets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Unit Cost</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                  {DB_DEFAULT.extras.map(ex => (
                    <tr key={ex.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{ex.name}</td>
                      <td className="p-3 font-bold text-gray-900">R {ex.basePrice}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold">Active Preset</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'agents' && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="font-serif font-bold text-gray-900 text-sm">Partner Travel Agents Master List</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">4 presets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                    <th className="p-3">Partner Agency</th>
                    <th className="p-3">Coordinator</th>
                    <th className="p-3">Contact Email</th>
                    <th className="p-3">Phone Line</th>
                    <th className="p-3 text-right">Standard Comm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                  {DB_DEFAULT.agents.map(ag => (
                    <tr key={ag.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{ag.name}</td>
                      <td className="p-3 text-gray-900">{ag.contact}</td>
                      <td className="p-3 text-gray-500">{ag.email}</td>
                      <td className="p-3 text-gray-500">{ag.phone || '—'}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold font-serif">{ag.comm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subTab === 'drivers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            {/* DRIVERS LIST */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">Assigned Driver Roster</span>
                <span className="text-[10px] font-bold text-gray-400">3 presets</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                    <th className="p-3">Driver Name</th>
                    <th className="p-3">Phone Line Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                  {DB_DEFAULT.drivers.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{d.name}</td>
                      <td className="p-3 text-gray-500 font-bold">{d.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VEHICLES LIST */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                <span className="font-bold text-gray-900 text-[11px] uppercase tracking-wider">Fleet Core Vehicles</span>
                <span className="text-[10px] font-bold text-gray-400">6 presets</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold">
                    <th className="p-3">Vehicle Details</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                  {DB_DEFAULT.vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{v.name}</td>
                      <td className="p-3 text-right text-emerald-700 font-bold">Available</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
