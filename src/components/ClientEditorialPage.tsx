import React, { useEffect, useState } from 'react';
import {
  ClientEditorialPageData,
  createArchitecturalFallbackDataUri,
} from '../utils/pdfExportEngine';

interface ClientEditorialPageProps {
  page: ClientEditorialPageData;
  orientation?: 'portrait' | 'landscape';
  showOperatorWarnings?: boolean;
  onEditParagraphs?: (pageNumber: number, nextParagraphs: [string, string]) => void;
  presentationImages?: Array<{ id: string; name: string; url: string }>;
  onSelectImage?: (pageNumber: number, slot: 'hero' | 'supporting', url: string) => void;
  onSaveReusableDescription?: (pageNumber: number, nextParagraphs: [string, string]) => void;
  languageLabel?: string;
}

/**
 * MANDATORY CLIENT-FACING VISUAL LAYOUT COMPONENT
 * Supports both A4 Portrait (210mm x 297mm) and A4 Landscape Presentation (297mm x 210mm).
 * Visual Hierarchy enforced on every page:
 * 1. One Large Central Hero Image (dominant focal point, never distorted)
 * 2. One Smaller Supporting Image (complementary offset position, non-competing)
 * 3. Exactly Two Paragraphs of Approved Text (editorial spacing, comfortable line length)
 * Strips internal reference codes and administrative labels from the client-facing view.
 */
