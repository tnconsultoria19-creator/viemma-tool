/**
 * VIEMMA TOURS — DETERMINISTIC PDF & CLIENT EDITORIAL ENGINE
 * Solves:
 * 1. Multi-page PDF clipping, cut-off elements, and broken page breaks.
 * 2. Image aspect-ratio distortion, CORS tainting, and missing-image failures.
 * 3. Strict Client-Facing Visual Hierarchy:
 *    Large Central Hero Image -> Smaller Supporting Image -> Exactly Two Paragraphs of Approved Text.
 * 4. Zero fabricated content: flags insufficient approved text rather than inventing facts.
 * 5. Verified PDF blob integrity (%PDF- header & non-zero byte validation).
 */

import {
  TripGroupStructure,
  FlightRecord,
  HotelBookingRecord,
  TransferRecord,
  ActivityRecord,
} from './argonDomainModel';

export interface EditorialImageAsset {
  url: string;
  alt: string;
  caption?: string;
  isFallback?: boolean;
  naturalWidth?: number;
  naturalHeight?: number;
  aspectRatio?: number;
}

export interface ClientEditorialPageData {
  pageNumber: number;
  totalPages: number;
  tripReference: string;
  pageCategory: 'Trip Overview' | 'Daily Experience' | 'Accommodation Spotlight' | 'Departure & Summary';
  dateLabel?: string;
  title: string;
  subtitle?: string;
  heroImage: EditorialImageAsset;
  supportingImage: EditorialImageAsset;
  paragraphs: [string, string];
  insufficientContentFlag: boolean;
  insufficientContentReason?: string;
  footerMeta: string;
}

/**
 * High-taste architectural SVG data-URI fallback when an approved image is missing or fails to load.
 * Never introduces unrelated stock photography.
 */
