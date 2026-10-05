import { Flight, Transfer, Activity, AppState } from '../types';

export interface OperationalImpactAlert {
  id: string;
  flightId: number;
  flightNo: string;
  direction: string;
  date: string;
  previousTime?: string;
  newTime: string;
  affectedTransfers: Transfer[];
  affectedActivities: Activity[];
  summaryText: string;
  details: string[];
}

/**
 * Detect operational impacts across transfers and activities when flights are modified
 */
export function detectFlightImpacts(
  state: AppState,
  updatedFlight: Flight,
  previousFlight?: Flight
): OperationalImpactAlert | null {
  const affectedTransfers: Transfer[] = [];
  const affectedActivities: Activity[] = [];
  const details: string[] = [];

  const flightDate = updatedFlight.date;
  const flightArrTime = updatedFlight.arrTime?.replace('+1', '').trim();
  const flightDepTime = updatedFlight.depTime;

  // 1. Check Transfers
  (state.transfers || []).forEach(t => {
    // Check direct flight number link or linkedFlightId or matching date & Airport Arrival
    const matchesFlight = (t.flight && t.flight.toLowerCase().includes(updatedFlight.flightNo?.toLowerCase())) ||
      t.linkedFlightId === updatedFlight.id ||
      (t.type === 'Airport Arrival' && t.date === flightDate);

    if (matchesFlight) {
      // If transfer pickup time is before or within 30 min of the arrival time
      if (t.time && flightArrTime) {
        const [tH, tM] = t.time.split(':').map(Number);
        const [fH, fM] = flightArrTime.split(':').map(Number);
        const tMinutes = tH * 60 + (tM || 0);
        const fMinutes = fH * 60 + (fM || 0);

        // If transfer is scheduled before flight lands or too tight (less than 30 mins)
        if (tMinutes < fMinutes + 30) {
          affectedTransfers.push(t);
          details.push(`Transfer "${t.from} → ${t.to}" is set to ${t.time}, which is before/too close to flight landing at ${flightArrTime}.`);
        }
      } else {
        affectedTransfers.push(t);
      }
    }

    // Departure flight checks
    if (updatedFlight.direction === 'Outbound' && t.type === 'Airport Departure' && t.date === flightDate) {
      if (t.time && flightDepTime) {
        const [tH, tM] = t.time.split(':').map(Number);
        const [fH, fM] = flightDepTime.split(':').map(Number);
        const tMinutes = tH * 60 + (tM || 0);
        const fMinutes = fH * 60 + (fM || 0);

        // If departure transfer is scheduled less than 2.5 hours before international departure
        if (fMinutes - tMinutes < 150) {
          affectedTransfers.push(t);
          details.push(`Departure transfer "${t.from}" scheduled at ${t.time} provides less than 2.5h buffer before flight departure at ${flightDepTime}.`);
        }
      }
    }
  });

  // 2. Check Activities on the same day
  if (updatedFlight.direction === 'Inbound' && flightArrTime) {
    const [fH, fM] = flightArrTime.split(':').map(Number);
    const fMinutes = fH * 60 + (fM || 0);

    // If arrival is on Day 1
    (state.activities || []).forEach(a => {
      if (a.day === 1 && a.start) {
        const [aH, aM] = a.start.split(':').map(Number);
        const aMinutes = aH * 60 + (aM || 0);

        // If activity starts within 2 hours of flight arrival
        if (aMinutes < fMinutes + 120) {
          affectedActivities.push(a);
          details.push(`Experience "${a.name}" starts at ${a.start}, leaving insufficient buffer after flight arrival at ${flightArrTime}.`);
        }
      }
    });
  }

  if (affectedTransfers.length === 0 && affectedActivities.length === 0) {
    return null;
  }

  const transferCount = affectedTransfers.length;
  const activityCount = affectedActivities.length;
  const impactParts: string[] = [];
  if (transferCount > 0) impactParts.push(`${transferCount} transfer${transferCount > 1 ? 's' : ''}`);
  if (activityCount > 0) impactParts.push(`${activityCount} experience${activityCount > 1 ? 's' : ''}`);

  return {
    id: `impact_${updatedFlight.id}_${Date.now()}`,
    flightId: updatedFlight.id,
    flightNo: updatedFlight.flightNo || 'Flight',
    direction: updatedFlight.direction,
    date: updatedFlight.date,
    previousTime: previousFlight?.arrTime || previousFlight?.depTime,
    newTime: flightArrTime || flightDepTime,
    affectedTransfers,
    affectedActivities,
    summaryText: `Flight ${updatedFlight.flightNo} schedule changed to ${flightArrTime || flightDepTime}. Potentially affected: ${impactParts.join(' and ')}.`,
    details
  };
}
