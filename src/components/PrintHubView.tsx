import React, { useState, useRef, useMemo } from 'react';
import {
  TripGroupStructure,
  FlightRecord,
  HotelBookingRecord,
  TransferRecord,
  ActivityRecord,
} from '../utils/argonDomainModel';
import {
  buildClientEditorialPages,
  exportValidatedPrintPdfDocument,
  ClientEditorialPageData,
} from '../utils/pdfExportEngine';
import { ClientEditorialPage } from './ClientEditorialPage';
import { AppState } from '../types';
import { adaptAppStateToArgon } from '../utils/appStateToArgonAdapter';

export type PdfDocumentMode = 'client-editorial' | 'driver-pickup-board' | 'operator-ground-sheet';

export interface PrintHubViewProps {
  group?: TripGroupStructure;
  flights?: FlightRecord[];
  hotels?: HotelBookingRecord[];
  transfers?: TransferRecord[];
  activities?: ActivityRecord[];
  heroImageUrl?: string;
  supportingImageUrl?: string;
  // Backward compatibility with direct App.tsx invocation
  state?: AppState;
  onUpdateState?: (updates: Partial<AppState>) => void;
  totalCost?: number;
  netProfit?: number;
}

export const PrintHubView: React.FC<PrintHubViewProps> = (props) => {
  // If state is passed without explicit group, adapt AppState to Argon model seamlessly
  const adapted = useMemo(() => {
    if (props.state && !props.group) {
      return adaptAppStateToArgon(props.state);
    }
    return null;
  }, [props.state, props.group]);

  const group: TripGroupStructure = props.group || adapted?.group || {
    id: 'grp_default',
    tripId: 'VT-2026-001',
    groupName: 'Private Journey Party',
    leadTravellerId: '1',
    defaults: { destination: 'Cape Town' },
    travellers: [],
  };

  const flights: FlightRecord[] = props.flights || adapted?.flights || [];
  const hotels: HotelBookingRecord[] = props.hotels || adapted?.hotels || [];
  const transfers: TransferRecord[] = props.transfers || adapted?.transfers || [];
  const activities: ActivityRecord[] = props.activities || adapted?.activities || [];
  const heroImageUrl: string | undefined = props.heroImageUrl || adapted?.heroImageUrl;
  const supportingImageUrl: string | undefined = props.supportingImageUrl;

  const [mode, setMode] = useState<PdfDocumentMode>('client-editorial');
  const [activePageFilter, setActivePageFilter] = useState<'all' | number>('all');
  const [exportStatus, setExportStatus] = useState<string>('');
  const [customParagraphOverrides, setCustomParagraphOverrides] = useState<
    Record<number, [string, string]>
  >({});

  const printContainerRef = useRef<HTMLDivElement | null>(null);

  const editorialPages = useMemo(() => {
    const base = buildClientEditorialPages({
      group,
      flights,
      hotels,
      transfers,
      activities,
      heroImageUrl,
      supportingImageUrl,
    });
    return base.map((p) =>
      customParagraphOverrides[p.pageNumber]
        ? {
            ...p,
            paragraphs: customParagraphOverrides[p.pageNumber],
            insufficientContentFlag: false,
          }
        : p
    );
  }, [group, flights, hotels, transfers, activities, heroImageUrl, supportingImageUrl, customParagraphOverrides]);

  const insufficientPagesCount = editorialPages.filter((p) => p.insufficientContentFlag).length;
  const leadPerson = group.travellers.find((t) => t.id === group.leadTravellerId) || group.travellers[0];

  const handleEditPageParagraphs = (pageNumber: number, nextParagraphs: [string, string]) => {
    setCustomParagraphOverrides((prev) => ({
      ...prev,
      [pageNumber]: nextParagraphs,
    }));
  };

  const handleExportPdf = async () => {
    // Always render all pages before triggering multi-page export
    setActivePageFilter('all');
    setTimeout(async () => {
      const result = await exportValidatedPrintPdfDocument({
        containerElement: printContainerRef.current,
        documentTitle: `${group.tripId}-${mode}`,
        onStatusChange: (msg) => setExportStatus(msg),
      });
      if (!result.success && result.error) {
        setExportStatus(`Export Error: ${result.error}`);
      }
    }, 100);
  };

  const visibleEditorialPages: ClientEditorialPageData[] =
    activePageFilter === 'all'
      ? editorialPages
      : editorialPages.filter((p) => p.pageNumber === activePageFilter);

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Top Control Bar (Hidden in Print/PDF) */}
      <div className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-900 text-white rounded">
                {group.tripId}
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                Print & Multi-Page PDF Quality Control Hub
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Preview matches exact A4 physical output (210mm × 297mm). Internal notes are automatically stripped from Client & Pickup documents.
            </p>
          </div>

          {/* Document Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode('client-editorial')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  mode === 'client-editorial'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Client Editorial PDF ({editorialPages.length}p)
              </button>
              <button
                type="button"
                onClick={() => setMode('driver-pickup-board')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  mode === 'driver-pickup-board'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Driver Pickup Sign
              </button>
              <button
                type="button"
                onClick={() => setMode('operator-ground-sheet')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  mode === 'operator-ground-sheet'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Operator Ground Sheet
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportPdf}
              className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 shadow-xs transition cursor-pointer"
            >
              Export / Save as A4 PDF
            </button>
          </div>
        </div>

        {/* Page Inspector & QC Status Bar */}
        {mode === 'client-editorial' && (
          <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium text-slate-600 mr-1">Inspect Page:</span>
              <button
                type="button"
                onClick={() => setActivePageFilter('all')}
                className={`px-2.5 py-1 rounded border cursor-pointer ${
                  activePageFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                All Pages ({editorialPages.length})
              </button>
              {editorialPages.map((p) => (
                <button
                  key={p.pageNumber}
                  type="button"
                  onClick={() => setActivePageFilter(p.pageNumber)}
                  className={`px-2.5 py-1 rounded border flex items-center gap-1 cursor-pointer ${
                    activePageFilter === p.pageNumber
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  <span>Page {p.pageNumber}</span>
                  {p.insufficientContentFlag && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title="Needs approved copy" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {insufficientPagesCount > 0 ? (
                <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded font-medium">
                  {insufficientPagesCount} page(s) flagged for short copy (no fabricated text used)
                </span>
              ) : (
                <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-medium">
                  Visual QC Passed: 1 Hero + 1 Supporting + 2 Paragraphs on all pages
                </span>
              )}
              {exportStatus && (
                <span className="font-mono text-slate-600">{exportStatus}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Printable A4 Document Stage */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 pt-6 overflow-x-auto">
        <div ref={printContainerRef} className="space-y-8">
          {/* MODE 1: CLIENT EDITORIAL ITINERARY (Mandatory 1 Hero + 1 Supporting + 2 Paragraphs per page) */}
          {mode === 'client-editorial' &&
            visibleEditorialPages.map((page) => (
              <ClientEditorialPage
                key={page.pageNumber}
                page={page}
                showOperatorWarnings={true}
                onEditParagraphs={handleEditPageParagraphs}
              />
            ))}

          {/* MODE 2: DRIVER PICKUP BOARD (Public-Safe, Zero Internal Notes) */}
          {mode === 'driver-pickup-board' && (
            <article
              className="viemma-pdf-page bg-white text-slate-900 border border-slate-200 shadow-md mx-auto flex flex-col justify-between"
              style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}
            >
              <header className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.25em] text-slate-500">
                    VIEMMA TOURS GROUND OPERATIONS
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 mt-1">
                    WELCOME / AIRPORT PICKUP SIGN
                  </h1>
                </div>
                <span className="font-mono text-sm font-bold px-3 py-1 bg-slate-900 text-white rounded">
                  {group.tripId}
                </span>
              </header>

              <div className="my-auto py-16 text-center border-y border-slate-200">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-4">
                  WELCOME TO {group.defaults.destination?.toUpperCase() || 'CAPE TOWN'}
                </div>
                <div
                  className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight break-words"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {transfers[0]?.pickupSignText || leadPerson?.fullName || group.groupName}
                </div>
                <p className="text-base text-slate-600 mt-4 font-medium">
                  Party of {group.travellers.length} Traveller{group.travellers.length === 1 ? '' : 's'}
                </p>
              </div>

              <footer className="grid grid-cols-3 gap-4 pt-4 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900 block">Arrival Flight</span>
                  {flights[0] ? `${flights[0].flightNumber} (${flights[0].arrivalTime || 'TBC'})` : 'As Scheduled'}
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Transfer Destination</span>
                  {transfers[0]?.dropoffLocation || hotels[0]?.propertyName || group.defaults.destination}
                </div>
                <div className="text-right font-mono">Page 1 of 1</div>
              </footer>
            </article>
          )}

          {/* MODE 3: OPERATOR GROUND SHEET (Full Connected Hierarchy & Traveller Manifest) */}
          {mode === 'operator-ground-sheet' && (
            <article
              className="viemma-pdf-page bg-white text-slate-900 border border-slate-200 shadow-md mx-auto flex flex-col justify-between"
              style={{ width: '210mm', minHeight: '297mm', padding: '16mm 18mm' }}
            >
              <div>
                <header className="border-b border-slate-300 pb-3 mb-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-rose-700 font-bold">
                      INTERNAL OPERATIONS MANIFEST (CONFIDENTIAL)
                    </span>
                    <h1 className="text-xl font-bold text-slate-900">
                      {group.tripId} — {group.groupName}
                    </h1>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <div>Lead: {leadPerson?.fullName || 'Unassigned'}</div>
                    <div>Total Pax: {group.travellers.length}</div>
                  </div>
                </header>

                {/* Connected Traveller Roster */}
                <div className="mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    1. Group & Traveller Hierarchy
                  </h2>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300">
                        <th className="py-1.5 px-2">Traveller</th>
                        <th className="py-1.5 px-2">Role / Cat</th>
                        <th className="py-1.5 px-2">Nationality</th>
                        <th className="py-1.5 px-2">Dietary / Accessibility</th>
                        <th className="py-1.5 px-2">Status / Missing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {group.travellers.map((t) => (
                        <tr key={t.id}>
                          <td className="py-1.5 px-2 font-semibold">{t.fullName}</td>
                          <td className="py-1.5 px-2">
                            {t.isLead ? 'Lead' : t.category}
                          </td>
                          <td className="py-1.5 px-2">{t.nationality || '—'}</td>
                          <td className="py-1.5 px-2">
                            {[t.dietaryRequirements, t.medicalOrAccessibilityNotes]
                              .filter(Boolean)
                              .join(' • ') || 'None'}
                          </td>
                          <td className="py-1.5 px-2">
                            {t.missingFields.length > 0
                              ? `Missing: ${t.missingFields.join(', ')}`
                              : 'Confirmed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Accommodation & Settlement Status */}
                <div className="mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    2. Accommodation & Settlement
                  </h2>
                  {hotels.length === 0 ? (
                    <p className="text-xs text-slate-500">No hotel bookings recorded.</p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {hotels.map((h) => (
                        <div key={h.id} className="p-2.5 border border-slate-200 rounded">
                          <div className="flex justify-between font-semibold">
                            <span>
                              {h.propertyName} ({h.checkInDate} to {h.checkOutDate})
                            </span>
                            <span>Status: {h.settlementStatus}</span>
                          </div>
                          {h.addressUnresolvedFlag && (
                            <div className="text-[11px] text-amber-800 mt-0.5">
                              ⚠ Address unresolved from Google Maps link — confirm street address manually.
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <footer className="pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                <span>{group.tripId} • Internal Operator Ground Sheet</span>
                <span className="font-mono">Page 1 of 1</span>
              </footer>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};
