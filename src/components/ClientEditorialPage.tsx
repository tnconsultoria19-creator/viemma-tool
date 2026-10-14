import React, { useState } from 'react';
import {
  ClientEditorialPageData,
  createArchitecturalFallbackDataUri,
} from '../utils/pdfExportEngine';

interface ClientEditorialPageProps {
  page: ClientEditorialPageData;
  showOperatorWarnings?: boolean;
  onEditParagraphs?: (pageNumber: number, nextParagraphs: [string, string]) => void;
}

/**
 * MANDATORY CLIENT-FACING VISUAL LAYOUT COMPONENT
 * Visual Hierarchy enforced on every page:
 * 1. One Large Central Hero Image (dominant focal point, 16:10 proportion, never distorted)
 * 2. One Smaller Supporting Image (complementary offset position, 4:3 proportion, non-competing)
 * 3. Exactly Two Paragraphs of Approved Text (editorial spacing, comfortable 65ch line length)
 */
export const ClientEditorialPage: React.FC<ClientEditorialPageProps> = ({
  page,
  showOperatorWarnings = true,
  onEditParagraphs,
}) => {
  const [heroSrc, setHeroSrc] = useState(page.heroImage.url);
  const [supportSrc, setSupportSrc] = useState(page.supportingImage.url);
  const [isEditingText, setIsEditingText] = useState(false);
  const [draftP1, setDraftP1] = useState(page.paragraphs[0]);
  const [draftP2, setDraftP2] = useState(page.paragraphs[1]);

  const handleSaveText = (e: React.FormEvent) => {
    e.preventDefault();
    onEditParagraphs?.(page.pageNumber, [draftP1.trim(), draftP2.trim()]);
    setIsEditingText(false);
  };

  return (
    <article
      className="viemma-pdf-page bg-white text-slate-900 border border-slate-200 shadow-md mx-auto flex flex-col justify-between"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 18mm',
        boxSizing: 'border-box',
      }}
      aria-label={`Client Page ${page.pageNumber} of ${page.totalPages}`}
    >
      {/* Top Editorial Running Header */}
      <div>
        <header className="flex items-baseline justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-slate-500">
              VIEMMA TOURS • PRIVATE JOURNEY
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-mono font-semibold text-slate-800">
              {page.tripReference}
            </span>
          </div>
          {page.dateLabel && (
            <span className="text-[11px] font-medium text-slate-600 tracking-wide">
              {page.dateLabel}
            </span>
          )}
        </header>

        {/* Page Title & Subtitle */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-amber-800 font-semibold mb-1">
            {page.pageCategory}
          </div>
          <h1
            className="text-2xl sm:text-[26px] font-normal text-slate-900 leading-tight tracking-tight"
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-xs text-slate-600 mt-1 font-medium">{page.subtitle}</p>
          )}
        </div>

        {/* ELEMENT 1: ONE LARGE CENTRAL HERO IMAGE (Dominant Focal Point) */}
        <figure className="mb-6">
          <div
            className="w-full overflow-hidden rounded-sm bg-slate-900 border border-slate-200 relative"
            style={{ height: '98mm' }}
          >
            <img
              src={heroSrc}
              alt={page.heroImage.alt}
              onError={() =>
                setHeroSrc(createArchitecturalFallbackDataUri(page.heroImage.alt, 'hero'))
              }
              className="w-full h-full object-cover object-center block"
            />
          </div>
          {page.heroImage.caption && (
            <figcaption className="mt-1.5 text-[10px] text-slate-500 tracking-wide flex items-center justify-between">
              <span>{page.heroImage.caption}</span>
              <span className="uppercase font-mono text-[9px] text-slate-400">Primary View</span>
            </figcaption>
          )}
        </figure>

        {/* ELEMENT 2 (SMALLER SUPPORTING IMAGE) + ELEMENT 3 (TWO PARAGRAPHS OF TEXT) */}
        <div className="grid grid-cols-12 gap-6 items-start mt-2">
          {/* Smaller Supporting Image in Complementary Left Column (4 cols = 1/3 width, never competing with Hero) */}
          <figure className="col-span-4">
            <div
              className="w-full overflow-hidden rounded-sm bg-slate-800 border border-slate-200"
              style={{ height: '46mm' }}
            >
              <img
                src={supportSrc}
                alt={page.supportingImage.alt}
                onError={() =>
                  setSupportSrc(
                    createArchitecturalFallbackDataUri(page.supportingImage.alt, 'supporting')
                  )
                }
                className="w-full h-full object-cover object-center block"
              />
            </div>
            {page.supportingImage.caption && (
              <figcaption className="mt-1.5 text-[10px] text-slate-500 leading-snug">
                {page.supportingImage.caption}
              </figcaption>
            )}

            {/* Operator Warning Badge (Non-printing) if approved text is insufficient */}
            {showOperatorWarnings && page.insufficientContentFlag && (
              <div className="no-print mt-3 p-2.5 rounded bg-amber-50 border border-amber-300 text-[10px] text-amber-900 leading-relaxed">
                <div className="font-semibold uppercase tracking-wider mb-0.5">
                  Content Review Needed
                </div>
                <p>{page.insufficientContentReason}</p>
                {onEditParagraphs && !isEditingText && (
                  <button
                    type="button"
                    onClick={() => setIsEditingText(true)}
                    className="mt-1.5 px-2 py-1 bg-amber-800 text-white rounded font-medium hover:bg-amber-900"
                  >
                    Supply Approved Copy
                  </button>
                )}
              </div>
            )}
          </figure>

          {/* Two Well-Formatted Paragraphs in Right Editorial Column (8 cols = 2/3 width, comfortable line length) */}
          <div className="col-span-8">
            {isEditingText ? (
              <form onSubmit={handleSaveText} className="no-print space-y-3 bg-slate-50 p-3 rounded border border-slate-300">
                <div className="text-xs font-semibold text-slate-800">
                  Edit Approved Client Paragraphs (Page {page.pageNumber})
                </div>
                <label className="block text-[11px] text-slate-700">
                  <span>Paragraph 1 (Primary Narrative)</span>
                  <textarea
                    rows={3}
                    value={draftP1}
                    onChange={(e) => setDraftP1(e.target.value)}
                    className="mt-1 w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  />
                </label>
                <label className="block text-[11px] text-slate-700">
                  <span>Paragraph 2 (Supporting Details & Logistics)</span>
                  <textarea
                    rows={3}
                    value={draftP2}
                    onChange={(e) => setDraftP2(e.target.value)}
                    className="mt-1 w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingText(false)}
                    className="px-2.5 py-1 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold bg-slate-900 text-white rounded"
                  >
                    Apply to Page
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p
                  className="text-[13.5px] text-slate-800 leading-[1.72] tracking-[0.005em] text-justify"
                  style={{ maxWidth: '62ch' }}
                >
                  {page.paragraphs[0]}
                </p>
                <p
                  className="text-[13.5px] text-slate-700 leading-[1.72] tracking-[0.005em] text-justify"
                  style={{ maxWidth: '62ch' }}
                >
                  {page.paragraphs[1]}
                </p>

                {onEditParagraphs && (
                  <div className="no-print pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingText(true)}
                      className="text-[11px] text-slate-500 hover:text-slate-900 underline"
                    >
                      Edit approved paragraphs for this page
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Running Footer with Page Number */}
      <footer className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span>{page.footerMeta}</span>
        <span className="font-mono">
          Page {page.pageNumber} of {page.totalPages}
        </span>
      </footer>
    </article>
  );
};
