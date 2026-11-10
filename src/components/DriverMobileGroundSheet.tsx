import React from 'react';
import {
  TripGroupStructure,
  TransferRecord,
  ActivityRecord,
  FlightRecord,
  HotelBookingRecord,
  DriverProfileRecord,
} from '../utils/argonDomainModel';
import { calculateDriverDutyFatigue } from '../utils/operationalAutomations';

interface DriverMobileGroundSheetProps {
  driver: DriverProfileRecord;
  date: string;
  group: TripGroupStructure;
  transfers: TransferRecord[];
  activities: ActivityRecord[];
  flights: FlightRecord[];
  hotels: HotelBookingRecord[];
}

/**
 * High-contrast, read-only mobile ground sheet tailored for Western Cape drivers on the road.
 * Strictly strips all internal financial notes, supplier net rates, and confidential margins.
 */
export const DriverMobileGroundSheet: React.FC<DriverMobileGroundSheetProps> = ({
  driver,
  date,
  group,
  transfers,
  activities,
  flights,
}) => {
  const lead =
    group.travellers.find((t) => t.id === group.leadTravellerId) ||
    group.travellers[0];

  const myTransfers = transfers.filter(
    (tr) => tr.driverId === driver.id && tr.date === date
  );
  const myActivities = activities.filter(
    (act) =>
      act.driverId === driver.id &&
      act.date === date &&
      act.status !== 'Cancelled'
  );

  const fatigue = calculateDriverDutyFatigue({
    driver,
    date,
    transfers,
    activities,
  });

  const cleanPhoneForWhatsApp = (raw?: string) =>
    (raw || '').replace(/[^\d]/g, '');

  const buildGoogleMapsDirectionsUrl = (origin: string, destination: string) =>
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin + ', Western Cape, South Africa'
    )}&destination=${encodeURIComponent(
      destination + ', Western Cape, South Africa'
    )}&travelmode=driving`;

  const dietaryList = group.travellers
    .filter((t) => t.dietaryRequirements || t.medicalOrAccessibilityNotes)
    .map((t) => ({
      name: t.fullName,
      notes: [t.dietaryRequirements, t.medicalOrAccessibilityNotes]
        .filter(Boolean)
        .join(' • '),
    }));

  return (
    <div className="max-w-md mx-auto bg-slate-950 text-white min-h-screen pb-16 font-sans">
      {/* Top Driver Dispatch Banner */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
            VIEMMA GROUND DISPATCH
          </span>
          <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-200">
            {group.tripId}
          </span>
        </div>
        <h1 className="text-lg font-bold mt-1">{driver.fullName}</h1>
        <p className="text-xs text-slate-400">
          Duty Date: <strong className="text-white">{date}</strong> • Total Duty:{' '}
          <strong className="text-white">{fatigue.totalScheduledHours}h</strong>
        </p>

        {fatigue.fatigueWarningMessage && (

          <div className="mt-2 p-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs">
            ⚠ {fatigue.fatigueWarningMessage}
          </div>
        )}
      </header>

      <div className="p-4 space-y-4">
        {/* Lead Guest & One-Tap Contact Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            Guest Group & Lead Contact
          </div>
          <div className="text-base font-bold mt-1">
            {lead?.fullName || group.groupName} ({group.travellers.length} Pax)
          </div>

          {dietaryList.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800 text-xs space-y-1">
              <div className="text-amber-400 font-semibold">
                Comfort, Mobility & Dietary Notes:
              </div>
              {dietaryList.map((item, idx) => (
                <div key={idx} className="text-slate-300">
                  • <strong>{item.name}:</strong> {item.notes}
                </div>
              ))}
            </div>
          )}

          {lead?.phone && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/${cleanPhoneForWhatsApp(lead.phone)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-center text-xs font-bold text-white block"
              >
                WhatsApp Lead
              </a>
              <a
                href={`tel:${lead.phone}`}
                className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-center text-xs font-bold text-white border border-slate-700 block"
              >
                Call Lead Guest
              </a>
            </div>
          )}
        </section>

        {/* Assigned Transfers */}
        <section className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Scheduled Transfers ({myTransfers.length})
          </h2>
          {myTransfers.map((tr) => {
            const linkedFlight = flights.find((f) => f.id === tr.id);
            return (
              <div
                key={tr.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {tr.pickupTime}
                  </span>
                  <span className="text-xs bg-slate-800 px-2 py-0.5 rounded">
                    {(tr.travellerIds || []).length} Pax
                  </span>
                </div>

                <div className="text-sm font-semibold">
                  {tr.pickupLocation} → {tr.dropoffLocation}
                </div>

                {linkedFlight && (
                  <div className="text-xs text-sky-300 font-mono">
                    ✈ Flight {linkedFlight.flightNumber} ({linkedFlight.direction}{' '}
                    {linkedFlight.arrivalTime || linkedFlight.departureTime})
                  </div>
                )}

                {tr.pickupSignText && (
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-center">
                    <div className="text-[10px] uppercase text-slate-500">
                      Pickup Board Sign
                    </div>
                    <div className="text-sm font-serif font-bold text-white mt-0.5">
                      {tr.pickupSignText}
                    </div>
                  </div>
                )}

                {tr.clientFacingNotes && (
                  <p className="text-xs text-slate-300">{tr.clientFacingNotes}</p>
                )}

                <a
                  href={buildGoogleMapsDirectionsUrl(
                    tr.pickupLocation,
                    tr.dropoffLocation
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-center text-xs font-bold text-white"
                >
                  Open Route in Google Maps
                </a>
              </div>
            );
          })}
        </section>

        {/* Assigned Touring Activities */}
        {myActivities.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Assigned Touring & Activities ({myActivities.length})
            </h2>
            {myActivities.map((act) => (
              <div
                key={act.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex justify-between text-xs font-mono text-amber-400">
                  <span>
                    {act.startTime} – {act.endTime || 'TBC'}
                  </span>
                  <span>{(act.participantTravellerIds || []).length} Pax</span>
                </div>
                <div className="text-sm font-bold">{act.title}</div>
                <div className="text-xs text-slate-400">{act.location}</div>
                {act.clientFacingNotes && (
                  <p className="text-xs text-slate-300">{act.clientFacingNotes}</p>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};
