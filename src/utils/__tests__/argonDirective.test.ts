/**
 * ARGON MASTER DIRECTIVE & PDF VISUAL QC — TARGETED REGRESSION TESTS
 * Verifies:
 * 1. VT-2026-XXX sequential trip reference generation
 * 2. Quick Add provisional traveller creation & individual identity stability
 * 3. Shared defaults inheritance vs individual overrides (Lead contact isolation)
 * 4. In-place identification of provisional travellers without duplication
 * 5. Lead person change without losing or overwriting other travellers
 * 6. PrDP 45-day threshold state machine
 * 7. Driver & vehicle cross-schedule overlap detection
 * 8. Free-text & JSON AI itinerary extraction
 * 9. Client Editorial Page Builder (1 Large Hero + 1 Supporting + 2 Paragraphs)
 * 10. Non-fabrication guard when approved content is insufficient for 2 paragraphs
 * 11. PDF Blob %PDF- header verification
 */

import type { AppState } from '../../types';
import { applyTripJson, parseTripJson } from '../tripJsonImport';
import {
  generateNextTripReference,
  createTravellerWithInheritance,
  quickAddProvisionalTravellers,
  updateTravellerInPlace,
  changeGroupLeadPerson,
  applyGroupDefaultsWithInheritance,
  TripGroupStructure,
} from '../argonDomainModel';
import {
  evaluateDriverPrDPStatus,
  detectAssignmentConflicts,
  normalizeHotelSettlementStatus,
} from '../operationalValidators';
import { parseAndMapItineraryInput, commitImportPreviewToGroup } from '../itineraryExtractor';
import { encryptShareProjection, decryptShareProjection } from '../../lib/shareService';
import {
  formatApprovedContentIntoTwoParagraphs,
  buildClientEditorialPages,
  verifyPdfBlobIntegrity,
} from '../pdfExportEngine';

