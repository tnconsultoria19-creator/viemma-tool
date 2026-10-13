import React, { useState } from 'react';
import { AppState, Flight, Transfer } from '../types';
import { 
  Printer, 
  Plane, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  User, 
  ShieldCheck, 
  ChevronDown,
  ArrowLeft
} from 'lucide-react';

interface DriverPickupBoardProps {
  state: AppState;
  onBack?: () => void;
}

export const DriverPickupBoard: React.FC<DriverPickupBoardProps> = ({ state, onBack }) => {
  // Find inbound flights and arrival transfers to choose from
  const inboundFlights = state.flights.filter(f => f.direction === 'Inbound' || !f.direction);
  const arrivalTransfers = state.transfers.filter(t => t.type === 'Airport Arrival');

  // Selected item index
  const [selectedFlightId, setSelectedFlightId] = useState<number | 'custom'>(
    inboundFlights.length > 0 ? inboundFlights[0].id : 'custom'
  );

  const selectedFlight = inboundFlights.find(f => f.id === selectedFlightId);
  const matchedTransfer = selectedFlight
    ? arrivalTransfers.find(t => t.flight === selectedFlight.flightNo || t.linkedFlightId === selectedFlight.id)
    : arrivalTransfers[0];

  const leadGuest = state.guests.find(g => g.isLead) || state.guests[0];
  const initialDriver = state.drivers?.find(d => d.id === matchedTransfer?.driverId || d.name === matchedTransfer?.driver);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(initialDriver?.id || (matchedTransfer?.driver ? 'legacy:' + matchedTransfer.driver : ''));
  const selectedDriver = state.drivers?.find(d => d.id === selectedDriverId);
  const passengerCount = selectedFlight?.paxIds?.length || matchedTransfer?.paxIds?.length || state.guests.length || (matchedTransfer ? matchedTransfer.paxCount : 1);

  // Editable display name on placard
  const defaultPlacardName = matchedTransfer?.sign || 
    (state.client.name ? state.client.name.toUpperCase() : leadGuest ? `${leadGuest.first.toUpperCase()} ${leadGuest.last.toUpperCase()} PARTY` : 'PASSENGER NAME TO BE CONFIRMED');

  const [placardName, setPlacardName] = useState(defaultPlacardName);
  const [pickupAirport, setPickupAirport] = useState(
    matchedTransfer?.from || (selectedFlight ? `${selectedFlight.to} International Airport` : 'Cape Town International Airport')
  );
  const [pickupPoint, setPickupPoint] = useState(
    matchedTransfer?.meet || 'Meeting point to be confirmed'
  );
  const [pickupNotes, setPickupNotes] = useState(
    matchedTransfer?.notes || ''
  );

  const handlePrint = () => {
    window.print();
  };

  const airlineName = selectedFlight?.airline || 'Airline to be confirmed';
  const flightNumber = selectedFlight?.flightNo || matchedTransfer?.flight || 'FLIGHT DETAILS TO BE CONFIRMED';
  const arrivalDate = selectedFlight?.date || matchedTransfer?.date || state.client.startDate || 'Arrival Date';
  const arrivalTime = selectedFlight?.arrTime || matchedTransfer?.time || 'Scheduled Time';
  const driverName = selectedDriver?.name || (selectedDriverId.startsWith('legacy:') ? selectedDriverId.slice(7) : '') || matchedTransfer?.driver || 'Driver to be assigned';
  const vehicleName = matchedTransfer?.vehicle || state.vehicles?.[0]?.name || 'Vehicle to be assigned';

  return (
    <div className="driver-pickup-board space-y-6">
      {/* ON-SCREEN CONTROLS (Hidden during printing) */}
      <div className="driver-pickup-board-controls print:hidden bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                title="Back to Print Hub"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#D4AF37]">
                A4 Printable Chauffeur Placard
              </span>
              <h2 className="text-lg font-bold text-[#1A3326]">Airport Driver Pickup Board</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#234433] text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer size={15} className="text-[#D4AF37]" />
              <span>Print A4 Pickup Board</span>
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-gray-600 block mb-1">Select Inbound Arrival Flight</label>
            <select
              value={selectedFlightId}
              onChange={(e) => setSelectedFlightId(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium"
            >
              {inboundFlights.map(f => (
                <option key={f.id} value={f.id}>
                  {f.airline} {f.flightNo} ({f.from} → {f.to}) - {f.date} {f.arrTime}
                </option>
              ))}
              <option value="custom">-- Custom / Manual Arrival Placard --</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-gray-600 block mb-1">Assigned Driver</label>
            <select value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium">
              <option value="">Driver to be assigned</option>
              {matchedTransfer?.driver && !state.drivers?.some(d => d.name === matchedTransfer.driver) && <option value={'legacy:' + matchedTransfer.driver}>{matchedTransfer.driver} — saved assignment</option>}
              {(state.drivers || []).map(driver => {
                const expiry = driver.prdpExpiryDate ? new Date(driver.prdpExpiryDate + 'T00:00:00') : null;
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const daysLeft = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / 86400000) : null;
                const status = daysLeft === null ? ' · expiry not recorded' : daysLeft < 0 ? ' · expired' : daysLeft <= 45 ? ' · expiring soon' : '';
                return <option key={driver.id} value={driver.id}>{driver.name}{status}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="font-bold text-gray-600 block mb-1">Placard Lead Name (Printed Large)</label>
            <input
              type="text"
              value={placardName}
              onChange={(e) => setPlacardName(e.target.value.toUpperCase())}
              className="w-full p-2.5 rounded-xl border border-gray-200 font-bold tracking-wider"
              placeholder="e.g. THE HARRISON FAMILY"
            />
          </div>

          <div>
            <label className="font-bold text-gray-600 block mb-1">Terminal Pickup Point</label>
            <input
              type="text"
              value={pickupPoint}
              onChange={(e) => setPickupPoint(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 font-medium"
              placeholder="e.g. International Arrivals — Door 4"
            />
          </div>
        </div>
      </div>

      {/* THE ACTUAL A4 PRINTABLE PLACARD CONTAINER */}
      <div className="driver-pickup-sheet-wrap bg-white p-2 md:p-8 rounded-3xl shadow-lg border border-gray-200 max-w-[210mm] mx-auto print:p-0 print:border-none print:shadow-none print:m-0 print:max-w-none">
        
        {/* A4 Sheet Dimensions Frame */}
        <div className="driver-pickup-sheet w-full min-h-[297mm] p-8 md:p-12 border-4 border-[#1A3326] rounded-2xl flex flex-col justify-between bg-white text-black relative print:border-4 print:p-10 print:min-h-screen">
          
          {/* HEADER: VIEMMA TOURS EMBLEM */}
          <div className="text-center border-b-2 border-[#1A3326]/20 pb-8 space-y-2">
            <div className="inline-block">
              <span className="font-serif text-[#1A3326] text-3xl md:text-4xl font-extrabold tracking-[0.25em] block">
                VIEMMA
              </span>
              <span className="text-xs uppercase tracking-[0.5em] text-[#D4AF37] font-bold block mt-1">
                TOURS & SAFARIS
              </span>
            </div>
            <p className="text-[10px] tracking-widest uppercase font-semibold text-gray-500">
              VIP Chauffeur Meet & Greet Service • Southern Africa
            </p>
          </div>

          {/* MAIN PROMINENT PASSENGER NAME (Readable from 10 meters) */}
          <div className="my-auto py-12 text-center space-y-4">
            <span className="text-xs uppercase font-extrabold tracking-[0.3em] text-[#D4AF37] block">
              WELCOME TO SOUTH AFRICA
            </span>
            <div className="p-6 md:p-8 bg-slate-50 border-2 border-[#1A3326] rounded-2xl print:bg-white">
              <h1 className="text-4xl md:text-6xl font-serif font-black text-[#1A3326] tracking-wide break-words leading-tight">
                {placardName}
              </h1>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm font-bold text-gray-600 uppercase tracking-widest pt-2">
              <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                {passengerCount} {passengerCount === 1 ? 'Guest' : 'Guests'}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200 font-mono">
                Ref: {state.ref || 'VT-2026'}
              </span>
            </div>
          </div>

          {/* OPERATIONAL FLIGHT & PICKUP LOGISTICS STRIP */}
          <div className="border-t-2 border-[#1A3326]/20 pt-8 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Airline</span>
                <span className="text-base font-extrabold text-[#1A3326] block mt-1">{airlineName}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Flight No</span>
                <span className="text-base font-extrabold text-[#1A3326] font-mono block mt-1">{flightNumber}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Arrival Date</span>
                <span className="text-base font-extrabold text-[#1A3326] block mt-1">{arrivalDate}</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Arrival Time</span>
                <span className="text-base font-extrabold text-[#1A3326] font-mono block mt-1">{arrivalTime}</span>
              </div>
            </div>

            {/* PICKUP LOCATION & VEHICLE DETAILS */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:bg-white">
              <div className="text-left space-y-1">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">Meeting Point:</span>
                <span className="font-extrabold text-[#1A3326] text-sm">{pickupPoint}</span>
                <p className="text-[11px] text-gray-600">{pickupAirport}</p>
              </div>

              <div className="text-right sm:text-right space-y-1 shrink-0">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">Chauffeur & Dispatch:</span>
                <span className="font-bold text-[#1A3326]">{driverName}</span>
                <p className="text-[11px] text-gray-600">{vehicleName}</p>
              </div>
            </div>

            {pickupNotes && (
              <p className="text-[11px] text-center text-gray-500 italic">
                Notice: {pickupNotes}
              </p>
            )}

            {/* FOOTER VERIFICATION */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-[10px] text-gray-400 font-mono">
              <span>Viemma Tours Workspace OS • 24/7 Operations Duty Dispatch</span>
              <span>Emergency Operations: +27 21 555 0199</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
