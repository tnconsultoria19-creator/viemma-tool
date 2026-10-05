import React, { useState } from 'react';
import { AppState, Flight, Stop } from '../types';
import { 
  Plane, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Users, 
  MapPin, 
  ArrowRight, 
  Briefcase, 
  Calendar, 
  Clock, 
  Tag, 
  Compass, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface FlightsViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onAddFlight: (f: Flight) => void;
  onRemoveFlight: (id: number) => void;
  onUpdateFlight: (id: number, updates: Partial<Flight>) => void;
}

export const FlightsView: React.FC<FlightsViewProps> = ({
  state,
  onUpdateState,
  onAddFlight,
  onRemoveFlight,
  onUpdateFlight
}) => {
  const [editingFlightId, setEditingFlightId] = useState<number | null>(null);
  const [fForm, setFForm] = useState<Partial<Flight>>({});
  const [stopsList, setStopsList] = useState<Stop[]>([]);

  // Stop sub-forms
  const [stopAirport, setStopAirport] = useState('');
  const [stopArr, setStopArr] = useState('');
  const [stopDep, setStopDep] = useState('');
  const [stopDur, setStopDur] = useState('');
  const [stopChangeNo, setStopChangeNo] = useState('');

  const AIRLINES = ["Emirates", "South African Airways", "TAAG Angola", "Airlink", "Qatar Airways", "Lufthansa", "Ethiopian Airlines"];

  const handleOpenAddForm = () => {
    setFForm({
      direction: 'Inbound',
      airline: 'Emirates',
      flightNo: '',
      pnr: '',
      from: '',
      to: '',
      date: state.client.startDate || '',
      depTime: '',
      arrTime: '',
      duration: '',
      cabin: 'Economy',
      status: 'Quoted',
      paxIds: state.guests.map(g => g.id), // Default to all guests
      bagHand: 1,
      bagCheck: 1,
      bagOver: 0,
      cost: 0,
      markup: 0,
      qty: state.guests.length || 1,
      notes: ''
    });
    setStopsList([]);
    setEditingFlightId(-1); // special ID for new form
  };

  const handleEditFlight = (f: Flight) => {
    setFForm({ ...f });
    setStopsList(f.stops || []);
    setEditingFlightId(f.id);
  };

  const handleSaveFlight = () => {
    if (!fForm.flightNo || !fForm.from || !fForm.to) {
      alert('Please fill out Flight Number, From, and To.');
      return;
    }

    const savedFlight: Flight = {
      id: fForm.id || Date.now(),
      direction: fForm.direction || 'Inbound',
      airline: fForm.airline || 'Emirates',
      flightNo: fForm.flightNo.toUpperCase(),
      pnr: (fForm.pnr || '').toUpperCase(),
      from: fForm.from.toUpperCase(),
      to: fForm.to.toUpperCase(),
      date: fForm.date || '',
      depTime: fForm.depTime || '',
      arrTime: fForm.arrTime || '',
      duration: fForm.duration || '',
      cabin: fForm.cabin || 'Economy',
      status: fForm.status || 'Quoted',
      paxIds: fForm.paxIds || [],
      bagHand: Number(fForm.bagHand) || 0,
      bagCheck: Number(fForm.bagCheck) || 0,
      bagOver: Number(fForm.bagOver) || 0,
      cost: Number(fForm.cost) || 0,
      markup: Number(fForm.markup) || 0,
      qty: Number(fForm.qty) || 1,
      notes: fForm.notes || '',
      stops: stopsList
    };

    if (editingFlightId === -1) {
      onAddFlight(savedFlight);
    } else {
      onUpdateFlight(savedFlight.id, savedFlight);
    }
    setEditingFlightId(null);
    setFForm({});
    setStopsList([]);
  };

  const handleAddStop = () => {
    if (!stopAirport) {
      alert('Airport is required.');
      return;
    }
    const newStop: Stop = {
      id: Date.now(),
      airport: stopAirport.toUpperCase(),
      arrTime: stopArr,
      depTime: stopDep,
      duration: stopDur,
      changeFlightNo: stopChangeNo.toUpperCase()
    };
    setStopsList([...stopsList, newStop]);
    setStopAirport('');
    setStopArr('');
    setStopDep('');
    setStopDur('');
    setStopChangeNo('');
  };

  const handleRemoveStop = (sid: number) => {
    setStopsList(stopsList.filter(s => s.id !== sid));
  };

  const togglePassengerSelection = (paxId: number) => {
    const list = fForm.paxIds ? [...fForm.paxIds] : [];
    let updated: number[];
    if (list.includes(paxId)) {
      updated = list.filter(id => id !== paxId);
    } else {
      updated = [...list, paxId];
    }
    setFForm({ ...fForm, paxIds: updated });
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Title Header with Spacious Breathing Room */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <Plane size={14} /> Global Transit System
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Aviation & Flight Corridors</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Link long-haul flights, regional transfers, layover routing waypoints, airline carriers, and ticket booking status updates.
          </p>
        </div>
        {editingFlightId === null && (
          <button 
            onClick={handleOpenAddForm} 
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-md hover:translate-y-[-1px] transition-all duration-150 shrink-0"
          >
            <Plus size={14} /> Link New Flight Sector
          </button>
        )}
      </div>

      {/* FLIGHT EDIT/ADD SIDE-OVER WORKSPACE OR CARD */}
      {editingFlightId !== null && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1A3326] to-[#224433] text-white p-6 md:p-8 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block mb-1">Interactive Configurator</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Plane size={20} className="text-[#D4AF37]" />
                {editingFlightId === -1 ? 'Configure Flight Sector' : 'Update Flight Sector'}
              </h2>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setEditingFlightId(null)} 
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFlight} 
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] text-xs font-bold shadow-sm hover:translate-y-[-1px] transition-all"
              >
                Save Flight Links
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-gray-50/50">
            
            {/* GROUP 1: Basic Ticket Information */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Compass size={14} className="text-[#D4AF37]" /> Basic Flight Info
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Sector Direction</label>
                  <select 
                    value={fForm.direction || 'Inbound'}
                    onChange={e => setFForm({ ...fForm, direction: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200"
                  >
                    <option value="Inbound">Inbound (Arrival)</option>
                    <option value="Outbound">Outbound (Departure)</option>
                    <option value="Internal">Internal (Regional)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Airline Carrier</label>
                  <input 
                    type="text" 
                    value={fForm.airline || ''} 
                    onChange={e => setFForm({ ...fForm, airline: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. SAA"
                    list="airlines-list"
                  />
                  <datalist id="airlines-list">
                    {AIRLINES.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Flight Number</label>
                  <input 
                    type="text" 
                    value={fForm.flightNo || ''} 
                    onChange={e => setFForm({ ...fForm, flightNo: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. SA042" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">PNR Reference Code</label>
                  <input 
                    type="text" 
                    value={fForm.pnr || ''} 
                    onChange={e => setFForm({ ...fForm, pnr: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-[#065f46] uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. ZQW67B" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 2: Travel Schedule / Airport Information */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Calendar size={14} className="text-[#D4AF37]" /> Travel Schedule & Airports
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Origin Airport</label>
                  <input 
                    type="text" 
                    value={fForm.from || ''} 
                    onChange={e => setFForm({ ...fForm, from: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. JFK" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Destination Airport</label>
                  <input 
                    type="text" 
                    value={fForm.to || ''} 
                    onChange={e => setFForm({ ...fForm, to: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 uppercase focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                    placeholder="e.g. CPT" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Flight Date</label>
                  <input 
                    type="date" 
                    value={fForm.date || ''} 
                    onChange={e => setFForm({ ...fForm, date: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Departure Time (LT)</label>
                  <input 
                    type="time" 
                    value={fForm.depTime || ''} 
                    onChange={e => setFForm({ ...fForm, depTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Arrival Time (LT)</label>
                  <input 
                    type="time" 
                    value={fForm.arrTime || ''} 
                    onChange={e => setFForm({ ...fForm, arrTime: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition duration-200" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 3: Layover stops & Routing */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <MapPin size={14} className="text-[#D4AF37]" /> Flight Routing Stops & Layovers (Multi-Stop Waypoints)
              </h3>

              {stopsList.length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs flex-wrap">
                  <span className="font-bold text-gray-800">{fForm.from || 'Origin'}</span>
                  {stopsList.map((stop, idx) => (
                    <React.Fragment key={stop.id}>
                      <ArrowRight size={12} className="text-gray-400" />
                      <div className="bg-white border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm animate-in zoom-in-95">
                        <span className="font-bold text-[#1A3326]">{stop.airport}</span>
                        <span className="text-[9px] text-gray-400 font-medium">({stop.duration || 'Stop'})</span>
                      </div>
                    </React.Fragment>
                  ))}
                  <ArrowRight size={12} className="text-gray-400" />
                  <span className="font-bold text-gray-800">{fForm.to || 'Destination'}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <input 
                  type="text" 
                  value={stopAirport} 
                  onChange={e => setStopAirport(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs uppercase focus:border-[#D4AF37] focus:ring-1" 
                  placeholder="Layover Airport (e.g. DXB)" 
                />
                <input 
                  type="time" 
                  value={stopArr} 
                  onChange={e => setStopArr(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:ring-1" 
                  placeholder="Arr Time" 
                />
                <input 
                  type="time" 
                  value={stopDep} 
                  onChange={e => setStopDep(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:ring-1" 
                  placeholder="Dep Time" 
                />
                <input 
                  type="text" 
                  value={stopDur} 
                  onChange={e => setStopDur(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs focus:border-[#D4AF37] focus:ring-1" 
                  placeholder="Layover Duration" 
                />
                <input 
                  type="text" 
                  value={stopChangeNo} 
                  onChange={e => setStopChangeNo(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs uppercase focus:border-[#D4AF37] focus:ring-1" 
                  placeholder="New Flight # (optional)" 
                />
              </div>

              <div className="flex justify-start">
                <button 
                  onClick={handleAddStop} 
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[11px] font-bold text-gray-700 shadow-sm transition"
                >
                  <Plus size={12} /> Append Transit Waypoint
                </button>
              </div>

              {stopsList.length > 0 && (
                <div className="space-y-2 border-t border-gray-50 pt-4">
                  {stopsList.map((stop, idx) => (
                    <div key={stop.id} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <span>
                        <strong className="text-gray-800">Stop #{idx + 1}: {stop.airport}</strong> — Arr: {stop.arrTime || '—'} | Dep: {stop.depTime || '—'} | Duration: {stop.duration || '—'} 
                        {stop.changeFlightNo && ` (Aviation changes to ${stop.changeFlightNo})`}
                      </span>
                      <button 
                        onClick={() => handleRemoveStop(stop.id)} 
                        className="text-rose-600 hover:text-rose-700 font-bold transition text-[11px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GROUP 4: Class & Pricing */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Clock size={14} className="text-[#D4AF37]" /> Class Cabin & Pricing Metrics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Cabin Class</label>
                  <select 
                    value={fForm.cabin || 'Economy'}
                    onChange={e => setFForm({ ...fForm, cabin: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First Class</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Booking Status</label>
                  <select 
                    value={fForm.status || 'Quoted'}
                    onChange={e => setFForm({ ...fForm, status: e.target.value as any })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:border-[#D4AF37] focus:border-[#D4AF37] transition duration-200"
                  >
                    <option value="Quoted">Quoted</option>
                    <option value="Booked">Booked (Unconfirmed)</option>
                    <option value="Ticketed">Ticketed (Confirmed)</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Net Base Cost per Pax (R)</label>
                  <input 
                    type="number" 
                    value={fForm.cost || 0} 
                    onChange={e => setFForm({ ...fForm, cost: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Buffer Markup per Pax (R)</label>
                  <input 
                    type="number" 
                    value={fForm.markup || 0} 
                    onChange={e => setFForm({ ...fForm, markup: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Passenger Quantity</label>
                  <input 
                    type="number" 
                    value={fForm.qty || 1} 
                    onChange={e => setFForm({ ...fForm, qty: Number(e.target.value) })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-900 focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>

              </div>
            </div>

            {/* GROUP 5: Luggage Protocols */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Briefcase size={14} className="text-[#D4AF37]" /> Baggage Protocols
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Hand Luggage (per Pax)</label>
                  <input 
                    type="number" 
                    value={fForm.bagHand || 1} 
                    onChange={e => setFForm({ ...fForm, bagHand: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Checked Bags (per Pax)</label>
                  <input 
                    type="number" 
                    value={fForm.bagCheck || 1} 
                    onChange={e => setFForm({ ...fForm, bagCheck: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Oversized Items (Bikes, Golf Bags)</label>
                  <input 
                    type="number" 
                    value={fForm.bagOver || 0} 
                    onChange={e => setFForm({ ...fForm, bagOver: Number(e.target.value) })} 
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition duration-200" 
                  />
                </div>
              </div>
            </div>

            {/* GROUP 6: Passenger assignment */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Users size={14} className="text-[#D4AF37]" /> Assign Passengers (Roster Link)
              </h3>

              <div className="flex flex-wrap gap-2.5">
                {state.guests.length === 0 ? (
                  <span className="text-xs text-gray-400 italic flex items-center gap-1.5">
                    <AlertCircle size={14} /> Please add passengers to your group roster in the Home/Intake section first.
                  </span>
                ) : (
                  state.guests.map(g => {
                    const isSelected = fForm.paxIds?.includes(g.id);
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

            {/* GROUP 7: Flight Coordination Notes */}
            <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-xs uppercase font-bold text-[#1A3326] tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
                <Tag size={14} className="text-[#D4AF37]" /> Coordination & Internal Notes
              </h3>
              <textarea 
                value={fForm.notes || ''} 
                onChange={e => setFForm({ ...fForm, notes: e.target.value })}
                className="w-full p-4 rounded-xl border border-gray-200 text-xs font-medium focus:border-[#D4AF37] transition"
                placeholder="e.g. Flight booked via Skywards miles, business class lounge passes issued, infant bassinet requested in bulkhead row..."
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

          </div>

          {/* Sticky footer for action buttons */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3.5">
            <button 
              onClick={() => setEditingFlightId(null)} 
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-sm transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveFlight} 
              className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md hover:translate-y-[-1px] transition duration-150"
            >
              Save Flight Links
            </button>
          </div>

        </div>
      )}

      {/* REGISTERED FLIGHTS LIST */}
      <div className="space-y-6">
        {state.flights.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-[24px] shadow-sm max-w-lg mx-auto space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-50 text-[#065f46] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Plane size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-gray-900 text-sm">No Flight Sectors Registered</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Connect long-haul and regional air corridors. Tap "Link New Flight Sector" to begin.
              </p>
            </div>
            <button 
              onClick={handleOpenAddForm} 
              className="px-4 py-2.5 bg-[#1A3326] text-white rounded-xl text-xs font-bold shadow hover:bg-[#12241b] transition"
            >
              Configure First Sector
            </button>
          </div>
        ) : (
          state.flights.map(f => {
            const retailPerPax = f.cost + f.markup;
            const retailTotal = retailPerPax * f.qty;
            const assignedPax = state.guests.filter(g => f.paxIds.includes(g.id));

            return (
              <div 
                key={f.id} 
                className="bg-white rounded-[24px] border border-gray-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden"
              >
                {/* Visual badge for sector direction on left side */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  f.direction === 'Inbound' ? 'bg-[#D4AF37]' : f.direction === 'Outbound' ? 'bg-[#1A3326]' : 'bg-blue-500'
                }`} />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-5 mb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#065f46] flex items-center justify-center border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform duration-200">
                      <Plane size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{f.direction} Sector Connection</span>
                      <h3 className="font-bold text-gray-900 text-sm mt-0.5">
                        {f.airline} {f.flightNo} • <span className="font-mono text-xs text-[#065f46] font-bold tracking-wide">PNR: {f.pnr || 'NOT SET'}</span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditFlight(f)} 
                      className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:border-gray-300 flex items-center justify-center transition shadow-sm"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => onRemoveFlight(f.id)} 
                      className="w-9 h-9 rounded-xl border border-rose-100 bg-rose-50/20 text-rose-500 hover:text-white hover:bg-rose-500 flex items-center justify-center transition shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Core details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 text-xs text-gray-600 mb-5">
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Route Passage</span>
                    <strong className="text-[#1A3326] font-bold flex items-center gap-1">
                      {f.from} <ArrowRight size={10} className="text-[#D4AF37]" /> {f.to}
                    </strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Departure Schedule</span>
                    <strong className="text-gray-900 font-semibold">{f.date} • {f.depTime || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Arrival Estimate</span>
                    <strong className="text-gray-900 font-semibold">{f.arrTime || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-widest mb-1">Cabin Class / Status</span>
                    <strong className="text-gray-900 font-semibold">
                      {f.cabin} • <span className="text-[#D4AF37] font-bold">{f.status}</span>
                    </strong>
                  </div>
                  <div className="text-left md:text-right border-l md:border-l border-gray-100 pl-4 md:pl-6">
                    <span className="block font-bold text-[9px] text-[#D4AF37] uppercase tracking-widest mb-1">Grand Retail Total</span>
                    <strong className="text-base font-bold text-[#1A3326]">R {retailTotal.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Layover and stop timeline */}
                {f.stops && f.stops.length > 0 && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 text-[11px] text-gray-500 space-y-2">
                    <span className="font-bold text-[#065f46] block flex items-center gap-1.5">
                      <MapPin size={12} className="text-[#D4AF37]" /> Multi-Stop Corridor Milestones
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs">{f.from}</span>
                      {f.stops.map((stop) => (
                        <React.Fragment key={stop.id}>
                          <ArrowRight size={10} className="text-gray-400" />
                          <div className="bg-[#1A3326]/5 border border-[#1A3326]/10 px-2.5 py-1 rounded-lg text-gray-700 flex items-center gap-1.5">
                            <span className="font-bold text-[#1A3326]">{stop.airport}</span>
                            <span className="text-[9px] text-gray-400">({stop.duration || 'Transit'})</span>
                            {stop.changeFlightNo && (
                              <span className="bg-[#D4AF37]/20 text-[#1A3326] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                Switch to {stop.changeFlightNo}
                              </span>
                            )}
                          </div>
                        </React.Fragment>
                      ))}
                      <ArrowRight size={10} className="text-gray-400" />
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-xs">{f.to}</span>
                    </div>
                  </div>
                )}

                {/* Footnotes &assigned passengers */}
                <div className="border-t border-gray-50 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-wider">Assigned Pax:</span>
                    {assignedPax.length === 0 ? (
                      <span className="text-red-500 italic">No passengers mapped!</span>
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

                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-3">
                    <span>Hand: {f.bagHand} bags</span>
                    <span className="text-gray-200">|</span>
                    <span>Checked: {f.bagCheck} bags</span>
                    {f.bagOver > 0 && (
                      <>
                        <span className="text-gray-200">|</span>
                        <span className="text-yellow-600">Oversize: {f.bagOver} items</span>
                      </>
                    )}
                  </div>
                </div>

                {f.notes && (
                  <div className="bg-yellow-50/50 border border-[#D4AF37]/10 p-3 rounded-xl text-[11px] text-gray-500 mt-4">
                    <strong>Expedition Flight Notes:</strong> {f.notes}
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
