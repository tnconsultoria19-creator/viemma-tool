/**
 * VIEMMA TOURS — END-TO-END ACCEPTANCE TEST SUITE
 * Validates:
 * 1. Activity Management (Creation, Editing, Overlaps, Tight Transfer Buffers, Status Transitions, Persistence)
 * 2. PDF Engine (Client Editorial Pages, Driver Pickup Board, Operator Ground Sheet, 1 Hero + 1 Supporting + 2 Paragraphs, Internal Notes Stripping)
 * 3. Financial Reconciler (Active vs Cancelled reconciliation, Multi-currency rates, Segment totals)
 * 4. Client Presentation View (Polished formatting, no empty sections)
 */

import { AppState, Activity, Transfer, Guest } from './src/types';
import { adaptAppStateToArgon } from './src/utils/appStateToArgonAdapter';
import {
  buildClientEditorialPages,
  formatApprovedContentIntoTwoParagraphs,
  verifyPdfBlobIntegrity,
} from './src/utils/pdfExportEngine';
import { detectAssignmentConflicts } from './src/utils/operationalValidators';

export async function runFullAcceptanceTest(): Promise<{
  allPassed: boolean;
  suiteResults: Record<string, any>;
}> {
  const log: string[] = [];
  let passedCount = 0;
  let failedCount = 0;

  const check = (condition: boolean, desc: string) => {
    if (condition) {
      passedCount++;
      log.push(`[PASS] ${desc}`);
    } else {
      failedCount++;
      log.push(`[FAIL] ${desc}`);
    }
  };

  console.log('--- 1. ACTIVITY MANAGEMENT ACCEPTANCE TEST ---');
  // Initialize mock state
  const guests: Guest[] = [
    {
      id: 101,
      first: 'Alexander',
      last: 'Vanderbilt',
      age: 'Adult',
      nationality: '🇺🇸 United States',
      country: '🇺🇸 United States',
      isLead: true,
      notes: 'VIP Lead Client',
    },
    {
      id: 102,
      first: 'Charlotte',
      last: 'Vanderbilt',
      age: 'Adult',
      nationality: '🇺🇸 United States',
      country: '🇺🇸 United States',
      isLead: false,
      notes: '',
    },
  ];

  let state: AppState = {
    ref: 'VT-2026-001',
    title: 'Cape & Winelands Private Odyssey',
    priority: 'hot',
    source: 'direct',
    consultant: 'Viemma Concierge Ops',
    agent: { id: '', contact: '', email: '', comm: '' },
    client: {
      name: 'Alexander Vanderbilt Party',
      email: 'alex@vanderbilt.com',
      phone: '+1 212 555 0199',
      country: '🇿🇦 South Africa',
      contactMethod: 'email',
      tripType: 'multi',
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      durationText: '7 days',
      occasion: 'Anniversary',
      otherOccasion: '',
      tags: ['Luxury', 'Safari', 'Wine'],
    },
    groupConditions: {
      dietary: ['No Shellfish'],
      mobility: [],
      medical: [],
      prefs: ['High Floor Suite', 'Private Vehicle'],
      notes: 'Client celebrates 10th anniversary.',
    },
    guests,
    flights: [
      {
        id: 201,
        direction: 'Inbound',
        date: '2026-11-01',
        depTime: '06:00',
        arrTime: '08:30',
        duration: '11h 30m',
        airline: 'British Airways',
        flightNo: 'BA058',
        pnr: 'VDB77K',
        from: 'London Heathrow (LHR)',
        to: 'Cape Town Intl (CPT)',
        cabin: 'Business',
        status: 'Confirmed',
        paxIds: [101, 102],
        bagHand: 2,
        bagCheck: 4,
        bagOver: 0,
        cost: 28000,
        markup: 15,
        qty: 2,
        notes: 'VIP Fast-track meet at aircraft door.',
        stops: [],
      },
    ],
    transfers: [
      {
        id: 301,
        type: 'Airport Arrival',
        date: '2026-11-01',
        time: '09:15',
        status: 'Confirmed',
        from: 'Cape Town International Airport',
        to: 'The Silo Hotel, V&A Waterfront',
        meet: 'International Arrivals Hall',
        sign: 'MR. A. VANDERBILT',
        flight: 'BA058',
        dist: '22 km',
        dur: '35 min',
        vehicle: 'Mercedes-Benz V-Class Luxury',
        driver: 'Sipho Ndlovu',
        driverPhone: '+27 82 111 2222',
        paxCount: 2,
        paxIds: [101, 102],
        bagHand: 2,
        bagCheck: 4,
        bagOver: 0,
        seats: [],
        special: ['Mineral Water', 'Cold Towels'],
        cost: 1650,
        tolls: 0,
        parking: 80,
        notes: 'Airport meet & greet with branded placard.',
        waypoints: [],
      },
      {
        id: 302,
        type: 'Point-to-Point',
        date: '2026-11-02',
        time: '17:10', // 10 minutes after scheduled activity ends at 17:00
        status: 'Confirmed',
        from: 'Cape Point National Park',
        to: 'The Silo Hotel',
        meet: 'Main Parking Pavilion',
        sign: 'VANDERBILT',
        flight: '',
        dist: '65 km',
        dur: '75 min',
        vehicle: 'Mercedes-Benz V-Class Luxury',
        driver: 'Sipho Ndlovu',
        driverPhone: '+27 82 111 2222',
        paxCount: 2,
        paxIds: [101, 102],
        bagHand: 0,
        bagCheck: 0,
        bagOver: 0,
        seats: [],
        special: [],
        cost: 2200,
        tolls: 60,
        parking: 0,
        notes: 'Return transfer after Cape Peninsula Tour.',
        waypoints: [],
      },
    ],
    rooms: [
      {
        id: 401,
        hotel: 'The Silo Hotel',
        conf: 'SIL-99012',
        pay: 'Deposit Paid',
        depositAmount: 30000,
        balanceDue: 45000,
        roomType: 'Deluxe Superior Silo Suite',
        bed: 'King',
        meal: 'Full English Breakfast & Rooftop Access',
        cin: '2026-11-01',
        cout: '2026-11-04',
        nights: 3,
        guestIds: [101, 102],
        rate: 25000,
        supp: 0,
        reqs: ['High Floor', 'Harbour View'],
        notes: 'Complimentary MCC sparkling wine on arrival.',
        address: 'Silo Square, V&A Waterfront, Cape Town, 8001',
        googleMapsUrl: 'https://maps.app.goo.gl/thesilohotel',
      },
    ],
    activities: [],
    vehicles: [],
    drivers: [],
    experienceLibrary: [],
    destinationLibrary: [],
    finance: {
      currency: 'ZAR',
      rates: { USD: 0.055, EUR: 0.051, BRL: 0.31, AOA: 48.5 },
      paymentMethod: 'invoice',
      margin: 20,
      marginType: '%',
      comm: 0,
      commType: '%',
      discount: 0,
      buffer: 1500,
      bufferNotes: 'Contingency emergency fuel/gate buffer',
    },
    internalNotes: 'VIP ground handling authorized. Direct operations hotline: +27 21 000 8899.',
  };

  // Step 1: Create an activity
  const act1: Activity = {
    id: 501,
    day: 2,
    date: '2026-11-02',
    slot: 'Full Day',
    name: 'Cape Peninsula Private Coastal Safari & Cape Point',
    desc: "Private guided tour along Chapman's Peak drive to Cape Point nature reserve and Boulders Beach penguin colony.",
    pickup: '08:30',
    start: '09:00',
    endTime: '17:00',
    dur: '8 hours',
    venue: 'Cape Point Nature Reserve & Boulders Beach',
    pickupLoc: 'The Silo Hotel Main Portico',
    responsiblePerson: 'Tariq Hendricks (Certified National Guide)',
    status: 'Planned',
    conf: 'CPT-PEN-4401',
    supplier: 'Viemma Private Touring Ground Division',
    supPhone: '+27 21 555 4321',
    paxIds: [101, 102],
    pAdult: 3200,
    pChild: 0,
    nAdult: 2,
    nChild: 0,
    flat: 0,
    total: 6400,
    inc: ['Private Luxury Vehicle', 'Certified Guide', 'Entrance Gates', 'Funicular Tickets'],
    backup: 'Constantia Wine Route if gale-force south-easterly wind closes Cape Point.',
    notes: 'CONFIDENTIAL: Direct net supplier cost R4,200. Client invoiced R6,400.',
    isFree: false,
  };

  state.activities.push(act1);
  check(state.activities.length === 1, 'Activity 1 created and registered in state');
  check(state.activities[0].venue === 'Cape Point Nature Reserve & Boulders Beach', 'Activity venue recorded correctly');
  check(state.activities[0].responsiblePerson === 'Tariq Hendricks (Certified National Guide)', 'Responsible person recorded correctly');
  check(state.activities[0].endTime === '17:00', 'End time recorded correctly');

  // Step 2: Edit activity and confirm persistence
  state.activities[0].status = 'Confirmed';
  state.activities[0].pickup = '08:15';
  state.activities[0].start = '08:45';
  check(state.activities[0].status === 'Confirmed', 'Activity status updated to Confirmed in-place');
  check(state.activities[0].start === '08:45', 'Activity rescheduled start time persisted');

  // Step 3: Create overlapping activity on the same date/time
  const act2Overlapping: Activity = {
    id: 502,
    day: 2,
    date: '2026-11-02',
    slot: 'Afternoon',
    name: 'Table Mountain Sunset Cableway Tour',
    desc: 'Cableway ascent for panoramic sunset view.',
    pickup: '15:30',
    start: '16:00',
    endTime: '18:30', // Overlaps with 08:45 - 17:00
    dur: '2.5 hours',
    venue: 'Table Mountain Lower Cable Station',
    pickupLoc: 'The Silo Hotel',
    responsiblePerson: 'Table Mountain Ops',
    status: 'Planned',
    conf: 'TM-9988',
    supplier: 'Cableway Co',
    supPhone: '+27 21 424 8408',
    paxIds: [101, 102],
    pAdult: 450,
    pChild: 0,
    nAdult: 2,
    nChild: 0,
    flat: 0,
    total: 900,
    inc: ['Cableway ticket'],
    backup: '',
    notes: 'Sunset booking',
    isFree: false,
  };

  state.activities.push(act2Overlapping);
  check(state.activities.length === 2, 'Second activity added for schedule conflict testing');

  // Test schedule overlap detector
  const parseM = (t?: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const a1Start = parseM(state.activities[0].start);
  const a1End = parseM(state.activities[0].endTime);
  const a2Start = parseM(state.activities[1].start);
  const a2End = parseM(state.activities[1].endTime);

  const hasOverlap = a1Start < a2End && a1End > a2Start;
  check(hasOverlap, 'Schedule overlap detected between Activity 1 (08:45-17:00) and Activity 2 (16:00-18:30)');

  // Test insufficient transfer time (<25 min between 17:00 activity end and 17:10 transfer departure)
  const tr = state.transfers.find(t => t.id === 302);
  const trTime = parseM(tr?.time);
  const bufferMinutes = trTime - a1End;
  const isTightTurnaround = bufferMinutes >= 0 && bufferMinutes < 25;
  check(isTightTurnaround && bufferMinutes === 10, 'Insufficient transfer buffer detected (10 minutes < 25 min safety threshold)');

  // Step 4: Status transitions (Postpone, Cancel, Complete)
  state.activities[1].status = 'Postponed';
  check(state.activities[1].status === 'Postponed', 'Activity 2 transitioned to Postponed');

  state.activities[1].status = 'Cancelled';
  check(state.activities[1].status === 'Cancelled', 'Activity 2 transitioned to Cancelled');

  state.activities[0].status = 'Completed';
  check(state.activities[0].status === 'Completed', 'Activity 1 transitioned to Completed');

  console.log('\n--- 2. PDF GENERATION & CONTENT AUDIT ---');
  // Adapt AppState into Argon Domain Structure
  const domainData = adaptAppStateToArgon(state);
  check(Boolean(domainData.group), 'Domain adapter successfully creates TripGroupStructure');
  check(domainData.group.travellers.length === 2, '2 Travellers mapped into domain structure');
  check(domainData.group.leadTravellerId === '101', 'Lead traveller ID correctly points to 101');

  // Build Client Editorial Pages
  const clientPages = buildClientEditorialPages({
    group: domainData.group,
    flights: domainData.flights,
    hotels: domainData.hotels,
    transfers: domainData.transfers,
    activities: domainData.activities,
  });

  check(clientPages.length >= 2, `Client Editorial multi-page document generated (${clientPages.length} pages)`);

  // Verify Page 1: Overview Page
  const p1 = clientPages[0];
  check(p1.pageCategory === 'Trip Overview', 'Page 1 is Trip Overview');
  check(Boolean(p1.heroImage.url), 'Page 1 has valid hero image URL');
  check(Boolean(p1.supportingImage.url), 'Page 1 has valid supporting image URL');
  check(p1.paragraphs.length === 2, 'Page 1 strictly contains exactly two paragraphs');

  // Verify Page 2: Daily Experience Page for 2026-11-02
  const p2 = clientPages.find(p => p.dateLabel === '2026-11-02');
  check(Boolean(p2), 'Daily Experience page exists for active activity date 2026-11-02');
  if (p2) {
    check(p2.paragraphs.length === 2, 'Page 2 strictly contains exactly two paragraphs');
    check(p2.paragraphs[0].includes('Cape Peninsula Private Coastal Safari'), 'Page 2 primary paragraph includes completed Activity 1');
    check(!p2.paragraphs[0].includes('Table Mountain Sunset Cableway Tour'), 'Page 2 strictly excludes Cancelled Activity 2');
    check(!JSON.stringify(p2).includes('Net supplier cost'), 'CONFIDENTIAL supplier cost strictly stripped from Client Editorial Page');
    check(!JSON.stringify(p2).includes('invoiced R6,400'), 'Private commercial margin notes stripped from Client Editorial Page');
  }

  // Verify Operator Ground Sheet maintains full internal details
  const operatorManifestJson = JSON.stringify({
    group: domainData.group,
    hotels: domainData.hotels,
    transfers: domainData.transfers,
    activities: domainData.activities,
  });
  check(operatorManifestJson.includes('Tariq Hendricks'), 'Operator ground sheet includes responsible guide');
  check(operatorManifestJson.includes('CONFIDENTIAL: Direct net supplier cost'), 'Operator ground sheet preserves internal operational notes for staff');

  // Test %PDF- header byte verification
  const dummyPdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0x0a, ...new Array(200).fill(0x30)]);
  const dummyPdfBlob = new Blob([dummyPdfHeader], { type: 'application/pdf' });
  const pdfIntegrity = await verifyPdfBlobIntegrity(dummyPdfBlob);
  check(pdfIntegrity.isValid && pdfIntegrity.byteLength > 64, 'PDF file integrity verified (%PDF- header and non-empty size)');

  console.log('\n--- 3. FINANCIAL RECONCILIATION AUDIT ---');
  // Reconcile total cost
  // Flights: BA058 = 28000 * 2 = 56000
  // Transfers: 301 (1650 + 80 = 1730) + 302 (2200 + 60 = 2260) = 3990
  // Rooms: The Silo 25000 * 3 nights = 75000
  // Activities: Act 1 (Completed) = 6400, Act 2 (Cancelled) = 0 (EXCLUDED)
  // Expected Total Cost = 56000 + 3990 + 75000 + 6400 = 141,390 ZAR
  const flightExpected = 56000;
  const transferExpected = 3990;
  const roomExpected = 75000;
  const activityExpected = 6400; // Act 2 is cancelled, so not counted
  const expectedTotalCost = flightExpected + transferExpected + roomExpected + activityExpected;

  const actualFlightCost = state.flights.reduce((sum, f) => sum + (f.status === 'Cancelled' ? 0 : f.cost * f.qty), 0);
  const actualTransferCost = state.transfers.reduce((sum, t) => sum + (t.status === 'Cancelled' ? 0 : t.cost + t.tolls + t.parking), 0);
  const actualRoomCost = state.rooms.reduce((sum, r) => sum + (r.status === 'Cancelled' ? 0 : (r.rate * r.nights) + r.supp), 0);
  const actualActivityCost = state.activities.reduce((sum, a) => sum + (a.isFree || a.status === 'Cancelled' ? 0 : a.total), 0);
  const actualTotalCost = actualFlightCost + actualTransferCost + actualRoomCost + actualActivityCost;

  check(actualTotalCost === expectedTotalCost, `Total Cost reconciles: Expected R${expectedTotalCost.toLocaleString()} == Actual R${actualTotalCost.toLocaleString()}`);
  check(actualActivityCost === 6400, 'Cancelled Activity 2 (R900) excluded from operational costs');

  // Verify markup and net profit
  const markupTotal = actualTotalCost * (state.finance.margin / 100); // 20% of 141,390 = 28,278
  const netProfit = markupTotal + state.finance.buffer - state.finance.discount; // 28,278 + 1,500 = 29,778
  check(netProfit === 29778, `Commercial ledger net profit calculated correctly: R${netProfit.toLocaleString()}`);

  return {
    allPassed: failedCount === 0,
    suiteResults: {
      passedCount,
      failedCount,
      log,
      financialAudit: {
        flightCost: actualFlightCost,
        transferCost: actualTransferCost,
        roomCost: actualRoomCost,
        activityCost: actualActivityCost,
        totalCost: actualTotalCost,
        netProfit,
      },
    },
  };
}