export async function runArgonRegressionSuite(): Promise<{
  passed: number;
  failed: number;
  results: string[];
}> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, label: string) => {
    if (condition) {
      passed++;
      results.push(`[PASS] ${label}`);
    } else {
      failed++;
      results.push(`[FAIL] ${label}`);
    }
  };

  // Test 1: VT-2026 Reference Generation
  const nextRef = generateNextTripReference(['VT-2026-001', 'VT-2026-004', 'VT-2026-002'], 2026);
  assert(nextRef === 'VT-2026-005', `Sequential VT-2026 reference generation (${nextRef})`);

  // Test 2: Lead Person + Quick Add Provisional Travellers
  const defaults = {
    destination: 'Cape Town',
    startDate: '2026-11-01',
    endDate: '2026-11-07',
    contactEmail: 'maria@example.com',
    contactPhone: '+27 82 000 1111',
    nationalityDefault: 'Portuguese',
  };

  const lead = createTravellerWithInheritance({
    id: 'trv_lead_1',
    tripId: 'VT-2026-001',
    groupId: 'grp_1',
    category: 'Adult',
    isLead: true,
    isProvisional: false,
    fullName: 'Maria Silva',
    defaults,
  });

  const withQuickAdd = quickAddProvisionalTravellers(
    [lead],
    { adults: 2, seniors: 0, children: 1, infants: 1 },
    'VT-2026-001',
    'grp_1',
    defaults
  );

  assert(withQuickAdd.length === 5, 'Quick Add creates 4 distinct provisional traveller records under Lead');
  assert(
    withQuickAdd[1].fullName === 'Adult 1' &&
      withQuickAdd[2].fullName === 'Adult 2' &&
      withQuickAdd[3].fullName === 'Child 1' &&
      withQuickAdd[4].fullName === 'Infant 1',
    'Provisional labels follow exact Adult 1, Adult 2, Child 1, Infant 1 convention'
  );

  // Test 3: Lead contact details do not leak into other travellers' personal details
  assert(
    withQuickAdd[0].email === 'maria@example.com' && withQuickAdd[1].email === '',
    'Lead contact email is not copied onto other travellers'
  );

  // Test 4: Identify a provisional traveller in-place without duplicating
  const targetId = withQuickAdd[1].id;
  const afterIdentify = updateTravellerInPlace(withQuickAdd, targetId, {
    fullName: 'Carlos Silva',
    nationality: 'Brazilian',
  });
  assert(
    afterIdentify.length === 5 &&
      afterIdentify[1].id === targetId &&
      afterIdentify[1].fullName === 'Carlos Silva' &&
      afterIdentify[1].isProvisional === false,
    'Identifying Adult 1 updates record in-place with same stable ID and flips isProvisional to false'
  );

  // Test 5: Group default update respects individual overrides
  let group: TripGroupStructure = {
    id: 'grp_1',
    tripId: 'VT-2026-001',
    groupName: 'Silva Family',
    leadTravellerId: lead.id,
    defaults,
    travellers: afterIdentify,
    unmappedContextAlerts: [],
  };

  group = applyGroupDefaultsWithInheritance(group, { nationalityDefault: 'South African' });
  assert(
    group.travellers[1].nationality === 'Brazilian' && group.travellers[2].nationality === 'South African',
    'Group default update preserves Carlos Silva override (Brazilian) while updating non-overridden travellers'
  );

  // Test 6: Change Lead Person preserves all travellers
  const changedLeadGroup = changeGroupLeadPerson(group, targetId);
  assert(
    changedLeadGroup.travellers.length === 5 &&
      changedLeadGroup.leadTravellerId === targetId &&
      changedLeadGroup.travellers.some((t) => t.fullName === 'Maria Silva' && !t.isLead),
    'Changing Lead Person to Carlos Silva preserves Maria Silva and all 5 travellers'
  );

  // Test 7: PrDP 45-Day Threshold States
  const refDate = new Date('2026-10-14');
  assert(evaluateDriverPrDPStatus(undefined, refDate).state === 'Not Provided', 'PrDP Not Provided state');
  assert(evaluateDriverPrDPStatus('2026-10-01', refDate).state === 'Expired', 'PrDP Expired state');
  assert(evaluateDriverPrDPStatus('2026-11-15', refDate).state === 'Expiring Soon', 'PrDP Expiring Soon (<=45d) state');
  assert(evaluateDriverPrDPStatus('2027-03-01', refDate).state === 'Valid', 'PrDP Valid (>45d) state');

  // Test 8: Schedule Overlap Detection
  const conflicts = detectAssignmentConflicts({
    candidateId: 'tr_new',
    candidateTripId: 'VT-2026-002',
    date: '2026-11-02',
    startTime: '10:00',
    durationMinutes: 60,
    driver: {
      id: 'drv_1',
      fullName: 'Sipho Ndlovu',
      phone: '+27821112222',
      languages: ['English'],
      prdpExpiryDate: '2027-05-01',
      status: 'Active',
    },
    vehicleId: 'veh_sprinter_1',
    allTransfers: [
      {
        id: 'tr_existing',
        tripId: 'VT-2026-001',
        groupId: 'grp_1',
        travellerIds: ['trv_lead_1'],
        date: '2026-11-02',
        pickupTime: '09:30',
        estimatedDurationMinutes: 60,
        pickupLocation: 'CPT Airport',
        dropoffLocation: 'Table Bay Hotel',
        driverId: 'drv_1',
        vehicleId: 'veh_sprinter_1',
        updatedAt: '2026-10-14',
      },
    ],
    allActivities: [],
  });
  assert(
    conflicts.some((c) => c.type === 'DRIVER_OVERLAP') && conflicts.some((c) => c.type === 'VEHICLE_OVERLAP'),
    'Detects cross-trip Driver and Vehicle time overlap (09:30-10:30 vs 10:00-11:00)'
  );

  // Test 9: Free-Text AI Itinerary & Context Extraction
  const freeText = `
    Lead person: Elena Rostova (elena@rostova.org, +44 7700 900077)
    - Elena Rostova — Lead
    - Viktor Rostov — Adult
    2 Children
    Flight: BA059 CPT 2026-12-10 09:15 PNR: X7K9MP
    Hotel: Mount Nelson (https://maps.app.goo.gl/example123)
  `;
  const emptyGroup: TripGroupStructure = {
    id: 'grp_2',
    tripId: 'VT-2026-006',
    groupName: 'Rostova Group',
    leadTravellerId: '',
    defaults: { destination: 'Cape Town', startDate: '2026-12-10', endDate: '2026-12-18' },
    travellers: [],
    unmappedContextAlerts: [],
  };
  const preview = parseAndMapItineraryInput(freeText, emptyGroup, [], []);
  const committed = commitImportPreviewToGroup(preview, emptyGroup);
  assert(
    committed.travellers.length === 4 &&
      preview.flightsDetected.length === 1 &&
      preview.hotelsDetected[0]?.addressUnresolvedFlag === true,
    'Free-text extractor creates Lead + 1 Named Adult + 2 Provisional Children, extracts Flight BA059, and flags unresolved Google Maps hotel address'
  );

  // Test 10: Hotel Settlement Status Normalization
  const legacyCheck = normalizeHotelSettlementStatus('Partial Payment');
  assert(
    legacyCheck.status === 'Deposit Paid' && legacyCheck.flaggedForReview === true,
    'Legacy hotel status maps to Deposit Paid and flags record for review'
  );

  // Test 11: Client Editorial Page Layout (1 Hero + 1 Supporting + 2 Paragraphs) & Non-Fabrication Guard
  const shortCopyResult = formatApprovedContentIntoTwoParagraphs(['Single short sentence only.']);
  assert(
    shortCopyResult.paragraphs.length === 2 && shortCopyResult.insufficientContentFlag === true,
    'Insufficient approved text flags insufficientContentFlag without fabricating tourism copy'
  );

  const editorialPages = buildClientEditorialPages({
    group,
    flights: [],
    hotels: [],
    transfers: [],
    activities: [
      {
        id: 'act_1',
        tripId: 'VT-2026-001',
        groupId: 'grp_1',
        title: 'Cape Peninsula Private Tour',
        date: '2026-11-02',
        startTime: '09:00',
        endTime: '17:00',
        location: 'Cape Point',
        isGroupWide: true,
        participantTravellerIds: [lead.id],
        excludedTravellerIds: [],
        status: 'Confirmed',
        clientFacingNotes: 'Scenic coastal drive via Chapman’s Peak and Boulders Beach penguin colony.',
        internalNotes: 'CONFIDENTIAL: Net supplier rate R4,500',
        updatedAt: '2026-10-14',
      },
    ],
  });

  const serializedPages = JSON.stringify(editorialPages);
  assert(
    editorialPages.length === 2 &&
      Boolean(editorialPages[0].heroImage.url) &&
      Boolean(editorialPages[0].supportingImage.url) &&
      editorialPages[0].paragraphs.length === 2 &&
      !serializedPages.includes('Net supplier rate'),
    'Multi-page Client Editorial builder produces 1 Hero + 1 Supporting + 2 Paragraphs per page and strips internalNotes'
  );

  // Test 12: password-protected shares encrypt their payload before public storage.
  const protectedShareDoc = {
    token: 'cli_test_token_001',
    role: 'client' as const,
    active: true,
    version: 2,
    lastUpdated: '2026-10-14T12:00:00.000Z',
    title: 'CONFIDENTIAL SAMPLE ITINERARY TEXT',
    clientName: 'Test Client',
    accessPolicy: {
      expiresAt: null,
      passwordRequired: true,
      passwordSalt: '00112233445566778899aabbccddeeff',
      passwordIterations: 1000,
      allowDownloads: true,
      allowPrinting: true,
      showPricing: true,
      showSupplierDetails: false,
      hideInternalNotes: true,
      enableOfflineAccess: true,
    },
  };

  try {
    const encryptedShare = await encryptShareProjection(protectedShareDoc, 'strong-test-password');
    const envelopeJson = JSON.stringify(encryptedShare);
    assert(
      !envelopeJson.includes('CONFIDENTIAL SAMPLE ITINERARY TEXT') && Boolean(encryptedShare.encryptedPayload?.ciphertext),
      'Password-protected share envelope stores ciphertext, not plaintext itinerary content'
    );
    const decryptedShare = await decryptShareProjection('strong-test-password', encryptedShare);
    assert(
      decryptedShare?.title === 'CONFIDENTIAL SAMPLE ITINERARY TEXT',
      'Correct share password decrypts the itinerary content'
    );
    const rejectedShare = await decryptShareProjection('incorrect-password', encryptedShare);
    assert(rejectedShare === null, 'Incorrect share password cannot decrypt the protected itinerary');
  } catch (error) {
    assert(false, `Share encryption regression test executed (${String(error)})`);
  }

  // Test 13: PDF Blob Integrity Verifier
  const validPdfBytes = new Uint8Array([
    0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, ...new Array(100).fill(0x20),
  ]);
  const validBlob = new Blob([validPdfBytes], { type: 'application/pdf' });
  const blobCheck = await verifyPdfBlobIntegrity(validBlob);
  assert(blobCheck.isValid === true, 'PDF Blob verifier validates %PDF-1.7 signature and non-empty size');

  // Test 14: Master trip JSON maps conversation output into the relevant sections.
  const jsonImportBase = {
    ref: 'VT-2026-900',
    title: 'Existing Trip',
    consultant: '',
    priority: 'confirmed',
    source: 'direct',
    agent: { id: '', agencyName: '', contact: '', email: '', comm: '' },
    client: {
      name: '', preferredName: '', email: '', phone: '', whatsapp: '', country: '',
      contactMethod: 'whatsapp', tripType: 'multi', startDate: '', endDate: '',
      durationText: '', occasion: '', otherOccasion: '', tags: [],
    },
    groupConditions: { dietary: [], mobility: [], medical: [], prefs: [], notes: '' },
    guests: [], flights: [], transfers: [], rooms: [], activities: [], vehicles: [], drivers: [],
    experienceLibrary: [], destinationLibrary: [],
    finance: {
      currency: 'ZAR', rates: { USD: 1, EUR: 1, BRL: 1, AOA: 1 }, paymentMethod: 'none',
      margin: 0, marginType: '%', comm: 0, commType: '%', discount: 0, buffer: 0, bufferNotes: '',
    },
    internalNotes: '', namedGroups: [], dayTitles: {},
  } as unknown as AppState;

  const fullTripJson = parseTripJson(JSON.stringify({
    tripTitle: 'Dube Family Holiday',
    client: { name: 'Mandla Dube', email: 'mandla@example.com', tourType: 'Full-day tour', startDate: '2026-11-10', endDate: '2026-11-12' },
    travellers: [{ name: 'Mandla Dube', isLead: true, nationality: 'South African', passportNo: 'A123456' }],
    flights: [{ airline: 'South African Airways', flightNo: 'SA123', from: 'JNB', to: 'CPT', date: '2026-11-10', arrTime: '10:30', paxNames: ['Mandla Dube'] }],
    transfers: [{ type: 'Airport Arrival', date: '2026-11-10', time: '11:15', from: 'Cape Town International Airport', to: 'Table Bay Hotel', paxNames: ['Mandla Dube'] }],
    accommodations: [{ hotel: 'Table Bay Hotel', cin: '2026-11-10', cout: '2026-11-12', roomType: 'Standard Room', assignedPaxNames: ['Mandla Dube'] }],
    itinerary: { days: [{ day: 1, title: 'Arrival in Cape Town', activities: [{ name: 'Airport arrival and hotel transfer', start: '11:15', desc: 'Meet at arrivals' }] }] },
    finance: { currency: 'ZAR', margin: 20 },
  }));
  const fullTripResult = applyTripJson(jsonImportBase, fullTripJson, 'all', 'merge');
  assert(
    fullTripResult.state.client.name === 'Mandla Dube' &&
      fullTripResult.state.client.tourTypology === 'full_day_tour' &&
      fullTripResult.state.guests.length === 1 &&
      fullTripResult.state.flights.length === 1 &&
      fullTripResult.state.transfers.length === 1 &&
      fullTripResult.state.rooms.length === 1 &&
      fullTripResult.state.activities.length === 1 &&
      fullTripResult.state.dayTitles?.[1] === 'Arrival in Cape Town',
    'Whole-trip JSON populates client, traveller, flight, transfer, hotel, programme and timeline records'
  );
  assert(
    fullTripResult.state.flights[0]?.paxIds?.includes(fullTripResult.state.guests[0].id) &&
      fullTripResult.state.rooms[0]?.guestIds?.includes(fullTripResult.state.guests[0].id) &&
      fullTripResult.state.activities[0]?.paxIds?.includes(fullTripResult.state.guests[0].id),
    'Traveller names in JSON are resolved to the same saved traveller record across itinerary sections'
  );

  const focusedResult = applyTripJson(
    fullTripResult.state,
    { flights: [{ airline: 'Airlink', flightNo: '4Z456', from: 'CPT', to: 'JNB', date: '2026-11-12' }] },
    'flights',
    'merge'
  );
  assert(
    focusedResult.state.flights.length === 2 &&
      focusedResult.state.client.name === 'Mandla Dube' &&
      focusedResult.state.rooms.length === 1 &&
      focusedResult.state.activities.length === 1,
    'A focused Flights import leaves Clients, Hotels and Programme records unchanged'
  );

  const replaceFlightsResult = applyTripJson(
    focusedResult.state,
    { flights: [{ airline: 'Airlink', flightNo: '4Z789', from: 'CPT', to: 'JNB', date: '2026-11-12' }] },
    'flights',
    'replace'
  );
  assert(
    replaceFlightsResult.state.flights.length === 1 &&
      replaceFlightsResult.state.flights[0]?.flightNo === '4Z789' &&
      replaceFlightsResult.state.client.name === 'Mandla Dube',
    'Replace mode replaces only the selected section'
  );
  let invalidJsonRejected = false;
  try { parseTripJson('{invalid json'); } catch { invalidJsonRejected = true; }
  assert(invalidJsonRejected, 'JSON importer rejects malformed content without applying changes');

  return { passed, failed, results };
}
