import React, { useState } from 'react';
import { AppState, Transfer, Waypoint } from '../types';
import { DB_DEFAULT } from '../dbDefaults';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Users, 
  MapPin, 
  AlertTriangle, 
  Tag, 
  Compass, 
  Clock, 
  Phone,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface TransfersViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onAddTransfer: (t: Transfer) => void;
  onRemoveTransfer: (id: number) => void;
  onUpdateTransfer: (id: number, updates: Partial<Transfer>) => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({
  state,
  onUpdateState,
  onAddTransfer,
  onRemoveTransfer,
  onUpdateTransfer
}) => {
  const [editingTransferId, setEditingTransferId] = useState<number | null>(null);
  const [tForm, setTForm] = useState<Partial<Transfer>>({});
  const [waypointsList, setWaypointsList] = useState<Waypoint[]>([]);

  // Waypoint sub-form
  const [waypointLoc, setWaypointLoc] = useState('');
  const [waypointWait, setWaypointWait] = useState('');

  const handleOpenAddForm = () => {
    setTForm({
      type: 'Airport Arrival',
      date: state.client.startDate || '',
      time: '',
      status: 'Pending',
      from: '',
      to: '',
      meet: '',
      sign: '',
      flight: '',
      dist: '',
      dur: '',
      vehicle: 'Mercedes V-Class — 7 Seater',
      driver: 'Sipho Khumalo',
      driverPhone: '+27 60 555 1234',
      paxCount: state.guests.length || 0,
      paxIds: state.guests.map(g => g.id), // Default all guests
      bagHand: state.guests.length || 0,
      bagCheck: state.guests.length || 0,
      bagOver: 0,
      seats: [],
      special: [],
      cost: 0,
      tolls: 0,
      parking: 0,
      notes: ''
    });
    setWaypointsList([]);
    setEditingTransferId(-1);
  };

  const handleEditTransfer = (t: Transfer) => {
    setTForm({ ...t });
    setWaypointsList(t.waypoints || []);
    setEditingTransferId(t.id);
  };

  const handleSaveTransfer = () => {
    if (!tForm.from || !tForm.to) {
      alert('Please fill out Pick-up Location and Drop-off Location.');
      return;
    }

    const savedTransfer: Transfer = {
      id: tForm.id || Date.now(),
      type: tForm.type || 'Airport Arrival',
      date: tForm.date || '',
      time: tForm.time || '',
      status: tForm.status || 'Pending',
      from: tForm.from,
      to: tForm.to,
      meet: tForm.meet || '',
      sign: tForm.sign || '',
      flight: tForm.flight || '',
      dist: tForm.dist || '',
      dur: tForm.dur || '',
      vehicle: tForm.vehicle || '',
      driver: tForm.driver || '',
      driverPhone: tForm.driverPhone || '',
      paxCount: tForm.paxIds?.length || 0,
      paxIds: tForm.paxIds || [],
      bagHand: Number(tForm.bagHand) || 0,
      bagCheck: Number(tForm.bagCheck) || 0,
      bagOver: Number(tForm.bagOver) || 0,
      seats: tForm.seats || [],
      special: tForm.special || [],
      cost: Number(tForm.cost) || 0,
      tolls: Number(tForm.tolls) || 0,
      parking: Number(tForm.parking) || 0,
      notes: tForm.notes || '',
      waypoints: waypointsList
    };

    if (editingTransferId === -1) {
      onAddTransfer(savedTransfer);
    } else {
      onUpdateTransfer(savedTransfer.id, savedTransfer);
    }
    setEditingTransferId(null);
    setTForm({});
    setWaypointsList([]);
  };

  const handleAddWaypoint = () => {
    if (!waypointLoc) {
      alert('Waypoint location is required.');
      return;
    }
    const newW: Waypoint = {
      id: Date.now(),
      location: waypointLoc,
      waitTime: waypointWait
    };
    setWaypointsList([...waypointsList, newW]);
    setWaypointLoc('');
    setWaypointWait('');
  };

  const handleRemoveWaypoint = (wid: number) => {
    setWaypointsList(waypointsList.filter(w => w.id !== wid));
  };

  const togglePassengerSelection = (paxId: number) => {
    const list = tForm.paxIds ? [...tForm.paxIds] : [];
    let updated: number[];
    if (list.includes(paxId)) {
      updated = list.filter(id => id !== paxId);
    } else {
      updated = [...list, paxId];
    }
    setTForm({ ...tForm, paxIds: updated, paxCount: updated.length });
  };

  const toggleTFormTag = (field: 'seats' | 'special', val: string) => {
    const list = tForm[field] ? [...tForm[field]!] : [];
    let updated: string[];
    if (list.includes(val)) {
      updated = list.filter(x => x !== val);
    } else {
      updated = [...list, val];
    }
    setTForm({ ...tForm, [field]: updated });
  };

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const dObj = DB_DEFAULT.drivers.find(d => d.name === val);
    setTForm({
      ...tForm,
      driver: val,
      driverPhone: dObj?.phone || ''
    });
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <Car size={14} /> Ground Operations
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Ground Logistics & Fleet Tracker</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Schedule private chauffeured transfers, airport shuttle pickups, fleet vehicle capacities, driver dispatch and routing checkpoints.
          </p>
        </div>
        {editingTransferId === null && (
          <button 
            onClick={handleOpenAddForm} 
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-md hover:translate-y-[-1px] transition-all duration-150 shrink-0"
          >
            <Plus size={14} /> Schedule Ground Transfer
          </button>
        )}
      </div>

      {/* FORM CONFIGURATION PANEL */}
      {editingTransferId !== null && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A3326] to-[#224433] text-white p-6 md:p-8 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">Interactive Logistical Desk</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Car size={20} className="text-[#D4AF37]" />
                {editingTransferId === -1 ? 'Configure Fleet Transfer' : 'Update Fleet Transfer'}
              </h2>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setEditingTransferId(null)} 
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTransfer} 
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] text-xs font-bold shadow-sm hover:translate-y-[-1px] transition-all"
              >
                Save Dispatch Rules
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-gray-50/50">
            
            {/* GROUP 1: Basic Information */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Compass size={14} className="text-[#D4AF37]" /> Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Transfer Type</label>
                  <select 
                    value={tForm.type || 'Airport Arrival'}
                    onChange={e => setTForm({ ...tForm, type: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="Airport Arrival">Airport Arrival Meet & Greet</option>
                    <option value="Airport Departure">Airport Departure Drop-off</option>
                    <option value="Inter-Hotel">Inter-Hotel Transfer</option>
                    <option value="Excursion Shuttle">Excursion Shuttle Run</option>
                    <option value="Bespoke Tour">Bespoke Full-Day Chauffeur</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Transfer Date</label>
                  <input 
                    type="date" 
                    value={tForm.date || ''} 
                    onChange={e => setTForm({ ...tForm, date: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Pick-up Time (LT)</label>
                  <input 
                    type="time" 
                    value={tForm.time || ''} 
                    onChange={e => setTForm({ ...tForm, time: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Dispatch Status</label>
                  <select 
                    value={tForm.status || 'Pending'}
                    onChange={e => setTForm({ ...tForm, status: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="Pending">Pending Assignment</option>
                    <option value="Confirmed">Chauffeur Dispatched</option>
                    <option value="Completed">Completed Run</option>
                    <option value="Cancelled">Cancelled Run</option>
                  </select>
                </div>

              </div>
            </div>

            {/* GROUP 2: Travel Schedule / Routing & Airport meet rules */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <MapPin size={14} className="text-[#D4AF37]" /> Transfer Routing & Pickups
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Pick-up Location (From)</label>
                  <input 
                    type="text" 
                    value={tForm.from || ''} 
                    onChange={e => setTForm({ ...tForm, from: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                    placeholder="e.g. Cape Town International Airport (CPT)" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Drop-off Location (To)</label>
                  <input 
                    type="text" 
                    value={tForm.to || ''} 
                    onChange={e => setTForm({ ...tForm, to: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                    placeholder="e.g. The Silo Hotel" 
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Greeting Placard Text (Placard sign)</label>
                  <input 
                    type="text" 
                    value={tForm.sign || ''} 
                    onChange={e => setTForm({ ...tForm, sign: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                    placeholder="e.g. WELCOME THE HARRISON GROUP" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Arrival Flight Number (if applicable)</label>
                  <input 
                    type="text" 
                    value={tForm.flight || ''} 
                    onChange={e => setTForm({ ...tForm, flight: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] transition duration-200" 
                    placeholder="e.g. EK770" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Meet & Greet Specific Protocol</label>
                  <input 
                    type="text" 
                    value={tForm.meet || ''} 
                    onChange={e => setTForm({ ...tForm, meet: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                    placeholder="e.g. Meet outside gate 4 with bottled water" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 3: Intermediate Waypoint Builder */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <MapPin size={14} className="text-[#D4AF37]" /> Intermediate Routing Checkpoints (Stopovers)
              </h3>

              {waypointsList.length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs flex-wrap">
                  <span className="font-bold text-gray-800">{tForm.from || 'Pick-up'}</span>
                  {waypointsList.map((w, idx) => (
                    <React.Fragment key={w.id}>
                      <ArrowRight size={12} className="text-gray-400" />
                      <div className="bg-white border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                        <span className="font-bold text-[#1A3326]">{w.location}</span>
                        {w.waitTime && <span className="text-[9px] text-gray-400">({w.waitTime} Wait)</span>}
                      </div>
                    </React.Fragment>
                  ))}
                  <ArrowRight size={12} className="text-gray-400" />
                  <span className="font-bold text-gray-800">{tForm.to || 'Destination'}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  value={waypointLoc} 
                  onChange={e => setWaypointLoc(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37]" 
                  placeholder="e.g. Kirstenbosch Botanical Gardens (Stopover)" 
                />
                <input 
                  type="text" 
                  value={waypointWait} 
                  onChange={e => setWaypointWait(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37]" 
                  placeholder="Optional Wait Duration (e.g. 1 hour)" 
                />
              </div>

              <div className="flex justify-start">
                <button 
                  onClick={handleAddWaypoint} 
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[11px] font-bold text-gray-700 shadow-sm transition"
                >
                  <Plus size={12} /> Append Logistics Milestone
                </button>
              </div>

              {waypointsList.length > 0 && (
                <div className="space-y-2 border-t border-gray-50 pt-4">
                  {waypointsList.map((w, idx) => (
                    <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <span>
                        <strong className="text-gray-800">Check-point #{idx + 1}: {w.location}</strong> 
                        {w.waitTime && ` (Wait / Stay duration: ${w.waitTime})`}
                      </span>
                      <button 
                        onClick={() => handleRemoveWaypoint(w.id)} 
                        className="text-rose-600 hover:text-rose-700 font-bold transition text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GROUP 4: Dispatch details */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Users size={14} className="text-[#D4AF37]" /> Chauffeur, Driver & Fleet Vehicles
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Chauffeur Driver</label>
                  <select 
                    value={tForm.driver || ''} 
                    onChange={handleDriverChange}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="">Choose Driver...</option>
                    {DB_DEFAULT.drivers.map(d => (
                      <option key={d.name} value={d.name}>{d.name} — {d.phone}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Driver Contact Line</label>
                  <input 
                    type="text" 
                    value={tForm.driverPhone || ''} 
                    onChange={e => setTForm({ ...tForm, driverPhone: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Fleet Vehicle Model</label>
                  <input 
                    type="text" 
                    value={tForm.vehicle || ''} 
                    onChange={e => setTForm({ ...tForm, vehicle: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                    placeholder="e.g. Mercedes V-Class SUV"
                  />
                </div>

              </div>
            </div>

            {/* GROUP 5: Luggage & Passenger quantities */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Users size={14} className="text-[#D4AF37]" /> Travelers & Baggage Counts
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Hand Baggage (Count)</label>
                  <input 
                    type="number" 
                    value={tForm.bagHand || 0} 
                    onChange={e => setTForm({ ...tForm, bagHand: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Checked Bags (Count)</label>
                  <input 
                    type="number" 
                    value={tForm.bagCheck || 0} 
                    onChange={e => setTForm({ ...tForm, bagCheck: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Oversized Cargo</label>
                  <input 
                    type="number" 
                    value={tForm.bagOver || 0} 
                    onChange={e => setTForm({ ...tForm, bagOver: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
              </div>

              {/* Passenger selection */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] text-gray-500 font-bold uppercase block">Roster Travelers Scheduled for Transfer</label>
                <div className="flex flex-wrap gap-2.5">
                  {state.guests.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No travelers available on group roster.</span>
                  ) : (
                    state.guests.map(g => {
                      const isSelected = tForm.paxIds?.includes(g.id);
                      return (
                        <span 
                          key={g.id} 
                          onClick={() => togglePassengerSelection(g.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer border select-none transition duration-150 flex items-center gap-1.5 hover:translate-y-[-1px] ${
                            isSelected 
                              ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' 
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-[#D4AF37]" />}
                          {g.first} {g.last} ({g.age})
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* GROUP 6: Financial costings */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Clock size={14} className="text-[#D4AF37]" /> Ground Logistics Costs (ZAR)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Net Base Cost (R)</label>
                  <input 
                    type="number" 
                    value={tForm.cost || 0} 
                    onChange={e => setTForm({ ...tForm, cost: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Highway Tolls (R)</label>
                  <input 
                    type="number" 
                    value={tForm.tolls || 0} 
                    onChange={e => setTForm({ ...tForm, tolls: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Airport Parking Fees (R)</label>
                  <input 
                    type="number" 
                    value={tForm.parking || 0} 
                    onChange={e => setTForm({ ...tForm, parking: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
              </div>
            </div>

            {/* GROUP 7: Vehicle config tags & Amenities */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Tag size={14} className="text-[#D4AF37]" /> Fleet Configurations & Amenities
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase block tracking-wider mb-2.5">Chauffeur Seating Config (Select multiple)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Child Booster Seat', 'Rear-Facing Infant seat', 'Extra legroom row', 'Front-Passenger preferred', 'Wheelchair tie-down ready'].map(s => {
                      const isSelected = tForm.seats?.includes(s);
                      return (
                        <span 
                          key={s} 
                          onClick={() => toggleTFormTag('seats', s)}
                          className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold cursor-pointer border select-none transition-all ${
                            isSelected 
                              ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' 
                              : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {s}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 font-bold uppercase block tracking-wider mb-2.5">Bespoke In-Vehicle Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {['Bottled Spring Water', 'Sparkling Juices', 'WiFi Hotspot Access', 'Local SIM Card pack', 'Dry cooling towels', 'Universal USB Chargers'].map(sp => {
                      const isSelected = tForm.special?.includes(sp);
                      return (
                        <span 
                          key={sp} 
                          onClick={() => toggleTFormTag('special', sp)}
                          className={`px-3.5 py-2 rounded-xl text-[11px] font-semibold cursor-pointer border select-none transition-all ${
                            isSelected 
                              ? 'bg-emerald-50 border-[#D4AF37] text-[#1A3326]' 
                              : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          {sp}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP 8: Logistics Notes */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Tag size={14} className="text-[#D4AF37]" /> Internal Logistics Coordination Notes
              </h3>
              <textarea 
                value={tForm.notes || ''} 
                onChange={e => setTForm({ ...tForm, notes: e.target.value })}
                className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition"
                placeholder="e.g. Flight booked via Skywards miles, business class lounge passes issued, infant bassinet requested in bulkhead row..."
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

          </div>

          {/* Sticky footer for action buttons */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3.5">
            <button 
              onClick={() => setEditingTransferId(null)} 
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-sm transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveTransfer} 
              className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md hover:translate-y-[-1px] transition duration-150"
            >
              Save Dispatch Rules
            </button>
          </div>

        </div>
      )}

      {/* REGISTERED TRANSFERS LIST */}
      <div className="space-y-6">
        {state.transfers.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-[24px] shadow-sm max-w-lg mx-auto space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-[#065f46] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Car size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-sm">No Fleet Transfers Scheduled</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Organize private meet and greet pickups, inter-lodge transfers, and airport shuttle routes.
              </p>
            </div>
            <button 
              onClick={handleOpenAddForm} 
              className="px-4 py-2.5 bg-[#1A3326] text-white rounded-xl text-xs font-bold shadow hover:bg-[#12241b] transition"
            >
              Schedule First Transfer
            </button>
          </div>
        ) : (
          state.transfers.map(t => {
            const grandTotal = t.cost + t.tolls + t.parking;
            const assignedPax = state.guests.filter(g => t.paxIds.includes(g.id));

            return (
              <div 
                key={t.id} 
                className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden"
              >
                {/* Visual side badge */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#D4AF37]" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-5 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#065f46] flex items-center justify-center border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <Car size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{t.type} Logistics</span>
                      <h3 className="font-bold text-gray-900 text-sm mt-0.5">
                        {t.vehicle} • <span className="font-sans text-xs text-gray-500">Chauffeur: <strong className="text-gray-900 font-semibold">{t.driver || 'Unassigned'}</strong></span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditTransfer(t)} 
                      className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:border-gray-300 flex items-center justify-center transition shadow-sm"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => onRemoveTransfer(t.id)} 
                      className="w-9 h-9 rounded-xl border border-rose-100 bg-rose-50/20 text-rose-500 hover:text-white hover:bg-rose-500 flex items-center justify-center transition shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Logistics grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 text-xs text-gray-600 mb-5">
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Pick-up Location</span>
                    <strong className="text-[#1A3326] font-bold">{t.from}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Drop-off Location</span>
                    <strong className="text-gray-900 font-semibold">{t.to}</strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Date & Departure</span>
                    <strong className="text-gray-900 font-semibold">{t.date} • {t.time || '—'}</strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Greet Placard Text</span>
                    <strong className="text-gray-900 font-medium italic truncate block">{t.sign || 'No Sign board'}</strong>
                  </div>
                  <div className="text-left md:text-right border-l border-gray-100 pl-4">
                    <span className="block font-bold text-[9px] text-[#D4AF37] uppercase tracking-widest mb-1">Transfer Logistics Sum</span>
                    <strong className="text-base font-bold text-[#1A3326]">R {grandTotal.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Waypoints line */}
                {t.waypoints && t.waypoints.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 text-[11px] text-gray-500 space-y-2">
                    <span className="font-bold text-[#065f46] block flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#D4AF37]" /> Logistical Checkpoint Waypoints
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs">{t.from}</span>
                      {t.waypoints.map((w) => (
                        <React.Fragment key={w.id}>
                          <ArrowRight size={10} className="text-gray-400" />
                          <div className="bg-[#1A3326]/5 border border-[#1A3326]/10 px-2.5 py-1 rounded-lg text-gray-700 flex items-center gap-1.5 font-medium">
                            <span>{w.location}</span>
                            {w.waitTime && <span className="text-[9px] text-[#D4AF37] font-bold">({w.waitTime})</span>}
                          </div>
                        </React.Fragment>
                      ))}
                      <ArrowRight size={10} className="text-gray-400" />
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs">{t.to}</span>
                    </div>
                  </div>
                )}

                {/* Additional tags / configurations */}
                <div className="flex flex-wrap gap-2.5 mb-5">
                  {t.seats && t.seats.map(st => (
                    <span key={st} className="text-[10px] bg-emerald-50/50 text-[#1A3326] border border-emerald-100 px-2.5 py-1 rounded-lg font-semibold">{st}</span>
                  ))}
                  {t.special && t.special.map(sp => (
                    <span key={sp} className="text-[10px] bg-yellow-50/50 text-[#1A3326] border border-[#D4AF37]/20 px-2.5 py-1 rounded-lg font-semibold">{sp}</span>
                  ))}
                </div>

                {/* Assigned travelers & baggage footer */}
                <div className="border-t border-gray-50 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Assigned Travelers:</span>
                    {assignedPax.length === 0 ? (
                      <span className="text-red-500 italic">No guests mapped to transfer!</span>
                    ) : (
                      assignedPax.map(ap => (
                        <span 
                          key={ap.id} 
                          className="bg-gray-50 text-gray-700 border border-gray-100 px-2.5 py-1 rounded-lg font-semibold text-[11px]"
                        >
                          {ap.first} {ap.last}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-4">
                    <span>Hand: {t.bagHand || 0}</span>
                    <span className="text-gray-200">|</span>
                    <span>Checked: {t.bagCheck || 0}</span>
                    {t.bagOver && t.bagOver > 0 ? (
                      <>
                        <span className="text-gray-200">|</span>
                        <span className="text-yellow-600 font-bold">Oversize Cargo: {t.bagOver}</span>
                      </>
                    ) : null}
                    {t.driverPhone && (
                      <>
                        <span className="text-gray-200">|</span>
                        <a href={`tel:${t.driverPhone}`} className="text-[#D4AF37] flex items-center gap-1.5 hover:underline font-bold">
                          <Phone size={10} /> Call SIPHO
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {t.notes && (
                  <div className="bg-yellow-50/50 border border-[#D4AF37]/10 p-3 rounded-xl text-[11px] text-gray-500 mt-4">
                    <strong>Coordination Notes:</strong> {t.notes}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
