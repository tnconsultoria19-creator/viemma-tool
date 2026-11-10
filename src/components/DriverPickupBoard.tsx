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
  const matchedTransfer = arrivalTransfers.find(t => 
    selectedFlight && (t.flight === selectedFlight.flightNo || t.linkedFlightId === selectedFlight.id)
  ) || arrivalTransfers[0];

  const leadGuest = state.guests.find(g => g.isLead) || state.guests[0];
  const passengerCount = state.guests.length || (matchedTransfer ? matchedTransfer.paxCount : 1);

  // Editable display name on placard
  const defaultPlacardName = matchedTransfer?.sign || 
    (state.client.name ? state.client.name.toUpperCase() : leadGuest ? `${leadGuest.first.toUpperCase()} ${leadGuest.last.toUpperCase()} PARTY` : 'VIP GUEST');

  const [placardName, setPlacardName] = useState(defaultPlacardName);
  const [pickupAirport, setPickupAirport] = useState(
    matchedTransfer?.from || (selectedFlight ? `${selectedFlight.to} International Airport` : 'Cape Town International Airport')
  );
  const [pickupPoint, setPickupPoint] = useState(
    matchedTransfer?.meet || 'International Arrivals Hall — Door 4'
  );
  const [pickupNotes, setPickupNotes] = useState(
    matchedTransfer?.notes || 'Assist with luxury luggage and escort to private vehicle.'
  );

  const handlePrint = () => {
    window.print();
  };

  const airlineName = selectedFlight?.airline || 'Scheduled Flight';
  const flightNumber = selectedFlight?.flightNo || matchedTransfer?.flight || 'PRIVATE ARRIVAL';
  const arrivalDate = selectedFlight?.date || matchedTransfer?.date || state.client.startDate || 'Arrival Date';
  const arrivalTime = selectedFlight?.arrTime || matchedTransfer?.time || 'Scheduled Time';
  const driverName = matchedTransfer?.driver || state.drivers?.[0]?.name || 'Viemma Chauffeur';
  const vehicleName = matchedTransfer?.vehicle || state.vehicles?.[0]?.name || 'Luxury VIP Vehicle';

  const [showAgencyBranding, setShowAgencyBranding] = useState(
    state.welcomePlacard?.showAgencyName ?? true
  );
  const [customAgencyName, setCustomAgencyName] = useState(
    state.welcomePlacard?.agencyName || state.agent?.agencyName || 'Viemma Tours & Safaris'
  );
  const [destinationHotel, setDestinationHotel] = useState(
    matchedTransfer?.to || state.rooms?.[0]?.hotel || 'Luxury Hotel & Resort'
  );
  const [collectionTime, setCollectionTime] = useState(
    matchedTransfer?.time && matchedTransfer.time !== selectedFlight?.arrTime
      ? matchedTransfer.time
      : ''
  );

  return (
    <div className="space-y-6">
      {/* Print Page Orientation Style Rule */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* ON-SCREEN CONTROLS (Hidden during printing) */}
      <div className="print:hidden bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
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
                A4 Landscape Printable Chauffeur Placard
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
              <span>Print Landscape Board</span>
            </button>
          </div>
        </div>

        {/* Configuration Grid */}
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
            <label className="font-bold text-gray-600 block mb-1">Agency / Operator Branding</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customAgencyName}
                onChange={(e) => setCustomAgencyName(e.target.value)}
                disabled={!showAgencyBranding}
                className="w-full p-2.5 rounded-xl border border-gray-200 font-medium text-xs disabled:bg-gray-100"
                placeholder="Agency Name"
              />
              <label className="flex items-center gap-1 shrink-0 text-[11px] font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAgencyBranding}
                  onChange={(e) => setShowAgencyBranding(e.target.checked)}
                  className="rounded text-[#1A3326]"
                />
                Show
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-600 block mb-1">Destination Hotel / Resort</label>
            <input
              type="text"
              value={destinationHotel}
              onChange={(e) => setDestinationHotel(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 font-medium text-xs"
              placeholder="e.g. The Silo Hotel, Cape Town"
            />
          </div>
        </div>
      </div>

      {/* THE ACTUAL A4 LANDSCAPE PRINTABLE PLACARD CONTAINER */}
      <div className="bg-white p-2 md:p-6 rounded-3xl shadow-lg border border-gray-200 max-w-[297mm] mx-auto print:p-0 print:border-none print:shadow-none print:m-0 print:max-w-none">
        
        {/* A4 Landscape Dimensions Frame (297mm x 210mm) */}
        <div className="w-full min-h-[200mm] p-8 md:p-10 border-4 border-[#1A3326] rounded-2xl flex flex-col justify-between bg-white text-black relative print:border-4 print:p-8 print:min-h-screen">
          
          {/* HEADER: AGENCY / OPERATOR EMBLEM */}
          <div className="text-center border-b-2 border-[#1A3326]/20 pb-4 space-y-1">
            {showAgencyBranding ? (
              <div className="inline-block">
                <span className="font-serif text-[#1A3326] text-3xl md:text-4xl font-extrabold tracking-[0.25em] block uppercase">
                  {customAgencyName}
                </span>
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#D4AF37] font-bold block mt-0.5">
                  VIP Chauffeur & Private Ground Handling
                </span>
              </div>
            ) : (
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400 block">
                PRIVATE VIP ARRIVAL WELCOME
              </span>
            )}
          </div>

          {/* MAIN PROMINENT PASSENGER NAME (Centered, Huge & Clear) */}
          <div className="my-auto py-6 text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-[0.35em] text-[#D4AF37] block">
              WELCOME TO SOUTH AFRICA
            </span>
            <div className="py-6 px-8 bg-slate-50 border-2 border-[#1A3326] rounded-2xl print:bg-white inline-block w-full">
              <h1 className="text-5xl md:text-7xl font-serif font-black text-[#1A3326] tracking-wider break-words leading-none uppercase">
                {placardName}
              </h1>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-600 uppercase tracking-widest pt-1">
              <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                {passengerCount} {passengerCount === 1 ? 'Guest' : 'Guests'}
              </span>
              <span className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                Hotel: {destinationHotel}
              </span>
            </div>
          </div>

          {/* OPERATIONAL FLIGHT & PICKUP LOGISTICS STRIP */}
          <div className="border-t-2 border-[#1A3326]/20 pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">Airline</span>
                <span className="text-sm font-extrabold text-[#1A3326] block mt-0.5">{airlineName}</span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">Flight No</span>
                <span className="text-sm font-extrabold text-[#1A3326] font-mono block mt-0.5">{flightNumber}</span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">Arrival Date</span>
                <span className="text-sm font-extrabold text-[#1A3326] block mt-0.5">{arrivalDate}</span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 print:bg-white">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">Flight Arrival</span>
                <span className="text-sm font-extrabold text-[#1A3326] font-mono block mt-0.5">{arrivalTime}</span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 print:bg-white col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">Collection Time</span>
                <span className="text-sm font-extrabold text-[#1A3326] font-mono block mt-0.5">
                  {collectionTime ? collectionTime : arrivalTime}
                </span>
              </div>
            </div>

            {/* PICKUP LOCATION & VEHICLE DETAILS */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:bg-white">
              <div className="text-left space-y-0.5">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[9px] block">Meeting Point & Destination:</span>
                <span className="font-extrabold text-[#1A3326] text-xs">{pickupPoint} • {destinationHotel}</span>
                <p className="text-[10px] text-gray-600">{pickupAirport}</p>
              </div>

              <div className="text-right sm:text-right space-y-0.5 shrink-0">
                <span className="font-bold text-gray-500 uppercase tracking-wider text-[9px] block">Chauffeur & Vehicle:</span>
                <span className="font-bold text-[#1A3326] text-xs">{driverName}</span>
                <p className="text-[10px] text-gray-600">{vehicleName}</p>
              </div>
            </div>

            {pickupNotes && (
              <p className="text-[10px] text-center text-gray-500 italic">
                Notice: {pickupNotes}
              </p>
            )}

            {/* FOOTER VERIFICATION */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-[9px] text-gray-400 font-mono">
              <span>Viemma Tours Workspace OS • Operations Duty Dispatch</span>
              <span>Emergency Operations: +27 21 555 0199</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
