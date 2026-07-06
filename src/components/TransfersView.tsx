import React, { useState } from 'react';
import { AppState, Transfer, Waypoint, Guest } from '../types';
import { DB_DEFAULT } from '../dbDefaults';
import { Car, Plus, Trash2, Edit3, Check, Users, MapPin, AlertTriangle, MessageSquare } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Ground Logistics</span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Transfers & Fleet Tracker</h1>
        </div>
        {editingTransferId === null && (
          <button onClick={handleOpenAddForm} className="btn1">
            <Plus size={14} /> Schedule Transfer
          </button>
        )}
      </div>

      {/* TRANSFER CONFIGURATION FORM PANEL */}
      {editingTransferId !== null && (
        <div className="card border-accent bg-[#fafafa]">
          <div className="stitle border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-serif font-bold text-gray-900">
              <Car size={16} className="text-accent" />
              {editingTransferId === -1 ? 'Configure Transfer Routing' : 'Update Transfer Routing'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setEditingTransferId(null)} className="btn2 py-1 px-3 text-[11px]">Cancel</button>
              <button onClick={handleSaveTransfer} className="btn1 py-1 px-3 text-[11px]"><Check size={12} /> Save</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="lbl">Transfer Type</label>
              <select 
                value={tForm.type || 'Airport Arrival'}
                onChange={e => setTForm({ ...tForm, type: e.target.value as any })}
                className="field-input"
              >
                <option value="Airport Arrival">Airport Arrival Meet & Greet</option>
                <option value="Airport Departure">Airport Departure Shuttle</option>
                <option value="Inter-Hotel">Inter-Hotel Transfer Corridor</option>
                <option value="Activity Transfer">Activity Excursion Roundtrip</option>
                <option value="Full-Day Vehicle">Full-Day Private Driver Hire</option>
                <option value="Point-to-Point">Point-to-Point City Link</option>
              </select>
            </div>

            <div>
              <label className="lbl">Transfer Date</label>
              <input type="date" value={tForm.date || ''} onChange={e => setTForm({ ...tForm, date: e.target.value })} className="field-input" />
            </div>

            <div>
              <label className="lbl">Pick-up Time</label>
              <input type="time" value={tForm.time || ''} onChange={e => setTForm({ ...tForm, time: e.target.value })} className="field-input" />
            </div>

            <div>
              <label className="lbl">Service Status</label>
              <select value={tForm.status || 'Pending'} onChange={e => setTForm({ ...tForm, status: e.target.value as any })} className="field-input">
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="lbl">Pick-up Location</label>
              <input type="text" value={tForm.from || ''} onChange={e => setTForm({ ...tForm, from: e.target.value })} className="field-input font-medium text-gray-900" placeholder="e.g. Cape Town Airport (CPT)" />
            </div>

            <div>
              <label className="lbl">Drop-off Location</label>
              <input type="text" value={tForm.to || ''} onChange={e => setTForm({ ...tForm, to: e.target.value })} className="field-input font-medium text-gray-900" placeholder="e.g. The Silo Hotel" />
            </div>

            <div>
              <label className="lbl">Meeting Point (Arrivals)</label>
              <input type="text" value={tForm.meet || ''} onChange={e => setTForm({ ...tForm, meet: e.target.value })} className="field-input" placeholder="e.g. Door 4, Arrivals Hall" />
            </div>

            <div>
              <label className="lbl">Paging Welcome Sign</label>
              <input type="text" value={tForm.sign || ''} onChange={e => setTForm({ ...tForm, sign: e.target.value })} className="field-input uppercase font-bold text-accent" placeholder="e.g. HARRISON GROUP" />
            </div>
          </div>

          {/* WAYPOINTS STOP BUILDER */}
          <div className="border border-gray-200 bg-white p-4 rounded-md mb-4">
            <p className="text-[11px] font-bold text-[#065f46] mb-3 flex items-center gap-1">
              <MapPin size={12} /> Multi-Stop Waypoints (Intermediate Pitstops)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              <input type="text" value={waypointLoc} onChange={e => setWaypointLoc(e.target.value)} className="field-input py-1 px-2.5 text-xs col-span-2" placeholder="Intermediate Waypoint (e.g. Curio Market, Winery stop)" />
              <input type="text" value={waypointWait} onChange={e => setWaypointWait(e.target.value)} className="field-input py-1 px-2.5 text-xs" placeholder="Wait/Layover (e.g. 45 min)" />
            </div>
            <button onClick={handleAddWaypoint} className="btn2 text-[10px] py-1 px-3">
              <Plus size={10} /> Add Intermediate Stop
            </button>

            {waypointsList.length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                {waypointsList.map((wp, idx) => (
                  <div key={wp.id} className="flex justify-between items-center text-[11px] bg-gray-50 border border-gray-200 p-2 rounded">
                    <span>
                      <strong className="text-gray-800">Stop #{idx + 1}: {wp.location}</strong> {wp.waitTime && `(Wait/Break: ${wp.waitTime})`}
                    </span>
                    <button onClick={() => handleRemoveWaypoint(wp.id)} className="text-rose hover:underline font-bold">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="lbl">Vehicle Type</label>
              <select value={tForm.vehicle || ''} onChange={e => setTForm({ ...tForm, vehicle: e.target.value })} className="field-input">
                {DB_DEFAULT.vehicles.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>

            <div>
              <label className="lbl">Assigned Driver</label>
              <select value={tForm.driver || ''} onChange={handleDriverChange} className="field-input">
                <option value="">Select driver...</option>
                {DB_DEFAULT.drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="lbl">Driver Contact Phone</label>
              <input type="text" value={tForm.driverPhone || ''} onChange={e => setTForm({ ...tForm, driverPhone: e.target.value })} className="field-input bg-gray-50 font-semibold" readOnly />
            </div>

            <div>
              <label className="lbl">Linked Flight Code</label>
              <input type="text" value={tForm.flight || ''} onChange={e => setTForm({ ...tForm, flight: e.target.value })} className="field-input uppercase font-bold" placeholder="e.g. EK773" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="lbl">Distance</label>
                <input type="text" value={tForm.dist || ''} onChange={e => setTForm({ ...tForm, dist: e.target.value })} className="field-input" placeholder="22 km" />
              </div>
              <div>
                <label className="lbl">Est. Dur.</label>
                <input type="text" value={tForm.dur || ''} onChange={e => setTForm({ ...tForm, dur: e.target.value })} className="field-input" placeholder="35 min" />
              </div>
            </div>
          </div>

          {/* LUGGAGE PROTOCOLS */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="lbl">Hand Bags (Cargo)</label>
              <input type="number" value={tForm.bagHand || 0} onChange={e => setTForm({ ...tForm, bagHand: Number(e.target.value) })} className="field-input" />
            </div>
            <div>
              <label className="lbl">Checked Baggage</label>
              <input type="number" value={tForm.bagCheck || 0} onChange={e => setTForm({ ...tForm, bagCheck: Number(e.target.value) })} className="field-input" />
            </div>
            <div>
              <label className="lbl">Oversized Items</label>
              <input type="number" value={tForm.bagOver || 0} onChange={e => setTForm({ ...tForm, bagOver: Number(e.target.value) })} className="field-input" />
            </div>
          </div>

          {/* CHILD SEATS & ONBOARD PROTOCOLS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="lbl">Child Safety Restraints</label>
              <div className="flex flex-wrap gap-1.5">
                {["None Required", "Rear Facing Infant Seat", "Forward Facing Child Seat", "Booster Seat (4-8yr)"].map(seat => {
                  const active = tForm.seats?.includes(seat) || false;
                  return (
                    <span key={seat} onClick={() => toggleTFormTag('seats', seat)} className={`tag ${active ? 'active' : ''}`}>{seat}</span>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="lbl">Onboard Special Requests</label>
              <div className="flex flex-wrap gap-1.5">
                {["Bottled Water & Snacks", "Air Conditioning Active", "Cold Refreshment Towels", "Local Tourism Leaflets"].map(req => {
                  const active = tForm.special?.includes(req) || false;
                  return (
                    <span key={req} onClick={() => toggleTFormTag('special', req)} className={`tag ${active ? 'active' : ''}`}>{req}</span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PASSENGER SELECTION */}
          <div className="mb-4">
            <label className="lbl flex items-center gap-1.5"><Users size={12} /> Assign Passengers (Supports Split Arrivals/Departures)</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button 
                onClick={() => setTForm({ ...tForm, paxIds: state.guests.map(g => g.id), paxCount: state.guests.length })} 
                className="btn2 py-1 px-3 text-[10px] mr-2"
              >
                Select All
              </button>
              {state.guests.map(g => {
                const isSelected = tForm.paxIds?.includes(g.id);
                return (
                  <span key={g.id} onClick={() => togglePassengerSelection(g.id)} className={`tag cursor-pointer select-none ${isSelected ? 'active' : ''}`}>
                    {g.first} {g.last} ({g.age})
                  </span>
                );
              })}
            </div>
          </div>

          {/* FINANCIAL COSTS */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="lbl">Net Hire Cost (R)</label>
              <input type="number" value={tForm.cost || 0} onChange={e => setTForm({ ...tForm, cost: Number(e.target.value) })} className="field-input font-bold" />
            </div>
            <div>
              <label className="lbl">Toll Road Fees (R)</label>
              <input type="number" value={tForm.tolls || 0} onChange={e => setTForm({ ...tForm, tolls: Number(e.target.value) })} className="field-input font-bold" />
            </div>
            <div>
              <label className="lbl">Airport Parking Fees (R)</label>
              <input type="number" value={tForm.parking || 0} onChange={e => setTForm({ ...tForm, parking: Number(e.target.value) })} className="field-input font-bold" />
            </div>
          </div>

          <div className="mb-4">
            <label className="lbl">Logistics Driver Instructions</label>
            <textarea 
              value={tForm.notes || ''} 
              onChange={e => setTForm({ ...tForm, notes: e.target.value })}
              className="field-input font-medium"
              placeholder="e.g. Pick up group in arrivals hall with paging board, assist grandma with walking difficulties, fit booster seats in row 3..."
              style={{ resize: 'vertical', minHeight: '85px' }}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
            <button onClick={() => setEditingTransferId(null)} className="btn2">Cancel</button>
            <button onClick={handleSaveTransfer} className="btn1"><Check size={14} /> Schedule Job</button>
          </div>
        </div>
      )}

      {/* ROSTER COVERAGE WARNING CHECKS */}
      {state.transfers.length > 0 && (
        <div className="bg-[#fef3c7] border border-[#fde68a] rounded-md p-4 text-[11px] text-[#92400e] space-y-1">
          <p className="font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Operational Ground Integrity Check</p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-600">
            {state.transfers.some(t => t.paxCount === 0) && (
              <li>Warning: One or more transfers has ZERO passengers assigned! Please verify split travel routing.</li>
            )}
            {state.guests.some(g => !state.transfers.some(t => t.paxIds.includes(g.id))) ? (
              <li>
                Notice: Some roster members have no transfer scheduled: {state.guests.filter(g => !state.transfers.some(t => t.paxIds.includes(g.id))).map(g => `${g.first} ${g.last}`).join(', ')}
              </li>
            ) : (
              <li>All registered guests are covered by at least one ground logistics transfer job!</li>
            )}
          </ul>
        </div>
      )}

      {/* TRANSFERS LIST */}
      <div className="space-y-4">
        {state.transfers.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm italic">
            No transfers scheduled. Click "Schedule Transfer" to allocate driver routes.
          </div>
        ) : (
          state.transfers.map(t => {
            const assignedPax = state.guests.filter(g => t.paxIds.includes(g.id));
            const subtotalCost = t.cost + t.tolls + t.parking;

            return (
              <div key={t.id} className="card hover:shadow-md transition">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                      <Car size={14} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.type}</span>
                      <h4 className="text-xs font-bold text-gray-900 mt-0.5">Job Ref: VT-TR-{t.id.toString().slice(-4)} • Status: <span className="text-accent font-semibold">{t.status}</span></h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEditTransfer(t)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accentLight transition">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => onRemoveTransfer(t.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-rose hover:bg-roseLight transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs text-gray-600 mb-4">
                  <div>
                    <span className="block font-medium text-gray-400">Route Pick-up</span>
                    <strong className="text-gray-900 font-bold">{t.from}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Route Drop-off</span>
                    <strong className="text-gray-900 font-bold">{t.to}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Schedule Time</span>
                    <strong className="text-gray-900 font-medium">{t.date} • {t.time || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Driver & Fleet</span>
                    <strong className="text-gray-900 font-medium">{t.driver || 'Unassigned'} • <span className="text-gray-400">{t.vehicle}</span></strong>
                  </div>
                  <div className="text-right sm:border-l sm:border-gray-100 sm:pl-3">
                    <span className="block font-semibold text-accent">Retail Cost</span>
                    <strong className="text-sm font-bold text-gray-900 font-serif">R {subtotalCost.toLocaleString()}</strong>
                  </div>
                </div>

                {/* WAYPOINTS DISPLAY */}
                {t.waypoints && t.waypoints.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5 mb-3 text-[11px]">
                    <span className="font-bold text-gray-700 block mb-1">Route Stops & Pitstops:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm text-gray-600">{t.from}</span>
                      {t.waypoints.map((wp, wIdx) => (
                        <React.Fragment key={wp.id}>
                          <span className="text-gray-400">→</span>
                          <span className="bg-[#eff6ff] border border-blue-200 px-2.5 py-0.5 rounded text-[10px] text-blue-800 font-medium">
                            {wp.location} {wp.waitTime && `(${wp.waitTime})`}
                          </span>
                        </React.Fragment>
                      ))}
                      <span className="text-gray-400">→</span>
                      <span className="bg-white border border-gray-200 px-2 py-0.5 rounded shadow-sm text-gray-600">{t.to}</span>
                    </div>
                  </div>
                )}

                {/* Assigned passengers */}
                <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2.5 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Assigned Pax:</span>
                    {assignedPax.length === 0 ? (
                      <span className="text-red-500 italic font-bold">No passengers assigned!</span>
                    ) : (
                      assignedPax.map(ap => (
                        <span key={ap.id} className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-sm font-semibold">{ap.first} {ap.last}</span>
                      ))
                    )}
                  </div>

                  {t.sign && (
                    <div className="bg-[#ecfdf5] text-accent border border-[#a7f3d0] font-bold text-[10px] px-2.5 py-1 rounded">
                      WELCOME BOARD: "{t.sign}"
                    </div>
                  )}
                </div>

                {t.notes && (
                  <div className="bg-gray-50 border border-gray-200 border-dashed p-2.5 rounded-sm text-[11px] text-gray-500 italic mt-3">
                    <strong>Logistics Dispatcher Notes:</strong> {t.notes}
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
