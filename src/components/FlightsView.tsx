import React, { useState } from 'react';
import { AppState, Flight, Stop, Guest } from '../types';
import { Plane, Plus, Trash2, Edit3, Check, Users, MapPin, ArrowRight } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Aviation Links</span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Flights Corridor Registry</h1>
        </div>
        {editingFlightId === null && (
          <button onClick={handleOpenAddForm} className="btn1">
            <Plus size={14} /> Link New Flight
          </button>
        )}
      </div>

      {/* FLIGHT EDIT/ADD FORM PANEL */}
      {editingFlightId !== null && (
        <div className="card border-accent bg-[#fafafa]">
          <div className="stitle border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-serif font-bold text-gray-900">
              <Plane size={16} className="text-accent" />
              {editingFlightId === -1 ? 'Configure Flight Sector' : 'Update Flight Sector'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setEditingFlightId(null)} className="btn2 py-1 px-3 text-[11px]">Cancel</button>
              <button onClick={handleSaveFlight} className="btn1 py-1 px-3 text-[11px]"><Check size={12} /> Save</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="lbl">Sector Direction</label>
              <select 
                value={fForm.direction || 'Inbound'}
                onChange={e => setFForm({ ...fForm, direction: e.target.value as any })}
                className="field-input"
              >
                <option value="Inbound">Inbound (Intercontinental Arrival)</option>
                <option value="Outbound">Outbound (Intercontinental Departure)</option>
                <option value="Internal">Internal (Regional/Domestic Connection)</option>
              </select>
            </div>

            <div>
              <label className="lbl">Airline Carrier</label>
              <input 
                type="text" 
                value={fForm.airline || ''} 
                onChange={e => setFForm({ ...fForm, airline: e.target.value })}
                className="field-input font-medium" 
                placeholder="e.g. SAA"
                list="airlines-list"
              />
              <datalist id="airlines-list">
                {AIRLINES.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>

            <div>
              <label className="lbl">Flight Number</label>
              <input 
                type="text" 
                value={fForm.flightNo || ''} 
                onChange={e => setFForm({ ...fForm, flightNo: e.target.value })}
                className="field-input uppercase font-bold text-gray-900" 
                placeholder="e.g. SA042" 
              />
            </div>

            <div>
              <label className="lbl">PNR Reference Code</label>
              <input 
                type="text" 
                value={fForm.pnr || ''} 
                onChange={e => setFForm({ ...fForm, pnr: e.target.value })}
                className="field-input uppercase font-bold text-[#065f46]" 
                placeholder="e.g. ZQW67B" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="lbl">Origin Airport</label>
              <input 
                type="text" 
                value={fForm.from || ''} 
                onChange={e => setFForm({ ...fForm, from: e.target.value })}
                className="field-input font-bold text-gray-900 uppercase" 
                placeholder="e.g. JFK" 
              />
            </div>

            <div>
              <label className="lbl">Destination Airport</label>
              <input 
                type="text" 
                value={fForm.to || ''} 
                onChange={e => setFForm({ ...fForm, to: e.target.value })}
                className="field-input font-bold text-gray-900 uppercase" 
                placeholder="e.g. CPT" 
              />
            </div>

            <div>
              <label className="lbl">Flight Date</label>
              <input 
                type="date" 
                value={fForm.date || ''} 
                onChange={e => setFForm({ ...fForm, date: e.target.value })}
                className="field-input" 
              />
            </div>

            <div>
              <label className="lbl">Departure Time (LT)</label>
              <input 
                type="time" 
                value={fForm.depTime || ''} 
                onChange={e => setFForm({ ...fForm, depTime: e.target.value })}
                className="field-input" 
              />
            </div>

            <div>
              <label className="lbl">Arrival Time (LT)</label>
              <input 
                type="time" 
                value={fForm.arrTime || ''} 
                onChange={e => setFForm({ ...fForm, arrTime: e.target.value })}
                className="field-input" 
              />
            </div>
          </div>

          {/* TRANSIT & LAYOVER ROUTING SUB-BUILDER */}
          <div className="border border-gray-200 bg-white p-4 rounded-md mb-4">
            <p className="text-[11px] font-bold text-[#065f46] mb-3 flex items-center gap-1">
              <MapPin size={12} /> Flight Routing Stops & Layovers (Multi-Stop Visualizer)
            </p>

            {stopsList.length > 0 && (
              <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 border border-gray-200 rounded text-xs flex-wrap">
                <span className="font-bold text-gray-700">{fForm.from || 'Origin'}</span>
                {stopsList.map((stop, idx) => (
                  <React.Fragment key={stop.id}>
                    <ArrowRight size={12} className="text-gray-400" />
                    <div className="bg-[#ecfdf5] border border-accentBorder px-2.5 py-1 rounded flex items-center gap-1">
                      <span className="font-bold text-accent">{stop.airport}</span>
                      <span className="text-[9px] text-gray-400 font-medium">({stop.duration || 'Stop'})</span>
                    </div>
                  </React.Fragment>
                ))}
                <ArrowRight size={12} className="text-gray-400" />
                <span className="font-bold text-gray-700">{fForm.to || 'Destination'}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
              <input 
                type="text" 
                value={stopAirport} 
                onChange={e => setStopAirport(e.target.value)}
                className="field-input py-1 px-2.5 text-xs uppercase" 
                placeholder="Stop Airport (e.g. DXB)" 
              />
              <input 
                type="time" 
                value={stopArr} 
                onChange={e => setStopArr(e.target.value)}
                className="field-input py-1 px-2.5 text-xs" 
                placeholder="Arr Time" 
              />
              <input 
                type="time" 
                value={stopDep} 
                onChange={e => setStopDep(e.target.value)}
                className="field-input py-1 px-2.5 text-xs" 
                placeholder="Dep Time" 
              />
              <input 
                type="text" 
                value={stopDur} 
                onChange={e => setStopDur(e.target.value)}
                className="field-input py-1 px-2.5 text-xs" 
                placeholder="Layover Dur (e.g. 2h 15m)" 
              />
              <input 
                type="text" 
                value={stopChangeNo} 
                onChange={e => setStopChangeNo(e.target.value)}
                className="field-input py-1 px-2.5 text-xs uppercase" 
                placeholder="New Flight # (if aircraft changes)" 
              />
            </div>
            <button onClick={handleAddStop} className="btn2 text-[10px] py-1 px-3">
              <Plus size={10} /> Append Stop Waypoint
            </button>

            {stopsList.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                {stopsList.map((stop, idx) => (
                  <div key={stop.id} className="flex justify-between items-center text-[11px] bg-gray-50 border border-gray-200 p-2 rounded">
                    <span>
                      <strong className="text-gray-800">Stop #{idx + 1}: {stop.airport}</strong> — Arr: {stop.arrTime || '—'} | Dep: {stop.depTime || '—'} | Duration: {stop.duration || '—'} 
                      {stop.changeFlightNo && ` (Aircraft changes to ${stop.changeFlightNo})`}
                    </span>
                    <button onClick={() => handleRemoveStop(stop.id)} className="text-rose hover:underline font-bold">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="lbl">Cabin Booking Class</label>
              <select 
                value={fForm.cabin || 'Economy'}
                onChange={e => setFForm({ ...fForm, cabin: e.target.value as any })}
                className="field-input"
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business">Business</option>
                <option value="First">First Class</option>
              </select>
            </div>

            <div>
              <label className="lbl">Ticket Booking Status</label>
              <select 
                value={fForm.status || 'Quoted'}
                onChange={e => setFForm({ ...fForm, status: e.target.value as any })}
                className="field-input"
              >
                <option value="Quoted">Quoted</option>
                <option value="Booked">Booked (Unconfirmed)</option>
                <option value="Ticketed">Ticketed (Confirmed)</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="lbl">Net Base Cost per Pax (R)</label>
              <input 
                type="number" 
                value={fForm.cost || 0} 
                onChange={e => setFForm({ ...fForm, cost: Number(e.target.value) })}
                className="field-input font-bold" 
                placeholder="R 0" 
              />
            </div>

            <div>
              <label className="lbl">Buffer Markup per Pax (R)</label>
              <input 
                type="number" 
                value={fForm.markup || 0} 
                onChange={e => setFForm({ ...fForm, markup: Number(e.target.value) })}
                className="field-input font-bold" 
                placeholder="R 0" 
              />
            </div>

            <div>
              <label className="lbl">Passenger Quantity</label>
              <input 
                type="number" 
                value={fForm.qty || 1} 
                onChange={e => setFForm({ ...fForm, qty: Number(e.target.value) })}
                className="field-input" 
                placeholder="1" 
              />
            </div>
          </div>

          {/* LUGGAGE PROTOCOLS */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="lbl">Hand Luggage (per Pax)</label>
              <input type="number" value={fForm.bagHand || 1} onChange={e => setFForm({ ...fForm, bagHand: Number(e.target.value) })} className="field-input" />
            </div>
            <div>
              <label className="lbl">Checked Bags (per Pax)</label>
              <input type="number" value={fForm.bagCheck || 1} onChange={e => setFForm({ ...fForm, bagCheck: Number(e.target.value) })} className="field-input" />
            </div>
            <div>
              <label className="lbl">Oversized Items (Bikes, Golf Bags)</label>
              <input type="number" value={fForm.bagOver || 0} onChange={e => setFForm({ ...fForm, bagOver: Number(e.target.value) })} className="field-input" />
            </div>
          </div>

          {/* PASSENGER ASSIGNMENT CHIPS */}
          <div className="mb-4">
            <label className="lbl flex items-center gap-1"><Users size={12} /> Assign Passengers (Select Roster Members)</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {state.guests.map(g => {
                const isSelected = fForm.paxIds?.includes(g.id);
                return (
                  <span 
                    key={g.id} 
                    onClick={() => togglePassengerSelection(g.id)}
                    className={`tag cursor-pointer select-none ${isSelected ? 'active' : ''}`}
                  >
                    {g.first} {g.last} ({g.age})
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="lbl">Bespoke Flight Routing Notes & Layovers</label>
            <textarea 
              value={fForm.notes || ''} 
              onChange={e => setFForm({ ...fForm, notes: e.target.value })}
              className="field-input font-medium"
              placeholder="e.g. Flight booked via Skywards miles, business class lounge passes issued, infant bassinet requested in bulkhead row..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
            <button onClick={() => setEditingFlightId(null)} className="btn2">Cancel</button>
            <button onClick={handleSaveFlight} className="btn1"><Check size={14} /> Save Flight Links</button>
          </div>
        </div>
      )}

      {/* REGISTERED FLIGHTS LIST */}
      <div className="space-y-4">
        {state.flights.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm italic">
            No flight sectors configured. Click "Link New Flight" to establish transit corridors.
          </div>
        ) : (
          state.flights.map(f => {
            const retailPerPax = f.cost + f.markup;
            const retailTotal = retailPerPax * f.qty;
            const assignedPax = state.guests.filter(g => f.paxIds.includes(g.id));

            return (
              <div key={f.id} className="card hover:shadow-md transition">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-[#eff6ff] text-[#2563eb] flex items-center justify-center border border-[#bfdbfe]">
                      <Plane size={14} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{f.direction} Route</span>
                      <h4 className="text-xs font-bold text-gray-900 mt-0.5">{f.airline} {f.flightNo} • PNR: <span className="text-accent">{f.pnr || '—'}</span></h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEditFlight(f)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accentLight transition">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => onRemoveFlight(f.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-rose hover:bg-roseLight transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs text-gray-600 mb-4">
                  <div>
                    <span className="block font-medium text-gray-400">Sector</span>
                    <strong className="text-gray-900 font-bold">{f.from} <ArrowRight size={10} className="inline mx-1 text-gray-400" /> {f.to}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Departure</span>
                    <strong className="text-gray-900 font-medium">{f.date} • {f.depTime || '—'}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Arrival (LT)</span>
                    <strong className="text-gray-900 font-medium">{f.arrTime || '—'}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Cabin / Status</span>
                    <strong className="text-gray-900 font-medium">{f.cabin} • <span className="text-accent">{f.status}</span></strong>
                  </div>
                  <div className="text-right sm:border-l sm:border-gray-100 sm:pl-3">
                    <span className="block font-semibold text-accent">Total Retail</span>
                    <strong className="text-sm font-bold text-gray-900 font-serif">R {retailTotal.toLocaleString()}</strong>
                  </div>
                </div>

                {/* VISUAL ROUTING TIMELINE FOR STOPS/LAYOVERS */}
                {f.stops && f.stops.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3.5 text-[11px] text-gray-600">
                    <span className="font-bold text-[#065f46] block mb-2"><i className="fa-solid fa-plane-arrival mr-1"></i> Flight Routing Stop-overs</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">{f.from}</span>
                      {f.stops.map((stop, sIdx) => (
                        <React.Fragment key={stop.id}>
                          <ArrowRight size={11} className="text-gray-400" />
                          <div className="bg-[#eff6ff] border border-blue-200 px-2 py-0.5 rounded text-[10px] text-blue-700 flex items-center gap-1 font-medium">
                            <span className="font-bold">{stop.airport}</span>
                            <span>({stop.duration || 'Transit'})</span>
                            {stop.changeFlightNo && <span className="bg-white border border-blue-100 text-[8px] px-1 rounded">Change to {stop.changeFlightNo}</span>}
                          </div>
                        </React.Fragment>
                      ))}
                      <ArrowRight size={11} className="text-gray-400" />
                      <span className="font-bold text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm">{f.to}</span>
                    </div>
                  </div>
                )}

                {/* Assigned passenger chips */}
                <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Assigned Pax:</span>
                    {assignedPax.length === 0 ? (
                      <span className="text-red-500 italic">No passengers assigned!</span>
                    ) : (
                      assignedPax.map(ap => (
                        <span key={ap.id} className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-sm font-semibold">{ap.first} {ap.last}</span>
                      ))
                    )}
                  </div>

                  <div className="text-[10px] text-gray-400 font-semibold uppercase flex items-center gap-2">
                    <span>Hand: {f.bagHand} | Checked: {f.bagCheck} | Over: {f.bagOver}</span>
                  </div>
                </div>

                {f.notes && (
                  <div className="bg-gray-50 border border-gray-200 border-dashed p-2.5 rounded-sm text-[11px] text-gray-500 italic mt-3">
                    <strong>Coordination Notes:</strong> {f.notes}
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