export const ClientEditorialPage: React.FC<ClientEditorialPageProps> = ({
  page,
  orientation = 'portrait',
  showOperatorWarnings = true,
  onEditParagraphs,
  presentationImages = [],
  onSelectImage,
  onSaveReusableDescription,
  languageLabel = 'English',
}) => {
  const [heroSrc, setHeroSrc] = useState(page.heroImage.url);
  const [supportSrc, setSupportSrc] = useState(page.supportingImage.url);
  const [isEditingText, setIsEditingText] = useState(false);
  const [draftP1, setDraftP1] = useState(page.paragraphs[0]);
  const [draftP2, setDraftP2] = useState(page.paragraphs[1]);

  const isLandscape = orientation === 'landscape';

  useEffect(() => {
    setHeroSrc(page.heroImage.url);
    setSupportSrc(page.supportingImage.url);
    setDraftP1(page.paragraphs[0]);
    setDraftP2(page.paragraphs[1]);
  }, [page.pageNumber, page.heroImage.url, page.supportingImage.url, page.paragraphs]);

  const handleSaveText = (e: React.FormEvent) => {
    e.preventDefault();
    onEditParagraphs?.(page.pageNumber, [draftP1.trim(), draftP2.trim()]);
    setIsEditingText(false);
  };

  return (
    <article
      className="viemma-pdf-page bg-white text-slate-900 border border-slate-200 shadow-md mx-auto flex flex-col justify-between relative overflow-hidden"
      style={{
        width: isLandscape ? '297mm' : '210mm',
        minHeight: isLandscape ? '210mm' : '297mm',
        maxHeight: isLandscape ? '210mm' : '297mm',
        padding: isLandscape ? '12mm 16mm' : '16mm 18mm',
        boxSizing: 'border-box',
      }}
      aria-label={`Client Itinerary Page ${page.pageNumber}`}
    >
      {/* Top Editorial Running Header */}
      <div>
        <header className="flex items-baseline justify-between border-b border-slate-200 pb-2.5 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#1A3326]">
              VIEMMA TOURS • SOUTH AFRICA
            </span>
          </div>
          {page.dateLabel && (
            <span className="text-[11px] font-medium text-slate-600 tracking-wide">
              {page.dateLabel}
            </span>
          )}
        </header>

        {/* Page Title & Subtitle */}
        <div className={isLandscape ? 'mb-3.5' : 'mb-5'}>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#8A6A00] font-semibold mb-0.5">
            {page.pageCategory}
          </div>
          <h1
            className={`${isLandscape ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[26px]'} font-normal text-slate-900 leading-tight tracking-tight`}
            style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {page.title}
          </h1>
          {page.subtitle && (
            <p className="text-xs text-slate-600 mt-1 font-medium">{page.subtitle}</p>
          )}
        </div>

        {(onSelectImage || onSaveReusableDescription) && (
          <div className="no-print mb-3 flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            {onSelectImage && (
              <>
                <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1.5">
                  Hero image
                  <select value={presentationImages.some(image => image.url === page.heroImage.url) ? page.heroImage.url : ''} onChange={e => onSelectImage(page.pageNumber, 'hero', e.target.value)} className="max-w-[190px] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-normal">
                    <option value="">Use generated / default image</option>
                    {presentationImages.map(image => <option key={image.id} value={image.url}>{image.name}</option>)}
                  </select>
                </label>
                <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1.5">
                  Supporting image
                  <select value={presentationImages.some(image => image.url === page.supportingImage.url) ? page.supportingImage.url : ''} onChange={e => onSelectImage(page.pageNumber, 'supporting', e.target.value)} className="max-w-[190px] rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-normal">
                    <option value="">Use generated / default image</option>
                    {presentationImages.map(image => <option key={image.id} value={image.url}>{image.name}</option>)}
                  </select>
                </label>
              </>
            )}
            <span className="ml-auto text-[10px] text-slate-500">Copy language: {languageLabel}</span>
          </div>
        )}

        {isLandscape ? (
          /* LANDSCAPE PRESENTATION DECK LAYOUT (16:10 / A4 Landscape) */
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Dominant Hero Image */}
            <figure className="col-span-7">
              <div
                className="w-full overflow-hidden rounded-sm bg-slate-900 border border-slate-200 relative"
                style={{ height: '118mm' }}
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
                <figcaption className="mt-1.5 text-[10px] text-slate-500 tracking-wide">
                  <span>{page.heroImage.caption}</span>
                </figcaption>
              )}
            </figure>

            {/* Right 5 Columns: Supporting Image + 2 Approved Paragraphs */}
            <div className="col-span-5 space-y-3.5">
              <figure>
                <div
                  className="w-full overflow-hidden rounded-sm bg-slate-800 border border-slate-200"
                  style={{ height: '42mm' }}
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
                  <figcaption className="mt-1 text-[10px] text-slate-500 leading-snug">
                    {page.supportingImage.caption}
                  </figcaption>
                )}
              </figure>

              {isEditingText ? (
                <form onSubmit={handleSaveText} className="no-print space-y-2 bg-slate-50 p-2.5 rounded border border-slate-300">
                  <textarea
                    rows={2}
                    value={draftP1}
                    onChange={(e) => setDraftP1(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                  />
                  <textarea
                    rows={2}
                    value={draftP2}
                    onChange={(e) => setDraftP2(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsEditingText(false)} className="px-2 py-1 text-xs text-slate-600">
                      Cancel
                    </button>
                    <button type="submit" className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded">
                      Apply
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-[12px] text-slate-800 leading-[1.6] text-justify">
                    {page.paragraphs[0]}
                  </p>
                  <p className="text-[12px] text-slate-700 leading-[1.6] text-justify">
                    {page.paragraphs[1]}
                  </p>
                  {onEditParagraphs && (
                    <div className="no-print">
                      <button
                        type="button"
                        onClick={() => setIsEditingText(true)}
                        className="text-[10px] text-slate-500 hover:text-slate-900 underline"
                      >
                        Edit paragraphs
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PORTRAIT EDITORIAL MAGAZINE LAYOUT (A4 Portrait) */
          <>
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
                <figcaption className="mt-1.5 text-[10px] text-slate-500 tracking-wide">
                  <span>{page.heroImage.caption}</span>
                </figcaption>
              )}
            </figure>

            {/* ELEMENT 2 (SMALLER SUPPORTING IMAGE) + ELEMENT 3 (TWO PARAGRAPHS OF TEXT) */}
            <div className="grid grid-cols-12 gap-6 items-start mt-2">
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

              <div className="col-span-8">
                {isEditingText ? (
                  <form onSubmit={handleSaveText} className="no-print space-y-3 bg-slate-50 p-3 rounded border border-slate-300">
                    <div className="text-xs font-semibold text-slate-800">
                      Edit Approved Client Paragraphs
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
                      {onSaveReusableDescription && (
                        <button
                          type="button"
                          onClick={() => onSaveReusableDescription(page.pageNumber, [draftP1.trim(), draftP2.trim()])}
                          className="px-3 py-1 text-xs font-semibold border border-[#1A3326] text-[#1A3326] rounded"
                        >
                          Save reusable {languageLabel} copy
                        </button>
                      )}
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
          </>
        )}
      </div>

      {/* Bottom Running Footer */}
      <footer className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span>{page.footerMeta}</span>
        <span>Viemma Tours</span>
      </footer>
    </article>
  );
};