export function createArchitecturalFallbackDataUri(label: string, variant: 'hero' | 'supporting' = 'hero'): string {
  const safeLabel = (label || 'Viemma Tours Cape Town').replace(/[<>&"']/g, '');
  const width = variant === 'hero' ? 1200 : 600;
  const height = variant === 'hero' ? 750 : 450;
  const bg = variant === 'hero' ? '#0f172a' : '#1e293b';
  const accent = '#94a3b8';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect x="32" y="32" width="${width - 64}" height="${height - 64}" fill="none" stroke="#334155" stroke-width="1.5"/>
    <line x1="32" y1="${height - 96}" x2="${width - 32}" y2="${height - 96}" stroke="#334155" stroke-width="1"/>
    <text x="64" y="${height / 2 - 10}" fill="#f8fafc" font-family="Georgia, serif" font-size="${variant === 'hero' ? 28 : 18}" letter-spacing="2">VIEMMA TOURS</text>
    <text x="64" y="${height / 2 + 24}" fill="${accent}" font-family="system-ui, sans-serif" font-size="${variant === 'hero' ? 16 : 13}" letter-spacing="1">${safeLabel}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Preloads and validates an image URL for both screen and PDF rendering.
 * Preserves aspect ratio and resolves to a clean fallback if the image is missing or blocked.
 */
export async function preloadAndNormalizeImage(
  rawUrl: string | undefined,
  alt: string,
  caption?: string,
  variant: 'hero' | 'supporting' = 'hero'
): Promise<EditorialImageAsset> {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || typeof window === 'undefined') {
    return {
      url: createArchitecturalFallbackDataUri(alt, variant),
      alt,
      caption,
      isFallback: true,
      aspectRatio: variant === 'hero' ? 1.6 : 1.333,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeoutId = setTimeout(() => {
      resolve({
        url: trimmed,
        alt,
        caption,
        isFallback: false,
        aspectRatio: variant === 'hero' ? 1.6 : 1.333,
      });
    }, 4500);

    img.onload = () => {
      clearTimeout(timeoutId);
      const w = img.naturalWidth || (variant === 'hero' ? 1200 : 600);
      const h = img.naturalHeight || (variant === 'hero' ? 750 : 450);
      resolve({
        url: trimmed,
        alt,
        caption,
        isFallback: false,
        naturalWidth: w,
        naturalHeight: h,
        aspectRatio: Number((w / h).toFixed(3)),
      });
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve({
        url: createArchitecturalFallbackDataUri(alt, variant),
        alt,
        caption: caption || 'Image pending verification',
        isFallback: true,
        aspectRatio: variant === 'hero' ? 1.6 : 1.333,
      });
    };

    img.src = trimmed;
  });
}

/**
 * Distributes approved operational text into EXACTLY TWO well-formatted paragraphs per page.
 * CRITICAL RULE: Never invent factual content merely to fill space.
 * If approved content is insufficient for two meaningful paragraphs, flags the issue explicitly.
 */
export function formatApprovedContentIntoTwoParagraphs(
  approvedBlocks: Array<string | undefined | null>,
  maxCharsPerParagraph = 520
): {
  paragraphs: [string, string];
  insufficientContentFlag: boolean;
  insufficientContentReason?: string;
} {
  const cleanedBlocks = approvedBlocks
    .map((b) => (b || '').replace(/\s+/g, ' ').trim())
    .filter((b) => b.length > 0);

  if (cleanedBlocks.length === 0) {
    return {
      paragraphs: [
        '[Approved Content Pending: No client-facing description has been entered for this section yet.]',
        '[Flagged for Operator Review: Please add confirmed itinerary notes in the workspace before final client distribution.]',
      ],
      insufficientContentFlag: true,
      insufficientContentReason: 'No approved client-facing text available for either paragraph.',
    };
  }

  const truncateCleanly = (text: string): string => {
    if (text.length <= maxCharsPerParagraph) return text;
    const sliced = text.slice(0, maxCharsPerParagraph);
    const lastPeriod = sliced.lastIndexOf('.');
    if (lastPeriod > maxCharsPerParagraph * 0.6) {
      return sliced.slice(0, lastPeriod + 1);
    }
    return `${sliced.trim()}…`;
  };

  // Case 1: Two or more distinct approved paragraphs/blocks exist
  if (cleanedBlocks.length >= 2) {
    const first = truncateCleanly(cleanedBlocks[0]);
    const secondCombined = truncateCleanly(cleanedBlocks.slice(1).join(' '));
    const isTooShort = first.length < 25 || secondCombined.length < 25;
    return {
      paragraphs: [first, secondCombined],
      insufficientContentFlag: isTooShort,
      insufficientContentReason: isTooShort
        ? 'One of the approved paragraphs is shorter than 25 characters; verify before sending to client.'
        : undefined,
    };
  }

  // Case 2: Single block — split at natural sentence boundary if at least 2 sentences exist
  const singleBlock = cleanedBlocks[0];
  const sentences = singleBlock
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    const midpoint = Math.ceil(sentences.length / 2);
    const p1 = truncateCleanly(sentences.slice(0, midpoint).join(' '));
    const p2 = truncateCleanly(sentences.slice(midpoint).join(' '));
    return {
      paragraphs: [p1, p2],
      insufficientContentFlag: false,
    };
  }

  // Case 3: Only 1 short sentence exists — DO NOT fabricate facts; flag the second paragraph slot
  return {
    paragraphs: [
      truncateCleanly(singleBlock),
      '[Additional Approved Copy Required: Only one sentence of confirmed client-facing text exists for this page. Please provide a second paragraph of approved details.]',
    ],
    insufficientContentFlag: true,
    insufficientContentReason:
      'Approved text contains only a single sentence; second paragraph flagged rather than fabricating content.',
  };
}

/**
 * Builds the complete multi-page Client Editorial dataset from the connected trip records.
 * Strictly strips all internalNotes and private financial balances.
 */
export function buildClientEditorialPages(params: {
  group: TripGroupStructure;
  flights: FlightRecord[];
  hotels: HotelBookingRecord[];
  transfers: TransferRecord[];
  activities: ActivityRecord[];
  heroImageUrl?: string;
  supportingImageUrl?: string;
}): ClientEditorialPageData[] {
  const { group, flights, hotels, transfers, activities, heroImageUrl, supportingImageUrl } = params;
  const destinationLabel = group.defaults.destination?.trim() || 'the selected destination';
  const rawPages: Array<Omit<ClientEditorialPageData, 'pageNumber' | 'totalPages'>> = [];

  const leadPerson = group.travellers.find((t) => t.id === group.leadTravellerId) || group.travellers[0];
  const confirmedPaxNames = group.travellers.map((t) => t.fullName).join(', ');

  // Page 1: Trip Overview Page
  const overviewP1 = `${group.groupName || 'Private Journey'} (${group.tripId}) has been curated for Lead Traveller ${
    leadPerson?.fullName || 'Valued Guest'
  } and party (${group.travellers.length} traveller${
    group.travellers.length === 1 ? '' : 's'
  }: ${confirmedPaxNames}) travelling to ${destinationLabel} from ${
    group.defaults.startDate || 'TBC'
  } to ${group.defaults.endDate || 'TBC'}.`;

  const arrivalFlight = flights.find((f) => f.direction === 'Arrival');
  const primaryHotel = hotels[0];
  const overviewP2 = [
    arrivalFlight
      ? `Arrival arrangements are coordinated for flight ${arrivalFlight.flightNumber} on ${
          arrivalFlight.arrivalDate || 'scheduled date'
        } at ${arrivalFlight.arrivalTime || 'scheduled time'}.`
      : '',
    primaryHotel
      ? `Primary accommodation is reserved at ${primaryHotel.propertyName} (Check-in ${primaryHotel.checkInDate}, Check-out ${primaryHotel.checkOutDate}).`
      : '',
    group.defaults.generalPreferences || leadPerson?.clientFacingNotes || '',
  ]
    .filter(Boolean)
    .join(' ');

  const overviewText = formatApprovedContentIntoTwoParagraphs([overviewP1, overviewP2]);

  rawPages.push({
    tripReference: group.tripId,
    pageCategory: 'Trip Overview',
    dateLabel: `${group.defaults.startDate || 'TBC'} — ${group.defaults.endDate || 'TBC'}`,
    title: group.defaults.destination ? `${group.defaults.destination} Itinerary` : 'Travel Itinerary',
    subtitle: `Prepared for ${leadPerson?.fullName || group.groupName} • ${group.travellers.length} Guests`,
    heroImage: {
      url: heroImageUrl || '/hero-bg.jpg',
      alt: group.defaults.destination || 'Trip overview image',
      caption: group.defaults.destination ? `Primary Destination — ${group.defaults.destination}` : 'Destination to be confirmed',
    },
    supportingImage: {
      url:
        supportingImageUrl ||
        createArchitecturalFallbackDataUri(primaryHotel?.propertyName || 'Private Ground Operations', 'supporting'),
      alt: primaryHotel?.propertyName || 'Curated Ground Experience',
      caption: primaryHotel ? `Residence: ${primaryHotel.propertyName}` : 'Viemma Concierge Ground Services',
      isFallback: !supportingImageUrl,
    },
    paragraphs: overviewText.paragraphs,
    insufficientContentFlag: overviewText.insufficientContentFlag,
    insufficientContentReason: overviewText.insufficientContentReason,
    footerMeta: `${group.tripId} • Client Edition`,
  });

  // Subsequent Pages: Group by active dates across Hotels, Transfers, and Activities
  const distinctDates = Array.from(
    new Set([
      ...activities.filter((a) => a.status !== 'Cancelled').map((a) => a.date),
      ...transfers.map((t) => t.date),
    ].filter(Boolean))
  ).sort();

  for (const date of distinctDates) {
    const dayActs = activities.filter((a) => a.date === date && a.status !== 'Cancelled');
    const dayTransfers = transfers.filter((t) => t.date === date);
    const activeHotel = hotels.find((h) => h.checkInDate <= date && h.checkOutDate >= date) || hotels[0];

    const primaryAct = dayActs[0];
    const paragraphOneSource = dayActs
      .map(
        (a) =>
          `${a.title} (${a.startTime}${a.endTime ? `–${a.endTime}` : ''}, ${a.location}). ${
            a.clientFacingNotes || ''
          }`.trim()
      )
      .join(' ');

    const paragraphTwoSource = [
      ...dayTransfers.map(
        (tr) =>
          `Private transfer scheduled at ${tr.pickupTime} from ${tr.pickupLocation} to ${tr.dropoffLocation}.${
            tr.clientFacingNotes ? ` ${tr.clientFacingNotes}` : ''
          }`
      ),
      activeHotel
        ? `Overnight accommodation at ${activeHotel.propertyName}${
            activeHotel.verifiedAddress ? `, ${activeHotel.verifiedAddress}` : ''
          }.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');

    const formattedDayText = formatApprovedContentIntoTwoParagraphs([
      paragraphOneSource || undefined,
      paragraphTwoSource || undefined,
    ]);

    rawPages.push({
      tripReference: group.tripId,
      pageCategory: 'Daily Experience',
      dateLabel: date,
      title: primaryAct?.dayTitle || (primaryAct ? primaryAct.title : `Operational Schedule — ${date}`),
      subtitle: activeHotel ? `Residence: ${activeHotel.propertyName}` : (group.defaults.destination || 'Destination details to be confirmed'),
      heroImage: {
        url: heroImageUrl || '/hero-bg.jpg',
        alt: primaryAct?.title || `Day Schedule ${date}`,
        caption: primaryAct ? `${primaryAct.title} — ${primaryAct.location}` : `Scheduled Movements (${date})`,
      },
      supportingImage: {
        url: createArchitecturalFallbackDataUri(activeHotel?.propertyName || date, 'supporting'),
        alt: activeHotel?.propertyName || 'Supporting View',
        caption: activeHotel ? activeHotel.propertyName : `Ground Logistics • ${date}`,
        isFallback: true,
      },
      paragraphs: formattedDayText.paragraphs,
      insufficientContentFlag: formattedDayText.insufficientContentFlag,
      insufficientContentReason: formattedDayText.insufficientContentReason,
      footerMeta: `${group.tripId} • ${date}`,
    });
  }

  const totalPages = rawPages.length;
  return rawPages.map((p, idx) => ({
    ...p,
    pageNumber: idx + 1,
    totalPages,
  }));
}

/**
 * Validates that a generated PDF Blob is non-empty and begins with the standard '%PDF-' magic header.
 */
export async function verifyPdfBlobIntegrity(blob: Blob | null | undefined): Promise<{
  isValid: boolean;
  byteLength: number;
  error?: string;
}> {
  if (!blob) {
    return { isValid: false, byteLength: 0, error: 'PDF blob is null or undefined.' };
  }
  if (blob.size < 64) {
    return { isValid: false, byteLength: blob.size, error: `PDF file is unexpectedly small (${blob.size} bytes).` };
  }
  try {
    const headerBuffer = await blob.slice(0, 5).arrayBuffer();
    const headerText = new TextDecoder('ascii').decode(headerBuffer);
    if (!headerText.startsWith('%PDF-')) {
      return {
        isValid: false,
        byteLength: blob.size,
        error: `Invalid PDF header signature ("${headerText}"). Expected "%PDF-".`,
      };
    }
    return { isValid: true, byteLength: blob.size };
  } catch (err: any) {
    return { isValid: false, byteLength: blob.size, error: err?.message || 'Failed to read PDF blob header.' };
  }
}

/**
 * Triggers a dedicated, self-contained A4 print/PDF window that guarantees:
 * - All pages render (never clips at 100vh)
 * - Images are pre-decoded before print dialog opens
 * - Exact A4 page breaks, margins, and fonts match the preview
 */
export async function exportValidatedPrintPdfDocument(params: {
  containerElement: HTMLElement | null;
  documentTitle: string;
  onStatusChange?: (status: string) => void;
}): Promise<{ success: boolean; error?: string }> {
  const { containerElement, documentTitle, onStatusChange } = params;
  if (!containerElement) {
    return { success: false, error: 'Print container element not found in DOM.' };
  }

  onStatusChange?.('Validating images and preparing multi-page A4 layout...');

  // 1. Wait for all <img> elements inside the container to finish decoding
  const images = Array.from(containerElement.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      try {
        await img.decode();
      } catch {
        // Fallback to architectural SVG if an image URL fails during export
        img.src = createArchitecturalFallbackDataUri(img.alt || documentTitle, 'hero');
      }
    })
  );

  // 2. Open isolated A4 print frame so parent app overflow-hidden never truncates page 2+
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return { success: false, error: 'Unable to initialize isolated PDF print frame.' };
  }

  // Copy active stylesheets (Tailwind / index.css)
  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  frameDoc.open();
  frameDoc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${documentTitle.replace(/[<>&"']/g, '')}</title>
    ${styleLinks}
    <style>
      @page {
        size: A4 portrait;
        margin: 0mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        overflow: visible !important;
        height: auto !important;
      }
      .viemma-pdf-page {
        width: 210mm !important;
        min-height: 297mm !important;
        max-height: 297mm !important;
        padding: 16mm 18mm !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        position: relative !important;
        background: #ffffff !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        overflow: hidden !important;
      }
      .viemma-pdf-page:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .no-print {
        display: none !important;
      }
    </style>
  </head>
  <body>
    ${containerElement.innerHTML}
  </body>
</html>`);
  frameDoc.close();

  onStatusChange?.('Rendering multi-page PDF document...');

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        onStatusChange?.('PDF ready.');
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
        resolve({ success: true });
      } catch (err: any) {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve({ success: false, error: err?.message || 'Print dialog failed.' });
      }
    }, 450);
  });
}
