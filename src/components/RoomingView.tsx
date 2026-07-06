import React, { useState } from 'react';
import { AppState, Room, Guest } from '../types';
import { DB_DEFAULT, ROOM_TYPE_OPTIONS, BED_CONFIG_OPTIONS, MEAL_PLAN_OPTIONS, ROOM_REQUEST_OPTIONS } from '../dbDefaults';
import { Hotel, Plus, Trash2, Edit3, Check, Users, ShieldAlert, Calendar, Info } from 'lucide-react';

interface RoomingViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onAddRoom: (r: Room) => void;
  onRemoveRoom: (id: number) => void;
  onUpdateRoom: (id: number, updates: Partial<Room>) => void;
}

export const RoomingView: React.FC<RoomingViewProps> = ({
  state,
  onUpdateState,
  onAddRoom,
  onRemoveRoom,
  onUpdateRoom
}) => {
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [rForm, setRForm] = useState<Partial<Room>>({});
  const [showQuickBook, setShowQuickBook] = useState(false);

  // Quick Book sub-form
  const [qbHotel, setQbHotel] = useState("The Silo Hotel (Cape Town)");
  const [qbRoomType, setQbRoomType] = useState("Deluxe");
  const [qbBed, setQbBed] = useState("King");
  const [qbMeal, setQbMeal] = useState("B&B");
  const [qbGuestsCount, setQbGuestsCount] = useState(2);
  const [qbRate, setQbRate] = useState(5500);

  const handleOpenAddForm = () => {
    setRForm({
      hotel: 'The Silo Hotel (Cape Town)',
      conf: '',
      pay: 'Unpaid',
      roomType: 'Standard',
      bed: 'King',
      meal: 'B&B',
      cin: state.client.startDate || '',
      cout: state.client.endDate || '',
      nights: 1,
      guestIds: [],
      rate: 3000,
      supp: 0,
      reqs: [],
      notes: ''
    });
    setEditingRoomId(-1);
  };

  const handleEditRoom = (r: Room) => {
    setRForm({ ...r });
    setEditingRoomId(r.id);
  };

  const calcNights = (cin: string, cout: string) => {
    if (!cin || !cout) return 1;
    const d1 = new Date(cin);
    const d2 = new Date(cout);
    if (d2 <= d1) return 1;
    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
  };

  const handleCinCoutChange = (field: 'cin' | 'cout', val: string) => {
    const cin = field === 'cin' ? val : rForm.cin || '';
    const cout = field === 'cout' ? val : rForm.cout || '';
    const nights = calcNights(cin, cout);
    setRForm({ ...rForm, [field]: val, nights });
  };

  const handleSaveRoom = () => {
    if (!rForm.hotel) {
      alert('Hotel Name is required.');
      return;
    }

    const savedRoom: Room = {
      id: rForm.id || Date.now(),
      hotel: rForm.hotel,
      conf: rForm.conf || '',
      pay: rForm.pay || 'Unpaid',
      roomType: rForm.roomType || 'Standard',
      bed: rForm.bed || 'King',
      meal: rForm.meal || 'B&B',
      cin: rForm.cin || '',
      cout: rForm.cout || '',
      nights: Number(rForm.nights) || 1,
      guestIds: rForm.guestIds || [],
      rate: Number(rForm.rate) || 0,
      supp: Number(rForm.supp) || 0,
      reqs: rForm.reqs || [],
      notes: rForm.notes || ''
    };

    if (editingRoomId === -1) {
      onAddRoom(savedRoom);
    } else {
      onUpdateRoom(savedRoom.id, savedRoom);
    }
    setEditingRoomId(null);
    setRForm({});
  };

  // QUICK BOOK INTEGRATION
  const handleQuickBookSave = () => {
    if (!state.client.startDate || !state.client.endDate) {
      alert("Please establish trip start/end dates in the Intake section first.");
      return;
    }
    const cin = state.client.startDate;
    const cout = state.client.endDate;
    const nights = calcNights(cin, cout);

    // Grab first N guests from roster
    const selectedGuestsIds = state.guests.slice(0, qbGuestsCount).map(g => g.id);

    const newR: Room = {
      id: Date.now(),
      hotel: qbHotel,
      conf: `QB-${Math.floor(10000 + Math.random() * 90000)}`,
      pay: 'Deposit Paid',
      roomType: qbRoomType,
      bed: qbBed,
      meal: qbMeal,
      cin,
      cout,
      nights,
      guestIds: selectedGuestsIds,
      rate: qbRate,
      supp: 0,
      reqs: ["Quiet Side"],
      notes: "Auto-generated via Quick Booking Desk."
    };

    onAddRoom(newR);
    setShowQuickBook(false);
  };

  const toggleGuestSelection = (gId: number) => {
    const list = rForm.guestIds ? [...rForm.guestIds] : [];
    let updated: number[];
    if (list.includes(gId)) {
      updated = list.filter(id => id !== gId);
    } else {
      updated = [...list, gId];
    }
    setRForm({ ...rForm, guestIds: updated });
  };

  const toggleReqSelection = (req: string) => {
    const list = rForm.reqs ? [...rForm.reqs] : [];
    let updated: string[];
    if (list.includes(req)) {
      updated = list.filter(x => x !== req);
    } else {
      updated = [...list, req];
    }
    setRForm({ ...rForm, reqs: updated });
  };

  // GENERATE NIGHT-BY-NIGHT COVERAGE MATRIX
  const getDatesRange = (start: string, end: string) => {
    const arr = [];
    if (!start || !end) return [];
    const curr = new Date(start);
    const stop = new Date(end);
    while (curr <= stop) {
      arr.push(new Date(curr).toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return arr;
  };

  const dateRange = getDatesRange(state.client.startDate, state.client.endDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-accent">Stays & Lodgings</span>
          <h1 className="text-xl font-bold text-gray-900 mt-1">Accommodations Board</h1>
        </div>
        <div className="flex gap-2">
          {editingRoomId === null && (
            <>
              <button onClick={() => setShowQuickBook(!showQuickBook)} className="btn2">
                <Hotel size={13} /> Quick Book Desk
              </button>
              <button onClick={handleOpenAddForm} className="btn1">
                <Plus size={14} /> Book Custom Room
              </button>
            </>
          )}
        </div>
      </div>

      {/* QUICK BOOK DESK OVERLAY PANEL */}
      {showQuickBook && (
        <div className="card border-[#0d9668] bg-[#f0fdf4] p-5 animate-in slide-up">
          <div className="stitle border-b border-[#a7f3d0] pb-2.5 mb-4 flex justify-between items-center text-[#065f46]">
            <span className="font-serif font-bold text-sm flex items-center gap-1.5">
              <i className="fa-solid fa-hotel"></i> Bulk Quick Book Desk
            </span>
            <span className="text-[10px] font-bold uppercase text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-full">Automated stay builder</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-4 text-xs">
            <div className="col-span-2">
              <label className="lbl !text-emerald-800">Target Hotel</label>
              <select value={qbHotel} onChange={e => setQbHotel(e.target.value)} className="field-input border-emerald-300">
                {DB_DEFAULT.hotels.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl !text-emerald-800">Room Standard</label>
              <select value={qbRoomType} onChange={e => setQbRoomType(e.target.value)} className="field-input border-emerald-300">
                {ROOM_TYPE_OPTIONS.slice(0, 5).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl !text-emerald-800">Bed Setup</label>
              <select value={qbBed} onChange={e => setQbBed(e.target.value)} className="field-input border-emerald-300">
                {BED_CONFIG_OPTIONS.slice(0, 4).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl !text-emerald-800">Meal Plan</label>
              <select value={qbMeal} onChange={e => setQbMeal(e.target.value)} className="field-input border-emerald-300">
                {MEAL_PLAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl !text-emerald-800">Roster Capacity</label>
              <input type="number" value={qbGuestsCount} onChange={e => setQbGuestsCount(Number(e.target.value))} className="field-input border-emerald-300 font-bold" min="1" max={state.guests.length || 1} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-3 border-t border-emerald-200 text-xs">
            <div className="text-[#047857] leading-relaxed">
              <p className="font-bold flex items-center gap-1"><Info size={13} /> Live Stay Allocation Cost:</p>
              <p>R {(qbRate * (state.client.startDate && state.client.endDate ? calcNights(state.client.startDate, state.client.endDate) : 1)).toLocaleString()} total retail stays for {qbGuestsCount} passengers.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowQuickBook(false)} className="btn2 py-1 px-3.5 border-emerald-300 text-emerald-800 hover:bg-emerald-100">Cancel</button>
              <button onClick={handleQuickBookSave} className="btn1 py-1 px-4 bg-[#0d9668] border-none text-white hover:bg-emerald-800">
                <Check size={12} /> Confirm Stay Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED BOOKING FORM PANEL */}
      {editingRoomId !== null && (
        <div className="card border-accent bg-[#fafafa]">
          <div className="stitle border-b border-gray-200 pb-3 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-serif font-bold text-gray-900">
              <Hotel size={16} className="text-accent" />
              {editingRoomId === -1 ? 'Configure Accommodation Stay' : 'Update Accommodation Stay'}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setEditingRoomId(null)} className="btn2 py-1 px-3 text-[11px]">Cancel</button>
              <button onClick={handleSaveRoom} className="btn1 py-1 px-3 text-[11px]"><Check size={12} /> Save</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-xs">
            <div>
              <label className="lbl">Hotel Venue</label>
              <input 
                type="text" 
                value={rForm.hotel || ''} 
                onChange={e => setRForm({ ...rForm, hotel: e.target.value })}
                className="field-input font-medium" 
                placeholder="Hotel name" 
                list="hotels-list"
              />
              <datalist id="hotels-list">
                {DB_DEFAULT.hotels.map(h => <option key={h.id} value={h.name} />)}
              </datalist>
            </div>

            <div>
              <label className="lbl">Confirmation Ref</label>
              <input type="text" value={rForm.conf || ''} onChange={e => setRForm({ ...rForm, conf: e.target.value })} className="field-input font-bold text-gray-900 uppercase" placeholder="e.g. CPT-92381" />
            </div>

            <div>
              <label className="lbl">Settlement Payment Status</label>
              <select value={rForm.pay || 'Unpaid'} onChange={e => setRForm({ ...rForm, pay: e.target.value as any })} className="field-input">
                <option value="Unpaid">Unpaid / Pending</option>
                <option value="Deposit Paid">Deposit Settled</option>
                <option value="Fully Paid">Fully Pre-paid (Settled)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="lbl">Room Standard</label>
                <select value={rForm.roomType || 'Standard'} onChange={e => setRForm({ ...rForm, roomType: e.target.value })} className="field-input">
                  {ROOM_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="lbl">Meal</label>
                <select value={rForm.meal || 'B&B'} onChange={e => setRForm({ ...rForm, meal: e.target.value })} className="field-input font-bold">
                  {MEAL_PLAN_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4 text-xs">
            <div>
              <label className="lbl">Bed Configuration</label>
              <select value={rForm.bed || 'King'} onChange={e => setRForm({ ...rForm, bed: e.target.value })} className="field-input">
                {BED_CONFIG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="lbl">Check-In Date</label>
              <input type="date" value={rForm.cin || ''} onChange={e => handleCinCoutChange('cin', e.target.value)} className="field-input" />
            </div>

            <div>
              <label className="lbl">Check-Out Date</label>
              <input type="date" value={rForm.cout || ''} onChange={e => handleCinCoutChange('cout', e.target.value)} className="field-input" />
            </div>

            <div className="grid grid-cols-2 gap-2 col-span-2">
              <div>
                <label className="lbl">Nights</label>
                <input type="number" value={rForm.nights || 1} className="field-input font-bold bg-gray-50 text-center" readOnly />
              </div>
              <div>
                <label className="lbl">Night Rate (R)</label>
                <input type="number" value={rForm.rate || 0} onChange={e => setRForm({ ...rForm, rate: Number(e.target.value) })} className="field-input font-bold" />
              </div>
            </div>
          </div>

          {/* ROOM REQUIREMENTS CHECKBOXES */}
          <div className="mb-4">
            <label className="lbl">Bespoke Room Requests</label>
            <div className="flex flex-wrap gap-1.5">
              {ROOM_REQUEST_OPTIONS.slice(0, 10).map(req => {
                const active = rForm.reqs?.includes(req) || false;
                return (
                  <span key={req} onClick={() => toggleReqSelection(req)} className={`tag ${active ? 'active' : ''}`}>{req}</span>
                );
              })}
            </div>
          </div>

          {/* ASSIGNED PASSENGERS */}
          <div className="mb-4">
            <label className="lbl flex items-center gap-1.5"><Users size={12} /> Assign Room Inhabitants (Supports Split Hotels)</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {state.guests.map(g => {
                const isSelected = rForm.guestIds?.includes(g.id);
                return (
                  <span key={g.id} onClick={() => toggleGuestSelection(g.id)} className={`tag cursor-pointer select-none ${isSelected ? 'active' : ''}`}>
                    {g.first} {g.last} ({g.age})
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="lbl">Bespoke Stay Notes</label>
            <textarea 
              value={rForm.notes || ''} 
              onChange={e => setRForm({ ...rForm, notes: e.target.value })}
              className="field-input font-medium"
              placeholder="e.g. Honeymoon complimentary champagne requested in room, interconnecting room with kids, wheel-chair accessible bathroom required..."
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-3">
            <button onClick={() => setEditingRoomId(null)} className="btn2">Cancel</button>
            <button onClick={handleSaveRoom} className="btn1"><Check size={14} /> Save Stay Booking</button>
          </div>
        </div>
      )}

      {/* NIGHT-BY-NIGHT COVERAGE MATRIX */}
      {dateRange.length > 0 && state.guests.length > 0 && (
        <div className="card">
          <div className="stitle mb-1"><i className="fa-solid fa-hotel"></i> Guest-by-Guest Night Stay Matrix</div>
          <p className="text-[10px] text-gray-400 font-medium mb-4 uppercase">Verifying visual coverage indicators for all travel nights</p>

          <div className="overflow-x-auto hide-scrollbar border border-gray-200 rounded">
            <table className="w-full text-[10px] text-left border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700">
                  <th className="p-3 border-r border-gray-200 min-w-[120px]">Roster Passenger</th>
                  {dateRange.slice(0, dateRange.length - 1).map((day, idx) => (
                    <th key={day} className="p-3 text-center border-r border-gray-200 min-w-[90px]">
                      Night #{idx + 1}<br />
                      <span className="text-[9px] text-gray-400 font-normal">{day.substring(5)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                {state.guests.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="p-3 border-r border-gray-200 font-bold text-gray-900">{g.first} {g.last}</td>
                    {dateRange.slice(0, dateRange.length - 1).map(day => {
                      // Check if this guest is allocated to ANY room on this night
                      const bookingOnNight = state.rooms.find(room => {
                        const cin = room.cin;
                        const cout = room.cout;
                        return room.guestIds.includes(g.id) && day >= cin && day < cout;
                      });

                      return (
                        <td key={day} className="p-2 border-r border-gray-200 text-center">
                          {bookingOnNight ? (
                            <div className="bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] rounded p-1.5 leading-tight font-bold text-[9px]">
                              {bookingOnNight.hotel.split(' ')[0]}
                              <span className="block text-[8px] text-emerald-600 font-normal mt-0.5">{bookingOnNight.roomType} ({bookingOnNight.meal})</span>
                            </div>
                          ) : (
                            <div className="bg-roseLight text-rose border border-roseLight rounded p-1.5 leading-tight font-bold text-[9px]">
                              UNCOVERED
                              <span className="block text-[8px] text-red-400 font-normal mt-0.5">No stay scheduled</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REGISTERED ROOMS LIST */}
      <div className="space-y-4">
        {state.rooms.length === 0 ? (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg text-gray-400 text-sm italic">
            No accommodations registered. Use Quick Book or Book Custom Room to schedule stay points.
          </div>
        ) : (
          state.rooms.map(r => {
            const assignedPax = state.guests.filter(g => r.guestIds.includes(g.id));
            const totalStayCost = r.rate * r.nights;

            return (
              <div key={r.id} className="card hover:shadow-md transition">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                      <Hotel size={14} />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{r.hotel}</span>
                      <h4 className="text-xs font-bold text-gray-900 mt-0.5">Stay Confirmation: <span className="text-accent">{r.conf || 'Pending'}</span> • Status: <span className="text-accent font-semibold">{r.pay}</span></h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleEditRoom(r)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-accent hover:bg-accentLight transition">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => onRemoveRoom(r.id)} className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-rose hover:bg-roseLight transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs text-gray-600 mb-4">
                  <div>
                    <span className="block font-medium text-gray-400">Room Standard</span>
                    <strong className="text-gray-900 font-bold">{r.roomType} ({r.bed})</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Meal Plan Plan</span>
                    <strong className="text-gray-900 font-bold">{r.meal}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Check-In / Out</span>
                    <strong className="text-gray-900 font-medium">{r.cin} • {r.cout}</strong>
                  </div>
                  <div>
                    <span className="block font-medium text-gray-400">Stay Duration</span>
                    <strong className="text-gray-900 font-medium">{r.nights} Night(s)</strong>
                  </div>
                  <div className="text-right sm:border-l sm:border-gray-100 sm:pl-3">
                    <span className="block font-semibold text-accent">Total Stays Cost</span>
                    <strong className="text-sm font-bold text-gray-900 font-serif">R {totalStayCost.toLocaleString()}</strong>
                  </div>
                </div>

                {r.reqs && r.reqs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {r.reqs.map(req => (
                      <span key={req} className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded border border-gray-200">{req}</span>
                    ))}
                  </div>
                )}

                {/* Assigned passengers */}
                <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-2.5 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Stay Occupants:</span>
                    {assignedPax.length === 0 ? (
                      <span className="text-red-500 italic font-bold">No passengers assigned!</span>
                    ) : (
                      assignedPax.map(ap => (
                        <span key={ap.id} className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-sm font-semibold">{ap.first} {ap.last}</span>
                      ))
                    )}
                  </div>
                </div>

                {r.notes && (
                  <div className="bg-gray-50 border border-gray-200 border-dashed p-2.5 rounded-sm text-[11px] text-gray-500 italic mt-3">
                    <strong>Bespoke Stay Notes:</strong> {r.notes}
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
