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
import { isCloudConnected } from '../lib/firebase';
import { 
  syncProjectionsToFirestore, 
  regenerateShareToken, 
  revokeShareToken 
} from '../lib/shareService';
import {
  Printer,
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Lock,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Download,
  Calendar,
  Users,
  AlertCircle,
  Sparkles,
  Key,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders
} from 'lucide-react';

export type PdfDocumentMode = 'client-editorial' | 'driver-pickup-board' | 'operator-ground-sheet' | 'financial-audit';
export type HubViewTab = 'pdf-qc' | 'digital-publishing';

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
  const [selectedGroupScope, setSelectedGroupScope] = useState<string>('ALL');
  const availableNamedGroups = props.state?.namedGroups || [];
  const selectedNamedGroup = availableNamedGroups.find(g => g.id === selectedGroupScope);

  const printGroup: TripGroupStructure = useMemo(() => {
    if (!selectedNamedGroup) return group;
    const memberIds = new Set((selectedNamedGroup.memberIds || []).map(String));
    const travellers = group.travellers.filter(t => memberIds.has(t.id));
    const leaderId = selectedNamedGroup.leaderId ? String(selectedNamedGroup.leaderId) : '';
    const lead = travellers.find(t => t.id === leaderId) || travellers.find(t => t.isLead) || travellers[0];
    return { ...group, groupName: selectedNamedGroup.name, leadTravellerId: lead?.id || group.leadTravellerId, travellers };
  }, [group, selectedNamedGroup]);

  const scopedActivities: ActivityRecord[] = useMemo(() => {
    if (selectedGroupScope === 'ALL') return activities;
    if (!selectedNamedGroup) return [];
    const memberIds = new Set((selectedNamedGroup.memberIds || []).map(String));
    return activities.filter(activity => activity.groupIds?.length
      ? activity.groupIds.includes(selectedGroupScope)
      : (activity.participantTravellerIds || []).some(id => memberIds.has(id)));
  }, [activities, selectedGroupScope, selectedNamedGroup]);

  const scopedFlights: FlightRecord[] = useMemo(() => {
    if (selectedGroupScope === 'ALL') return flights;
    const memberIds = new Set((selectedNamedGroup?.memberIds || []).map(String));
    return flights.filter(flight => (flight.travellerIds || []).some(id => memberIds.has(id)));
  }, [flights, selectedGroupScope, selectedNamedGroup]);

  const scopedHotels: HotelBookingRecord[] = useMemo(() => {
    if (selectedGroupScope === 'ALL') return hotels;
    const memberIds = new Set((selectedNamedGroup?.memberIds || []).map(String));
    return hotels.filter(hotel => (hotel.travellerIds || []).some(id => memberIds.has(id)));
  }, [hotels, selectedGroupScope, selectedNamedGroup]);

  const scopedTransfers: TransferRecord[] = useMemo(() => {
    if (selectedGroupScope === 'ALL') return transfers;
    const memberIds = new Set((selectedNamedGroup?.memberIds || []).map(String));
    return transfers.filter(transfer => (transfer.travellerIds || []).some(id => memberIds.has(id)));
  }, [transfers, selectedGroupScope, selectedNamedGroup]);

  // Active top-level tab: PDF Quality Control vs Digital Publishing
  const [activeHubTab, setActiveHubTab] = useState<HubViewTab>('pdf-qc');

  // PDF Document mode
  const [mode, setMode] = useState<PdfDocumentMode>('client-editorial');
  const [activePageFilter, setActivePageFilter] = useState<'all' | number>('all');
  const [exportStatus, setExportStatus] = useState<string>('');
  const [customParagraphOverrides, setCustomParagraphOverrides] = useState<
    Record<number, [string, string]>
  >({});

  // Publishing & access control state
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);
  const [newVersionNote, setNewVersionNote] = useState('');

  const printContainerRef = useRef<HTMLDivElement | null>(null);

  const editorialPages = useMemo(() => {
    const base = buildClientEditorialPages({
      group: printGroup,
      flights: scopedFlights,
      hotels: scopedHotels,
      transfers: scopedTransfers,
      activities: scopedActivities,
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
  }, [printGroup, scopedFlights, scopedHotels, scopedTransfers, scopedActivities, heroImageUrl, supportingImageUrl, customParagraphOverrides]);

  const insufficientPagesCount = editorialPages.filter((p) => p.insufficientContentFlag).length;
  const leadPerson = printGroup.travellers.find((t) => t.id === printGroup.leadTravellerId) || printGroup.travellers[0];

  const welcomePlacard = props.state?.welcomePlacard || {
    showAgencyName: true,
    agencyName: 'Vema Tours',
    guestName: '',
  };
  const updateWelcomePlacard = (updates: Partial<NonNullable<AppState['welcomePlacard']>>) => {
    props.onUpdateState?.({ welcomePlacard: { ...welcomePlacard, ...updates } });
  };
  const placardGuestName = welcomePlacard.guestName?.trim()
    || scopedTransfers[0]?.pickupSignText
    || leadPerson?.fullName
    || group.groupName;
  const placardHotelOrDestination = scopedHotels[0]?.propertyName
    || scopedTransfers[0]?.dropoffLocation
    || '';
  const placardFlight = scopedFlights.find(flight => flight.direction === 'Arrival') || scopedFlights[0];

  const handleEditPageParagraphs = (pageNumber: number, nextParagraphs: [string, string]) => {
    setCustomParagraphOverrides((prev) => ({
      ...prev,
      [pageNumber]: nextParagraphs,
    }));
  };

  const handleExportPdf = async () => {
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

  // Publishing Actions
  const currentPublishing = props.state?.publishing || {
    tripId: group.tripId,
    publicUrl: typeof window !== 'undefined' ? `${window.location.origin}/trip/${group.tripId}` : '',
    publishStatus: 'Draft' as const,
    version: 1,
    publishedAt: '',
    lastUpdated: new Date().toISOString(),
    accessToken: 'tok_default',
    clientToken: 'cli_default',
    agentToken: 'agt_default',
    opsToken: 'ops_default',
    clientTokenActive: true,
    agentTokenActive: true,
    opsTokenActive: true,
    passwordProtected: false,
    expiresAt: null,
    settings: {
      requirePassword: false,
      password: '',
      enableExpiryDate: false,
      expiresAt: null,
      allowDownloads: true,
      allowPrinting: true,
      hideInternalNotes: true,
      showPricing: true,
      showSupplierDetails: false,
      enableOfflineAccess: true,
      language: 'English',
      currency: 'ZAR',
    },
    versions: [
      {
        version: 1,
        date: new Date().toISOString().split('T')[0],
        note: 'Initial setup draft',
        status: 'Draft',
      },
    ],
  };

  const handlePublishTripToLive = async () => {
    if (!props.state || !props.onUpdateState) {
      setPublishFeedback('State synchronization unavailable.');
      return;
    }
    if (!isCloudConnected) {
      setPublishFeedback('Live publishing requires an active Firestore connection. Save locally, reconnect, and publish again.');
      return;
    }
    setIsPublishing(true);
    try {
      const nextVer = (currentPublishing.version || 1) + 1;
      const nowIso = new Date().toISOString();
      const updatedVersions = [
        {
          version: nextVer,
          date: nowIso.split('T')[0],
          note: newVersionNote.trim() || `Published release v${nextVer} with live verified itinerary data.`,
          status: 'Published',
        },
        ...(currentPublishing.versions || []),
      ];

      // Activate the projection before generating it; otherwise a previously revoked
      // token could be written back as inactive and remain inaccessible after publish.
      const stateForPublish: AppState = {
        ...props.state,
        version: nextVer,
        publishing: {
          ...currentPublishing,
          publishStatus: 'Published',
          version: nextVer,
          publishedAt: nowIso,
          lastUpdated: nowIso,
          // Preserve explicit revocations. A normal publish must not silently reactivate
          // a role whose link was revoked; use Regenerate Token to issue a new link.
          clientTokenActive: currentPublishing.clientTokenActive ?? true,
          agentTokenActive: currentPublishing.agentTokenActive ?? true,
          opsTokenActive: currentPublishing.opsTokenActive ?? true,
          versions: updatedVersions,
        },
      };
      const tokens = await syncProjectionsToFirestore(stateForPublish);
      props.onUpdateState({
        version: nextVer,
        publishing: {
          ...stateForPublish.publishing!,
          clientToken: tokens.clientToken,
          agentToken: tokens.agentToken,
          opsToken: tokens.opsToken,
        },
      });

      setNewVersionNote('');
      setPublishFeedback(`Successfully published itinerary v${nextVer} to live client, agent and operations channels.`);
      setTimeout(() => setPublishFeedback(null), 4000);
    } catch (err: any) {
      setPublishFeedback(`Publishing error: ${err?.message || 'Failed to sync projections.'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRegenerateToken = async (role: 'client' | 'agent' | 'ops') => {
    if (!props.state || !props.onUpdateState) return;
    try {
      const updated = await regenerateShareToken(props.state, role);
      props.onUpdateState({ publishing: updated.publishing });
      setPublishFeedback(`Regenerated new secure token for ${role.toUpperCase()} channel.`);
      setTimeout(() => setPublishFeedback(null), 3000);
    } catch (err: any) {
      setPublishFeedback(`Could not regenerate token: ${err?.message}`);
    }
  };

  const handleRevokeToken = async (role: 'client' | 'agent' | 'ops') => {
    if (!props.state || !props.onUpdateState) return;
    try {
      const updated = await revokeShareToken(props.state, role);
      props.onUpdateState({ publishing: updated.publishing });
      setPublishFeedback(`Access revoked for ${role.toUpperCase()} channel.`);
      setTimeout(() => setPublishFeedback(null), 3000);
    } catch (err: any) {
      setPublishFeedback(`Could not revoke token: ${err?.message}`);
    }
  };

  const handleToggleSetting = (key: keyof typeof currentPublishing.settings, val: any) => {
    if (!props.state || !props.onUpdateState) return;
    const nowIso = new Date().toISOString();
    props.onUpdateState({
      publishing: {
        ...currentPublishing,
        lastUpdated: nowIso,
        publishStatus: currentPublishing.publishedAt ? 'Changes Pending' : currentPublishing.publishStatus,
        settings: {
          ...currentPublishing.settings,
          [key]: val,
        },
      },
    });
  };

  const financialAudit = useMemo(() => {
    const source = props.state;
    if (!source) return null;
    const flightsActive = (source.flights || []).filter(item => item.status !== 'Cancelled');
    const transfersActive = (source.transfers || []).filter(item => item.status !== 'Cancelled');
    const roomsActive = (source.rooms || []).filter(item => item.status !== 'Cancelled');
    const activitiesActive = (source.activities || []).filter(item => item.status !== 'Cancelled');
    const flightCost = flightsActive.reduce((sum, item) => sum + item.cost * item.qty, 0);
    const transferCost = transfersActive.reduce((sum, item) => sum + item.cost + item.tolls + item.parking, 0);
    const accommodationCost = roomsActive.reduce((sum, item) => sum + item.rate * item.nights + item.supp, 0);
    const activityCost = activitiesActive.reduce((sum, item) => sum + (item.isFree ? 0 : item.total), 0);
    const totalCost = flightCost + transferCost + accommodationCost + activityCost;
    const finance = source.finance;
    const markup = finance.marginType === '%' ? totalCost * finance.margin / 100 : finance.margin;
    const processingRate = finance.paymentMethod === 'visa' || finance.paymentMethod === 'master'
      ? 0.025
      : finance.paymentMethod === 'amex' ? 0.038 : 0;
    const processingFee = totalCost * processingRate;
    const commission = finance.commType === '%' ? (totalCost + markup) * finance.comm / 100 : finance.comm;
    const sellingPrice = Math.max(0, totalCost + markup + finance.buffer + processingFee - finance.discount);
    // Preserve negative results. An audit should reveal a projected loss rather than mask it at zero.
    const netProfit = markup + finance.buffer + processingFee - finance.discount - commission;
    const money = (value: number) => Number.isFinite(value) ? value : 0;
    const rows = [
      ...source.flights.map(item => ({
        id: `flight-${item.id}`, category: 'Flight', date: item.date || 'TBC',
        description: `${item.airline || 'Airline TBC'} ${item.flightNo || ''} · ${item.from || '?'} → ${item.to || '?'}`,
        status: item.status || 'Planned', amount: item.status === 'Cancelled' ? 0 : money(item.cost * item.qty),
        excluded: item.status === 'Cancelled'
      })),
      ...source.transfers.map(item => ({
        id: `transfer-${item.id}`, category: 'Transfer', date: item.date || 'TBC',
        description: `${item.type}: ${item.from || '?'} → ${item.to || '?'}`,
        status: item.status || 'Planned', amount: item.status === 'Cancelled' ? 0 : money(item.cost + item.tolls + item.parking),
        excluded: item.status === 'Cancelled'
      })),
      ...source.rooms.map(item => ({
        id: `room-${item.id}`, category: 'Accommodation', date: item.cin || 'TBC',
        description: `${item.hotel || 'Property TBC'} · ${item.roomType || 'Room type TBC'} · ${item.nights || 0} night(s)`,
        status: item.status || 'Planned', amount: item.status === 'Cancelled' ? 0 : money(item.rate * item.nights + item.supp),
        excluded: item.status === 'Cancelled'
      })),
      ...source.activities.map(item => ({
        id: `activity-${item.id}`, category: 'Activity', date: item.date || `Day ${item.day || 1}`,
        description: `${item.name || 'Activity TBC'} · ${item.start || 'Time TBC'}${item.endTime ? `–${item.endTime}` : ''}`,
        status: item.status || 'Planned', amount: item.status === 'Cancelled' || item.isFree ? 0 : money(item.total),
        excluded: item.status === 'Cancelled' || item.isFree
      }))
    ];
    return { rows, flightCost, transferCost, accommodationCost, activityCost, totalCost, markup, processingFee, commission, sellingPrice, netProfit };
  }, [props.state]);

  const visibleEditorialPages: ClientEditorialPageData[] =
    activePageFilter === 'all'
      ? editorialPages
      : editorialPages.filter((p) => p.pageNumber === activePageFilter);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return 'https://viemmatours.com';
  };

  const clientShareUrl = `${getBaseUrl()}?share=client&token=${currentPublishing.clientToken || 'cli_preview'}`;
  const agentShareUrl = `${getBaseUrl()}?share=agent&token=${currentPublishing.agentToken || 'agt_preview'}`;
  const opsShareUrl = `${getBaseUrl()}?share=ops&token=${currentPublishing.opsToken || 'ops_preview'}`;

  return (
    <div className="min-h-screen bg-slate-100 pb-20 font-sans">
      {/* Primary Navigation & Control Bar */}
      <div className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-[#10233F] text-white rounded-md">
                {group.tripId}
              </span>
              <h1 className="text-base font-bold text-slate-900">
                Print Hub & Itinerary Publishing Studio
              </h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentPublishing.publishStatus === 'Published'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {currentPublishing.publishStatus} • v{currentPublishing.version || 1}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Unified control center for A4 physical print compliance and digital client/agent live access.
            </p>
          </div>

          {/* Top-Level Mode Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveHubTab('pdf-qc')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeHubTab === 'pdf-qc'
                    ? 'bg-[#10233F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Printer size={13} />
                <span>PDF Quality Control</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveHubTab('digital-publishing')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeHubTab === 'digital-publishing'
                    ? 'bg-[#10233F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe size={13} />
                <span>Publishing & Access Tokens</span>
              </button>
            </div>

            {activeHubTab === 'pdf-qc' && (
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-4 py-2 text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Download size={13} />
                <span>Export / Save as A4 PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* PDF Sub-controls (Only visible when PDF QC tab is active) */}
        {activeHubTab === 'pdf-qc' && (
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {availableNamedGroups.length > 0 && (
                <label className="flex items-center gap-2 mr-2">
                  <span className="font-semibold text-slate-500">Programme scope:</span>
                  <select value={selectedGroupScope} onChange={e => { setSelectedGroupScope(e.target.value); setActivePageFilter('all'); }} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800">
                    <option value="ALL">All groups / whole trip</option>
                    {availableNamedGroups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.memberIds.length})</option>)}
                  </select>
                </label>
              )}
              <span className="font-semibold text-slate-500 mr-1">Document Format:</span>
              <button
                type="button"
                onClick={() => setMode('client-editorial')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  mode === 'client-editorial'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Client Editorial PDF ({editorialPages.length} Pages)
              </button>
              <button
                type="button"
                onClick={() => setMode('driver-pickup-board')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  mode === 'driver-pickup-board'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Driver Airport Pickup Sign
              </button>
              <button
                type="button"
                onClick={() => setMode('operator-ground-sheet')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  mode === 'operator-ground-sheet'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Operator Ground Sheet
              </button>
              <button
                type="button"
                onClick={() => setMode('financial-audit')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  mode === 'financial-audit'
                    ? 'bg-rose-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Final Financial Audit
              </button>
            </div>

            {mode === 'driver-pickup-board' && (
              <div className="w-full flex flex-col sm:flex-row sm:items-end gap-4 border-t border-slate-200 pt-3 mt-1">
                <label className="flex items-center gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={welcomePlacard.showAgencyName}
                    onChange={e => updateWelcomePlacard({ showAgencyName: e.target.checked })}
                    className="h-4 w-4 accent-emerald-800"
                  />
                  <span>Show agency / partner name</span>
                </label>
                <label className="flex-1 max-w-md space-y-1">
                  <span className="block text-xs font-medium text-slate-700">Agency / partner name</span>
                  <input
                    type="text"
                    value={welcomePlacard.agencyName}
                    onChange={e => updateWelcomePlacard({ agencyName: e.target.value })}
                    disabled={!welcomePlacard.showAgencyName}
                    placeholder="Vema Tours or partner agency"
                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </label>
                <label className="flex-1 max-w-md space-y-1">
                  <span className="block text-xs font-medium text-slate-700">Name to print (optional)</span>
                  <input
                    type="text"
                    value={welcomePlacard.guestName || ''}
                    onChange={e => updateWelcomePlacard({ guestName: e.target.value })}
                    placeholder={leadPerson?.fullName || 'Use lead traveller name'}
                    className="w-full h-9 px-3 rounded-md border border-slate-300 text-sm"
                  />
                </label>
              </div>
            )}

            {/* Editorial Page Filter */}
            {mode === 'client-editorial' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-slate-500 mr-1">Page Inspector:</span>
                <button
                  type="button"
                  onClick={() => setActivePageFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                    activePageFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All ({editorialPages.length})
                </button>
                {editorialPages.map((p) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() => setActivePageFilter(p.pageNumber)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      activePageFilter === p.pageNumber
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>p.{p.pageNumber}</span>
                    {p.insufficientContentFlag && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Short content warning" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FEEDBACK BANNER */}
      {publishFeedback && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{publishFeedback}</span>
            </div>
            <button onClick={() => setPublishFeedback(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
          </div>
        </div>
      )}

      {/* VIEW 1: DIGITAL PUBLISHING & ACCESS CONTROLS */}
      {activeHubTab === 'digital-publishing' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
          {/* Section 1: Publishing Status & Live Sync */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-[#D4AF37]/15 text-[#10233F]">
                    <Share2 size={18} />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Live Client & Agent Publishing</h2>
                    <p className="text-xs text-slate-500">
                      Synchronize your verified trip dossier to client digital magazine, B2B partner agent portal, and driver sheets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishTripToLive}
                  className="px-5 py-2.5 rounded-xl bg-[#10233F] text-white hover:bg-[#1a3a68] text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isPublishing ? 'animate-spin' : ''} />
                  <span>{isPublishing ? 'Publishing...' : 'Publish Latest Itinerary'}</span>
                </button>
              </div>
            </div>

            {/* Publishing Metadata summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Publish Status</span>
                <span className="font-bold text-slate-900">{currentPublishing.publishStatus}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Current Version</span>
                <span className="font-bold text-slate-900">v{currentPublishing.version || 1}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Last Published</span>
                <span className="font-medium text-slate-700">
                  {currentPublishing.publishedAt ? new Date(currentPublishing.publishedAt).toLocaleString('en-ZA') : 'Not yet published'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Password Protection</span>
                <span className="font-bold text-slate-900">
                  {currentPublishing.settings.requirePassword ? '🔒 Protected' : '🔓 Open with Token'}
                </span>
              </div>
            </div>

            {/* Optional change release note input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Release Change Note (Logged in version audit history):
              </label>
              <input
                type="text"
                value={newVersionNote}
                onChange={(e) => setNewVersionNote(e.target.value)}
                placeholder="e.g., Updated Day 3 wine estate tasting times and confirmed private guide allocation."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Section 2: Role-Based Access Tokens & Live Sharing URLs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Key size={16} className="text-[#D4AF37]" />
              <h3 className="text-sm font-bold text-slate-900">Role-Controlled Access Tokens & URLs</h3>
            </div>

            <div className="space-y-4">
              {/* Channel 1: Client Magazine */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Client Digital Magazine</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      currentPublishing.clientTokenActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentPublishing.clientTokenActive !== false ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={clientShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      Open Link <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRegenerateToken('client')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-200 rounded-md"
                      title="Invalidates current link and creates a new secure token"
                    >
                      Regenerate Token
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeToken('client')}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-900 px-2 py-1 bg-white border border-rose-200 rounded-md"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={clientShareUrl}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(clientShareUrl);
                      setCopiedRole('client');
                      setTimeout(() => setCopiedRole(null), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 shrink-0 flex items-center gap-1"
                  >
                    {copiedRole === 'client' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedRole === 'client' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Channel 2: B2B Travel Agent Proposal */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">B2B Travel Agent Proposal (Agency Margin)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      currentPublishing.agentTokenActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentPublishing.agentTokenActive !== false ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={agentShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                    >
                      Open Link <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRegenerateToken('agent')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-200 rounded-md"
                    >
                      Regenerate Token
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeToken('agent')}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-900 px-2 py-1 bg-white border border-rose-200 rounded-md"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={agentShareUrl}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(agentShareUrl);
                      setCopiedRole('agent');
                      setTimeout(() => setCopiedRole(null), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 shrink-0 flex items-center gap-1"
                  >
                    {copiedRole === 'agent' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedRole === 'agent' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Channel 3: Ground Operations & Driver Sheet */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Ground Operations & Driver Sheet (Zero Financials)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      currentPublishing.opsTokenActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentPublishing.opsTokenActive !== false ? 'Active' : 'Revoked'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={opsShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                    >
                      Open Link <ExternalLink size={12} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRegenerateToken('ops')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-200 rounded-md"
                    >
                      Regenerate Token
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeToken('ops')}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-900 px-2 py-1 bg-white border border-rose-200 rounded-md"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={opsShareUrl}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-mono select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(opsShareUrl);
                      setCopiedRole('ops');
                      setTimeout(() => setCopiedRole(null), 2000);
                    }}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 shrink-0 flex items-center gap-1"
                  >
                    {copiedRole === 'ops' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedRole === 'ops' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Privacy, Security & Client Presentation Settings */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield size={16} className="text-[#10233F]" />
              <h3 className="text-sm font-bold text-slate-900">Security, Privacy & Content Controls</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Setting 1: Password Protection */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock size={13} className="text-[#D4AF37]" /> Require Password for Itinerary
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentPublishing.settings.requirePassword)}
                    onChange={(e) => handleToggleSetting('requirePassword', e.target.checked)}
                    className="rounded text-[#10233F] focus:ring-[#D4AF37] w-4 h-4 cursor-pointer"
                  />
                </div>
                {currentPublishing.settings.requirePassword && (
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={currentPublishing.settings.password || ''}
                    onChange={(e) => handleToggleSetting('password', e.target.value)}
                    placeholder="Enter a unique access password..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                )}
              </div>

              {/* Setting 2: Expiry Date */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock size={13} className="text-[#D4AF37]" /> Itinerary Expiration Date
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(currentPublishing.settings.enableExpiryDate)}
                    onChange={(e) => handleToggleSetting('enableExpiryDate', e.target.checked)}
                    className="rounded text-[#10233F] focus:ring-[#D4AF37] w-4 h-4 cursor-pointer"
                  />
                </div>
                {currentPublishing.settings.enableExpiryDate && (
                  <input
                    type="date"
                    value={currentPublishing.settings.expiresAt || ''}
                    onChange={(e) => handleToggleSetting('expiresAt', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                )}
              </div>

              {/* Setting 3: Client Pricing Visibility */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Show Client-Facing Pricing</span>
                  <span className="text-slate-500 text-[11px]">Display selling prices and payment schedules on client portal</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(currentPublishing.settings.showPricing !== false)}
                  onChange={(e) => handleToggleSetting('showPricing', e.target.checked)}
                  className="rounded text-[#10233F] focus:ring-[#D4AF37] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Client-facing currency is presentation-only; accounting remains in the base ZAR ledger. */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label htmlFor="viemma-share-currency" className="font-bold text-slate-900 block">Client Display Currency</label>
                <p className="text-slate-500 text-[11px]">Choose the currency shown in the published itinerary price summary.</p>
                <select
                  id="viemma-share-currency"
                  value={['ZAR', 'USD', 'EUR', 'BRL', 'AOA'].includes((currentPublishing.settings.currency || 'ZAR').toUpperCase()) ? currentPublishing.settings.currency : 'ZAR'}
                  onChange={(e) => handleToggleSetting('currency', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-semibold"
                >
                  <option value="ZAR">ZAR · South African rand</option>
                  <option value="USD">USD · US dollar</option>
                  <option value="EUR">EUR · Euro</option>
                  <option value="BRL">BRL · Brazilian real</option>
                  <option value="AOA">AOA · Angolan kwanza</option>
                </select>
              </div>

              {/* Mandatory client confidentiality: internal notes and supplier cost data are never projected */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">Internal Notes Protection · Always On</span>
                  <span className="text-emerald-800 text-[11px]">Supplier net costs, commercial margins and internal operational notes are excluded from client-facing data.</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase">Protected</span>
              </div>

              {/* Setting 5: Allow Offline Access */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Offline Mode Access</span>
                  <span className="text-slate-500 text-[11px]">Allow travellers to view cached schedules without mobile data in remote safari camps</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(currentPublishing.settings.enableOfflineAccess !== false)}
                  onChange={(e) => handleToggleSetting('enableOfflineAccess', e.target.checked)}
                  className="rounded text-[#10233F] focus:ring-[#D4AF37] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Setting 6: Allow Downloads */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Allow Client PDF Downloads</span>
                  <span className="text-slate-500 text-[11px]">Show the Save PDF control on the client itinerary.</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(currentPublishing.settings.allowDownloads !== false)}
                  onChange={(e) => handleToggleSetting('allowDownloads', e.target.checked)}
                  className="rounded text-[#10233F] focus:ring-[#D4AF37] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Setting 7: Allow Printing */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Allow Client Printing</span>
                  <span className="text-slate-500 text-[11px]">Show the Print control on the client itinerary. Browser-level printing cannot be fully prevented.</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(currentPublishing.settings.allowPrinting !== false)}
                  onChange={(e) => handleToggleSetting('allowPrinting', e.target.checked)}
                  className="rounded text-[#10233F] focus:ring-[#D4AF37] w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Setting 8: Supplier Details Visibility */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Show Supplier Details to Client</span>
                  <span className="text-slate-500 text-[11px]">When enabled, only supplier name and contact are shared; internal rates and notes remain hidden.</span>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(currentPublishing.settings.showSupplierDetails)}
                  onChange={(e) => handleToggleSetting('showSupplierDetails', e.target.checked)}
                  className="rounded text-[#10233F] focus:ring-[#D4AF37] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Publishing Version History */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock size={16} className="text-[#10233F]" />
              <h3 className="text-sm font-bold text-slate-900">Publishing Version Audit History</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(currentPublishing.versions || []).map((ver, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">Version {ver.version}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {ver.status}
                      </span>
                      <span className="text-slate-400 text-[11px]">{ver.date}</span>
                    </div>
                    <p className="text-slate-600">{ver.note}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">v{ver.version}.0</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PHYSICAL PRINT & PDF QUALITY CONTROL STUDIO */}
      {activeHubTab === 'pdf-qc' && (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 pt-6 overflow-x-auto">
          {/* Status & QC Bar */}
          {mode === 'client-editorial' && (
            <div className="mb-4 bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">
                  Strict Architectural Layout: 1 Hero Image + 1 Supporting Image + 2 Verified Paragraphs per page
                </span>
              </div>
              <div className="flex items-center gap-2">
                {insufficientPagesCount > 0 ? (
                  <span className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg font-bold">
                    ⚠ {insufficientPagesCount} page(s) flagged for short copy (zero fabricated text)
                  </span>
                ) : (
                  <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg font-bold">
                    ✓ 100% Content & Image QC Pass
                  </span>
                )}
                {exportStatus && (
                  <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{exportStatus}</span>
                )}
              </div>
            </div>
          )}

          <div ref={printContainerRef} className="space-y-8">
            {/* MODE 1: CLIENT EDITORIAL ITINERARY (Strict 1 Hero + 1 Supporting + 2 Paragraphs) */}
            {mode === 'client-editorial' &&
              visibleEditorialPages.map((page) => (
                <ClientEditorialPage
                  key={page.pageNumber}
                  page={page}
                  showOperatorWarnings={true}
                  onEditParagraphs={handleEditPageParagraphs}
                />
              ))}

            {/* MODE 2: DRIVER PICKUP BOARD (Public-Safe, Zero Financials) */}
            {mode === 'driver-pickup-board' && (
              <article
                className="viemma-pdf-page viemma-welcome-placard bg-white text-slate-900 border border-slate-300 mx-auto flex flex-col justify-between"
                style={{ width: '297mm', height: '210mm', minHeight: '210mm', padding: '12mm 15mm' }}
              >
                <main className="flex-1 flex flex-col items-center justify-center text-center px-8 py-8">
                  <p className="text-base sm:text-lg font-medium text-slate-700 tracking-[0.12em] mb-3">WELCOME</p>
                  <h2 className="w-full text-5xl sm:text-6xl font-semibold text-slate-950 leading-tight break-words">
                    {placardGuestName}
                  </h2>
                  {welcomePlacard.showAgencyName && welcomePlacard.agencyName.trim() && (
                    <p className="mt-2 text-xs text-slate-600">{welcomePlacard.agencyName.trim()}</p>
                  )}
                </main>

                <footer className="border-t border-slate-300 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs sm:text-sm">
                    <div>
                      <span className="block text-xs text-slate-500">Flight number</span>
                      <span className="font-semibold text-slate-900">{placardFlight?.flightNumber || 'To be confirmed'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Collection time</span>
                      <span className="font-semibold text-slate-900">{scopedTransfers[0]?.pickupTime || 'To be confirmed'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Arrival time</span>
                      <span className="font-semibold text-slate-900">{placardFlight?.arrivalTime || 'To be confirmed'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Hotel / destination</span>
                      <span className="font-semibold text-slate-900">{placardHotelOrDestination || 'To be confirmed'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-200 text-center text-sm font-semibold text-slate-800">
                    {printGroup.travellers.length} passenger{printGroup.travellers.length === 1 ? '' : 's'}
                  </div>
                </footer>
              </article>
            )}

            {/* MODE 3: OPERATOR GROUND SHEET (Full Manifest & Internal Notes) */}
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
                        {printGroup.tripId} — {printGroup.groupName}
                      </h1>
                    </div>
                    <div className="text-right text-xs text-slate-600">
                      <div>Lead: {printGroup.travellers.find(t => t.id === printGroup.leadTravellerId)?.fullName || 'Unassigned'}</div>
                      <div>Total Pax: {printGroup.travellers.length}</div>
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
                        {printGroup.travellers.map((t) => (
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
                    {scopedHotels.length === 0 ? (
                      <p className="text-xs text-slate-500">No hotel bookings recorded.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {scopedHotels.map((h) => (
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

                  {/* Ground Transfers & Operations */}
                  <div className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      3. Ground Logistics & Flight Connections
                    </h2>
                    {scopedTransfers.length === 0 ? (
                      <p className="text-xs text-slate-500">No ground transfers scheduled.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {scopedTransfers.map((tr) => (
                          <div key={tr.id} className="p-2 border border-slate-200 rounded flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-900">{tr.pickupTime}</span> — {tr.pickupLocation} → {tr.dropoffLocation}
                              {tr.pickupSignText && (
                                <span className="block text-[11px] text-slate-500">Sign: "{tr.pickupSignText}"</span>
                              )}
                            </div>
                            <span className="font-mono text-slate-600">{tr.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Scheduled activities with groups and resources */}
                  <div className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">4. Scheduled Activities & Group Assignments</h2>
                    {scopedActivities.filter(a => a.status !== 'Cancelled').length === 0 ? (
                      <p className="text-xs text-slate-500">No active activities assigned to this programme scope.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {scopedActivities.filter(a => a.status !== 'Cancelled').slice().sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(activity => (
                          <div key={activity.id} className="p-2.5 border border-slate-200 rounded">
                            <div className="flex flex-wrap justify-between gap-2"><strong className="text-slate-900">{activity.startTime}{activity.endTime ? `–${activity.endTime}` : ''} — {activity.title}</strong><span className="text-slate-500">{activity.date}</span></div>
                            <div className="text-slate-700 mt-1">Venue: {activity.venue || activity.location || 'Not confirmed'}</div>
                            <div className="text-slate-600 mt-0.5">Group(s): {(activity.groupNames || []).join(', ') || printGroup.groupName}</div>
                            <div className="text-slate-600 mt-0.5">Responsible: {activity.responsiblePerson || 'Not assigned'} · Driver: {activity.driverName || 'Not assigned'} · Vehicle: {activity.vehicleName || 'Not assigned'}</div>
                            {activity.internalNotes && <div className="text-rose-800 mt-1">Internal notes: {activity.internalNotes}</div>}
                            {activity.cost !== undefined && <div className="text-slate-600 mt-0.5">Recorded activity cost: R {activity.cost.toLocaleString('en-ZA')}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <footer className="pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                  <span>{printGroup.tripId} • Internal Operator Ground Sheet</span>
                  <span className="font-mono">Operator schedule · selected scope</span>
                </footer>
              </article>
            )}
            {/* MODE 4: FINAL FINANCIAL AUDIT — explicit summary page plus paginated reconciliation */}
            {mode === 'financial-audit' && (
              financialAudit ? (
                <>
                  <article
                    className="viemma-pdf-page bg-white text-slate-900 border border-slate-200 shadow-md mx-auto flex flex-col"
                    style={{ width: '210mm', minHeight: '297mm', padding: '15mm 16mm' }}
                  >
                    <header className="border-b-2 border-[#1A3326] pb-4 mb-5 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-rose-700">Confidential · Internal Finance</span>
                        <h1 className="text-2xl font-bold text-[#1A3326] mt-1">Final Financial Audit</h1>
                        <p className="text-xs text-slate-600 mt-1">{props.state?.title || group.groupName} · {group.tripId}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{group.defaults.startDate || 'Start date TBC'} to {group.defaults.endDate || 'End date TBC'} · Generated {new Date().toLocaleDateString('en-ZA')}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500 shrink-0">
                        <div className="font-bold text-slate-900">Base currency: ZAR</div>
                        <div>Cancelled services excluded</div>
                      </div>
                    </header>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        { label: 'Operating cost', value: financialAudit.totalCost },
                        { label: 'Estimated selling price', value: financialAudit.sellingPrice },
                        { label: financialAudit.netProfit < 0 ? 'Projected loss' : 'Projected net profit', value: financialAudit.netProfit },
                        { label: 'Agent commission', value: financialAudit.commission },
                      ].map(item => (
                        <div key={item.label} className="border border-slate-200 rounded-xl p-3">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">{item.label}</span>
                          <strong className="text-lg text-[#1A3326] mt-1 block">R {item.value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      ))}
                    </div>

                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Cost by service category</h2>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 mb-5 text-xs">
                      {[
                        { label: 'Flights', value: financialAudit.flightCost },
                        { label: 'Transfers, tolls and parking', value: financialAudit.transferCost },
                        { label: 'Accommodation', value: financialAudit.accommodationCost },
                        { label: 'Activities', value: financialAudit.activityCost },
                      ].map(item => (
                        <div key={item.label} className="p-3 flex items-center justify-between gap-4">
                          <span className="text-slate-600">{item.label}</span>
                          <strong className="text-slate-900">R {item.value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      ))}
                      <div className="p-3 flex items-center justify-between gap-4 bg-slate-50 font-bold">
                        <span>Operating cost subtotal</span>
                        <strong>R {financialAudit.totalCost.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </div>
                    </div>

                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Commercial calculation</h2>
                    <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 text-xs">
                      <div className="p-3 flex justify-between gap-4"><span className="text-slate-600">Markup</span><strong>R {financialAudit.markup.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</strong></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-slate-600">Payment processing fee</span><strong>R {financialAudit.processingFee.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</strong></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-slate-600">Buffer</span><strong>R {(props.state?.finance.buffer || 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</strong></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-slate-600">Discount</span><strong>− R {(props.state?.finance.discount || 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</strong></div>
                      <div className="p-3 flex justify-between gap-4 bg-slate-50 font-bold"><span>Estimated selling price</span><strong>R {financialAudit.sellingPrice.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</strong></div>
                      <div className={`p-3 flex justify-between gap-4 font-bold ${financialAudit.netProfit < 0 ? 'text-rose-800' : 'text-emerald-800'}`}><span>{financialAudit.netProfit < 0 ? 'Projected loss after commission' : 'Projected net profit after commission'}</span><strong>R {financialAudit.netProfit.toLocaleString('en-ZA', { maximumFractionDigits: 2 })}</strong></div>
                    </div>

                    <p className="text-[9px] leading-relaxed text-slate-500 mt-auto pt-5">Audit basis: saved service costs and the finance settings in effect when this report was generated. Figures remain estimates unless reconciled against supplier invoices and actual payments. This report does not claim to be a completed statutory or external audit.</p>
                    <footer className="pt-3 mt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                      <span>{group.tripId} · Confidential Financial Audit</span>
                      <span>Summary · Page 1</span>
                    </footer>
                  </article>

                  {Array.from({ length: Math.max(1, Math.ceil(financialAudit.rows.length / 14)) }).map((_, pageIndex) => {
                    const pageRows = financialAudit.rows.slice(pageIndex * 14, (pageIndex + 1) * 14);
                    const detailPages = Math.max(1, Math.ceil(financialAudit.rows.length / 14));
                    return (
                      <article
                        key={`financial-audit-detail-${pageIndex + 1}`}
                        className="viemma-pdf-page bg-white text-slate-900 border border-slate-200 shadow-md mx-auto flex flex-col"
                        style={{ width: '210mm', minHeight: '297mm', padding: '15mm 16mm' }}
                      >
                        <header className="border-b border-slate-300 pb-3 mb-4 flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-700">Confidential · Internal Finance</span>
                            <h2 className="text-lg font-bold text-[#1A3326] mt-1">Service-level Reconciliation</h2>
                            <p className="text-[10px] text-slate-500 mt-1">{props.state?.title || group.groupName} · {group.tripId}</p>
                          </div>
                          <span className="text-[10px] text-slate-500">Detail page {pageIndex + 2} of {detailPages + 1}</span>
                        </header>

                        {financialAudit.rows.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">No service cost records have been entered for this trip.</p>
                        ) : (
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-slate-100 border-y border-slate-300">
                                <th className="py-2 px-2">Category</th>
                                <th className="py-2 px-2">Date / Day</th>
                                <th className="py-2 px-2">Description</th>
                                <th className="py-2 px-2">Status</th>
                                <th className="py-2 px-2 text-right">Cost (ZAR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {pageRows.map(row => (
                                <tr key={row.id} className={row.excluded ? 'text-slate-400' : 'text-slate-700'}>
                                  <td className="py-2 px-2 font-semibold">{row.category}</td>
                                  <td className="py-2 px-2">{row.date}</td>
                                  <td className="py-2 px-2">{row.description}</td>
                                  <td className="py-2 px-2">{row.excluded ? `${row.status} · excluded from cost` : row.status}</td>
                                  <td className="py-2 px-2 text-right whitespace-nowrap">{row.excluded ? 'R 0.00' : `R ${row.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        <footer className="mt-auto pt-3 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                          <span>{group.tripId} · Internal Service Reconciliation</span>
                          <span>Page {pageIndex + 2} of {detailPages + 1}</span>
                        </footer>
                      </article>
                    );
                  })}
                </>
              ) : (
                <article className="viemma-pdf-page bg-white p-8 text-rose-800 border border-rose-200 rounded-xl mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
                  <h1 className="text-xl font-bold">Financial data unavailable</h1>
                  <p className="text-sm mt-2">Reopen the Print Hub from the active trip workspace.</p>
                </article>
              )
            )}

          </div>
        </div>
      )}
    </div>
  );
};
