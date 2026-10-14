// Viemma Tours - Trip Reference Generator & Sequence Utilities
// Follows VT-YYYY-SEQ standard convention (e.g. VT-2026-001, VT-2026-002, etc.)

import { AppState } from '../types';

/**
 * Generates the next sequential trip reference following the VT-2026-XXX standard.
 * Inspects all existing trips to ensure uniqueness and preserve sequence.
 */
export function generateNextTripReference(existingTrips: (AppState | { ref?: string })[] = []): string {
  const currentYear = 2026;
  const prefix = `VT-${currentYear}-`;

  const existingRefs = new Set<string>();
  const sequentialNumbers: number[] = [];

  for (const t of existingTrips) {
    if (!t?.ref) continue;
    existingRefs.add(t.ref.trim());

    // Matches VT-2026-001, VT-2026-1048, etc.
    const match = t.ref.trim().match(/^VT-(\d{4})-(\d+)$/i);
    if (match && parseInt(match[1], 10) === currentYear) {
      const num = parseInt(match[2], 10);
      if (!isNaN(num) && num < 1000) {
        // Track 3-digit operational sequence
        sequentialNumbers.push(num);
      }
    }
  }

  // Determine next sequence starting from 1
  let nextSeq = 1;
  if (sequentialNumbers.length > 0) {
    nextSeq = Math.max(...sequentialNumbers) + 1;
  }

  let candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  while (existingRefs.has(candidate)) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  return candidate;
}
