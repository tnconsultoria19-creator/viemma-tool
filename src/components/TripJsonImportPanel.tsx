import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ClipboardPaste, FileJson, TriangleAlert } from 'lucide-react';
import type { AppState } from '../types';
import { applyTripJson, parseTripJson, type TripJsonMode, type TripJsonScope } from '../utils/tripJsonImport';

interface TripJsonImportPanelProps {
  state: AppState;
  activeTab: string;
  onApply: (state: AppState) => void;
}

const scopeForTab = (tab: string): TripJsonScope => {
  if (tab === 'flights') return 'flights';
  if (tab === 'transfers') return 'transfers';
  if (tab === 'drivers') return 'drivers';
  if (tab === 'fleet') return 'vehicles';
  if (tab === 'rooming') return 'hotels';
  if (tab === 'activities' || tab === 'library' || tab === 'driver-itinerary') return 'programme';
  if (tab === 'timelines') return 'timeline';
  if (tab === 'finance') return 'finance';
  return 'all';
};

const scopeLabels: Record<TripJsonScope, string> = {
  all: 'Full client conversation (all tabs)',
  clients: 'Clients and travellers',
  flights: 'Flights',
  transfers: 'Transfers',
  hotels: 'Hotels',
  programme: 'Programme',
  timeline: 'Timeline',
  finance: 'Pricing and finance',
  drivers: 'Drivers',
  vehicles: 'Vehicles and fleet',
};

export const TripJsonImportPanel: React.FC<TripJsonImportPanelProps> = ({ state, activeTab, onApply }) => {
  const defaultScope = useMemo(() => scopeForTab(activeTab), [activeTab]);
  const [expanded, setExpanded] = useState(true);
  const [scope, setScope] = useState<TripJsonScope>(defaultScope);
  const [mode, setMode] = useState<TripJsonMode>('merge');
  const [jsonText, setJsonText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  useEffect(() => {
    setScope(defaultScope);
    setExpanded(true);
    setJsonText('');
    setFeedback(null);
  }, [activeTab, defaultScope]);

  const apply = () => {
    try {
      const parsed = parseTripJson(jsonText);
      const result = applyTripJson(state, parsed, scope, mode);
      if (result.changed.length === 0) {
        setFeedback({ type: 'warning', text: result.warnings.join(' ') || 'No changes were made.' });
        return;
      }
      onApply(result.state);
      setFeedback({
        type: 'success',
        text: `Updated ${result.changed.join(', ')}. Existing records were matched where possible. Check the tab before publishing or sending documents.`,
      });
    } catch (error) {
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Could not read this JSON.' });
    }
  };

  return (
    <section className="mb-6 bg-white border border-slate-200 rounded-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 px-5 py-4">
        <div className="flex items-start gap-3">
          <FileJson size={17} className="mt-0.5 text-slate-600 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Import structured trip data</h2>
            <p className="mt-0.5 text-xs text-slate-600">
              {scope === 'all'
                ? 'Paste the full client or agent conversation output to populate the trip across tabs. Leave unknown details blank rather than guessing.'
                : `Paste a focused output for ${scopeLabels[scope].toLowerCase()}. Other sections will stay unchanged.`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 hover:bg-slate-50"
          aria-expanded={expanded}
        >
          <ClipboardPaste size={14} />
          {expanded ? 'Hide JSON' : 'Paste JSON'}
          <ChevronDown size={14} className={expanded ? 'rotate-180' : ''} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <label className="block space-y-1 flex-1">
              <span className="text-xs font-medium text-slate-700">What should this JSON update?</span>
              <select
                value={scope}
                onChange={event => { setScope(event.target.value as TripJsonScope); setFeedback(null); }}
                className="w-full h-9 border border-slate-300 rounded-md px-2.5 bg-white text-sm text-slate-900"
              >
                {Object.entries(scopeLabels).map(([key, label]) => (
                  <option value={key} key={key}>{label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 md:w-64">
              <span className="text-xs font-medium text-slate-700">When matching records already exist</span>
              <select
                value={mode}
                onChange={event => setMode(event.target.value as TripJsonMode)}
                className="w-full h-9 border border-slate-300 rounded-md px-2.5 bg-white text-sm text-slate-900"
              >
                <option value="merge">Merge supplied fields (recommended)</option>
                <option value="replace">Replace records in this section</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-700">JSON output</span>
            <textarea
              rows={8}
              spellCheck={false}
              value={jsonText}
              onChange={event => { setJsonText(event.target.value); setFeedback(null); }}
              placeholder={'Paste the JSON object here…\n\nExample keys: client, travellers, flights, transfers, hotels, itinerary, finance, welcomePlacard'}
              className="w-full rounded-md border border-slate-300 bg-white p-3 text-xs leading-5 font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-600 max-w-3xl">
              Merge is safer: it updates supplied fields and adds new matching records without clearing unrelated tabs. Use Replace only when the JSON contains the complete list for this section.
            </p>
            <button
              type="button"
              onClick={apply}
              disabled={!jsonText.trim()}
              className="px-4 py-2 rounded-md bg-[#1A3326] text-white text-sm font-semibold hover:bg-[#244735] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Apply JSON
            </button>
          </div>

          {feedback && (
            <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 border rounded-md p-3 text-xs ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : feedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <TriangleAlert size={15} className="shrink-0 mt-0.5" />}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
