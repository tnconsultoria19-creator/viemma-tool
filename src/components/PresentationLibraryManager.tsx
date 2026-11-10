import React, { useRef, useState } from 'react';
import { ImagePlus, Link2, Upload, Trash2, X, Search, Images, Loader2 } from 'lucide-react';
import {
  PresentationLibraryAsset,
  PresentationLibraryData,
  uploadPresentationImage,
  deletePresentationImage,
} from '../lib/presentationLibraryService';

interface Props {
  library: PresentationLibraryData;
  onChange: (next: PresentationLibraryData) => Promise<void>;
  onClose: () => void;
}

export const PresentationLibraryManager: React.FC<Props> = ({ library, onChange, onClose }) => {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [altText, setAltText] = useState('');
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addAsset = async (asset: PresentationLibraryAsset) => {
    const next = { ...library, assets: [asset, ...library.assets.filter(item => item.id !== asset.id)] };
    await onChange(next);
  };

  const addUrl = async () => {
    setError('');
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Use a valid HTTP or HTTPS image URL.');
      setSaving(true);
      const now = new Date().toISOString();
      await addAsset({ id: `url_${Date.now()}`, name: name.trim() || 'Linked image', url: parsed.toString(), source: 'url', destination: destination.trim(), altText: altText.trim(), createdAt: now, updatedAt: now });
      setUrl(''); setName(''); setDestination(''); setAltText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save this image URL.');
    } finally { setSaving(false); }
  };

  const uploadFile = async (file?: File) => {
    if (!file) return;
    setError(''); setProgress(0); setSaving(true);
    try {
      const asset = await uploadPresentationImage(file, setProgress);
      await addAsset({ ...asset, name: name.trim() || asset.name, destination: destination.trim(), altText: altText.trim() });
      setName(''); setDestination(''); setAltText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed.');
    } finally { setProgress(null); setSaving(false); }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const clipboardItems = event.clipboardData.items;
    for (let index = 0; index < clipboardItems.length; index += 1) {
      const item = clipboardItems[index];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          void uploadFile(file);
          return;
        }
      }
    }
  };

  const removeAsset = async (asset: PresentationLibraryAsset) => {
    if (!window.confirm(`Remove "${asset.name}" from the presentation library?`)) return;
    await deletePresentationImage(asset);
    await onChange({ ...library, assets: library.assets.filter(item => item.id !== asset.id) });
  };

  const visibleAssets = library.assets.filter(asset => `${asset.name} ${asset.altText || ''} ${asset.destination || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-3 md:p-6" onPaste={handlePaste}>
      <section className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div><h2 className="text-lg font-semibold text-slate-900">Presentation Media Library</h2><p className="text-xs text-slate-500 mt-1">Save images once and reuse them in future client presentations.</p></div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close"><X size={18}/></button>
        </header>
        <div className="p-5 overflow-y-auto space-y-5">
          <div className="grid md:grid-cols-3 gap-3">
            <label className="text-xs font-semibold text-slate-600">Image name<input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Table Mountain" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-normal"/></label>
            <label className="text-xs font-semibold text-slate-600">Destination / activity<input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Cape Town" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-normal"/></label>
            <label className="text-xs font-semibold text-slate-600">Accessibility text<input value={altText} onChange={e=>setAltText(e.target.value)} placeholder="Short image description" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-normal"/></label>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Link2 size={16}/> Add image URL</div>
              <p className="text-xs text-slate-500">Use a direct image URL ending in a supported image resource where possible.</p>
              <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"/>
              <button type="button" disabled={!url.trim() || saving} onClick={()=>void addUrl()} className="px-3 py-2 rounded-lg bg-[#1A3326] text-white text-sm font-semibold disabled:opacity-50">Save image URL</button>
            </div>
            <div
              className="rounded-xl border-2 border-dashed border-slate-300 p-4 flex flex-col items-center justify-center text-center gap-2"
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();void uploadFile(e.dataTransfer.files[0]);}}
            >
              <ImagePlus size={25} className="text-slate-500"/>
              <p className="text-sm font-semibold">Upload, drag and drop, or paste an image</p>
              <p className="text-xs text-slate-500">JPG, PNG or WebP · Maximum 15 MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>void uploadFile(e.target.files?.[0])}/>
              <button type="button" disabled={saving} onClick={()=>fileRef.current?.click()} className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold flex items-center gap-2"><Upload size={15}/> Choose image</button>
              {progress !== null && <div className="w-full max-w-xs"><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600" style={{width:`${progress}%`}}/></div><p className="text-xs text-slate-500 mt-1">Uploading {progress}%</p></div>}
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-sm">Saved images ({library.assets.length})</h3><div className="relative w-full max-w-xs"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search saved images" className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm"/></div></div>
          {visibleAssets.length ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{visibleAssets.map(asset=><article key={asset.id} className="border border-slate-200 rounded-xl overflow-hidden"><div className="aspect-[4/3] bg-slate-100"><img src={asset.url} alt={asset.altText || asset.name} className="w-full h-full object-cover" onError={e=>{e.currentTarget.style.opacity='0.25';}}/></div><div className="p-2.5"><p className="text-xs font-semibold truncate">{asset.name}</p><p className="text-[10px] text-slate-500">{asset.source === 'upload' ? 'Firebase Storage' : 'External URL'}</p><button type="button" onClick={()=>void removeAsset(asset)} className="mt-2 text-xs text-red-700 flex items-center gap-1"><Trash2 size={12}/> Remove</button></div></article>)}</div> : <div className="py-12 text-center text-slate-500"><Images size={28} className="mx-auto mb-2"/><p className="text-sm">No saved images yet.</p></div>}
        </div>
        <footer className="border-t border-slate-200 px-5 py-3 flex items-center justify-between"><p className="text-xs text-slate-500">Changes are saved to the Viemma library.</p><button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[#1A3326] text-white text-sm font-semibold">Done</button></footer>
      </section>
    </div>
  );
};
