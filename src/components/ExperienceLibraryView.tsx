import React, { useState } from 'react';
import { AppState, ExperienceLibraryItem, DestinationLibraryItem } from '../types';
import { DEFAULT_EXPERIENCES, DEFAULT_DESTINATIONS } from '../data/libraryDefaults';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Compass, 
  MapPin, 
  Clock, 
  Coins, 
  Tag, 
  UserCheck, 
  Globe, 
  Check, 
  HelpCircle, 
  Camera, 
  RefreshCcw,
  BookOpen,
  CloudLightning,
  AlertCircle,
  FileText,
  Bookmark
} from 'lucide-react';

interface ExperienceLibraryViewProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
}

export const ExperienceLibraryView: React.FC<ExperienceLibraryViewProps> = ({
  state,
  onUpdateState
}) => {
  const [subTab, setSubTab] = useState<'experiences' | 'destinations'>('experiences');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');

  // Editing state
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);

  // Forms state
  const [expForm, setExpForm] = useState<Partial<ExperienceLibraryItem>>({});
  const [destForm, setDestForm] = useState<Partial<DestinationLibraryItem>>({});

  // Dynamic lists in forms
  const [newHighlight, setNewHighlight] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [newLocalTip, setNewLocalTip] = useState('');
  const [newPackingAdvice, setNewPackingAdvice] = useState('');

  // AI Generator status
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiStep, setAiStep] = useState('');
  const [aiError, setAiError] = useState('');
  const [previewVersion, setPreviewVersion] = useState<'luxury' | 'short' | 'seo' | 'family' | 'adventure'>('luxury');

  const experiences = state.experienceLibrary || [];
  const destinations = state.destinationLibrary || [];

  // Filtering
  const filteredExperiences = experiences.filter(exp => {
    const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exp.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || exp.category === categoryFilter;
    const matchesDestination = !destinationFilter || exp.destination === destinationFilter;
    return matchesSearch && matchesCategory && matchesDestination;
  });

  const filteredDestinations = destinations.filter(dest => {
    return dest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           dest.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
           dest.country.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Unique categories for filtering
  const categories = Array.from(new Set(experiences.map(e => e.category)));

  // Open forms
  const handleOpenAddExperience = () => {
    setExpForm({
      id: `exp_${Date.now()}`,
      name: '',
      category: 'Sightseeing',
      destination: destinations[0]?.name || 'Cape Town',
      duration: '2 hours',
      difficulty: 'Easy',
      location: '',
      images: [],
      featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      highlights: [],
      luxuryDescription: '',
      shortDescription: '',
      seoDescription: '',
      familyDescription: '',
      adventureDescription: '',
      faqs: [],
      priceAdult: 0,
      priceChild: 0,
      supplier: ''
    });
    setEditingExperienceId('NEW');
    setNewHighlight('');
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleOpenEditExperience = (item: ExperienceLibraryItem) => {
    setExpForm({ ...item });
    setEditingExperienceId(item.id);
  };

  const handleOpenAddDestination = () => {
    setDestForm({
      id: `dest_${Date.now()}`,
      name: '',
      region: '',
      country: 'South Africa',
      images: [],
      featuredImage: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
      overview: '',
      culture: '',
      climate: '',
      currency: 'ZAR',
      emergencyContacts: '',
      localTips: [],
      packingAdvice: []
    });
    setEditingDestinationId('NEW');
  };

  const handleOpenEditDestination = (item: DestinationLibraryItem) => {
    setDestForm({ ...item });
    setEditingDestinationId(item.id);
  };

  // List additions
  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setExpForm(prev => ({
      ...prev,
      highlights: [...(prev.highlights || []), newHighlight.trim()]
    }));
    setNewHighlight('');
  };

  const removeHighlight = (idx: number) => {
    setExpForm(prev => ({
      ...prev,
      highlights: (prev.highlights || []).filter((_, i) => i !== idx)
    }));
  };

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setExpForm(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: newFaqQ.trim(), answer: newFaqA.trim() }]
    }));
    setNewFaqQ('');
    setNewFaqA('');
  };

  const removeFaq = (idx: number) => {
    setExpForm(prev => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== idx)
    }));
  };

  const addLocalTip = () => {
    if (!newLocalTip.trim()) return;
    setDestForm(prev => ({
      ...prev,
      localTips: [...(prev.localTips || []), newLocalTip.trim()]
    }));
    setNewLocalTip('');
  };

  const removeLocalTip = (idx: number) => {
    setDestForm(prev => ({
      ...prev,
      localTips: (prev.localTips || []).filter((_, i) => i !== idx)
    }));
  };

  const addPackingAdvice = () => {
    if (!newPackingAdvice.trim()) return;
    setDestForm(prev => ({
      ...prev,
      packingAdvice: [...(prev.packingAdvice || []), newPackingAdvice.trim()]
    }));
    setNewPackingAdvice('');
  };

  const removePackingAdvice = (idx: number) => {
    setDestForm(prev => ({
      ...prev,
      packingAdvice: (prev.packingAdvice || []).filter((_, i) => i !== idx)
    }));
  };

  // Reset factory defaults
  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset the Experience and Destination libraries to pristine factory defaults? Any custom edits will be lost.')) {
      onUpdateState({
        experienceLibrary: DEFAULT_EXPERIENCES,
        destinationLibrary: DEFAULT_DESTINATIONS
      });
    }
  };

  // AI copy generation
  const handleGenerateAiDescription = async () => {
    if (!expForm.name) {
      alert('Please fill out the Experience Name before using the AI Generator.');
      return;
    }

    setIsAiGenerating(true);
    setAiError('');
    setAiStep('Polishing stationery and opening connection...');

    const steps = [
      'Sending details to Gemini 3.5 Flash...',
      'Fusing historical facts and sensory atmospheres...',
      'Polishing five-star prose for multi-generational guests...',
      'Structuring descriptions...'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setAiStep(steps[stepIdx]);
        stepIdx++;
      }
    }, 1500);

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName: expForm.name,
          category: expForm.category,
          destination: expForm.destination
        })
      });

      if (!response.ok) {
        throw new Error('AI Server responded with an error status');
      }

      const data = await response.json();
      clearInterval(interval);

      setExpForm(prev => ({
        ...prev,
        luxuryDescription: data.luxuryDescription || '',
        shortDescription: data.shortDescription || '',
        seoDescription: data.seoDescription || '',
        familyDescription: data.familyDescription || '',
        adventureDescription: data.adventureDescription || ''
      }));

      setAiStep('Success!');
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setAiError(err.message || 'Connection lost to the server-side Gemini service.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Save Experience
  const handleSaveExperience = () => {
    if (!expForm.name) {
      alert('Experience Name is required.');
      return;
    }

    const newItem = expForm as ExperienceLibraryItem;
    let list = [...experiences];

    if (editingExperienceId === 'NEW') {
      list.push(newItem);
    } else {
      list = list.map(item => item.id === editingExperienceId ? newItem : item);
    }

    onUpdateState({ experienceLibrary: list });
    setEditingExperienceId(null);
    setExpForm({});
  };

  // Save Destination
  const handleSaveDestination = () => {
    if (!destForm.name) {
      alert('Destination Name is required.');
      return;
    }

    const newItem = destForm as DestinationLibraryItem;
    let list = [...destinations];

    if (editingDestinationId === 'NEW') {
      list.push(newItem);
    } else {
      list = list.map(item => item.id === editingDestinationId ? newItem : item);
    }

    onUpdateState({ destinationLibrary: list });
    setEditingDestinationId(null);
    setDestForm({});
  };

  // Delete handlers
  const handleDeleteExperience = (id: string) => {
    if (confirm('Delete this experience from your permanent library?')) {
      onUpdateState({
        experienceLibrary: experiences.filter(item => item.id !== id)
      });
    }
  };

  const handleDeleteDestination = (id: string) => {
    if (confirm('Delete this destination from your permanent library? Any linked experiences will remain but won\'t map details.')) {
      onUpdateState({
        destinationLibrary: destinations.filter(item => item.id !== id)
      });
    }
  };

  return (
    <div className="space-y-8 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Editorial Title Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#D4AF37] flex items-center gap-2">
            <BookOpen size={14} /> Library Registry Desk
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-sans">Experience & Destination Libraries</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Manage your corporate, reusable repository of destination guides and luxury excursion items. Details automatically synchronize with the Client Experience portal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-xs font-semibold transition"
          >
            <RefreshCcw size={13} /> Reset Factory Defaults
          </button>
          
          {editingExperienceId === null && editingDestinationId === null && (
            <button 
              onClick={subTab === 'experiences' ? handleOpenAddExperience : handleOpenAddDestination}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-bold shadow-md hover:translate-y-[-1px] transition shrink-0"
            >
              <Plus size={14} /> Add {subTab === 'experiences' ? 'Experience' : 'Destination'}
            </button>
          )}
        </div>
      </div>

      {/* Primary Tabs selector */}
      {editingExperienceId === null && editingDestinationId === null && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex gap-2">
            <button
              onClick={() => { setSubTab('experiences'); setSearchTerm(''); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                subTab === 'experiences' 
                  ? 'bg-[#1A3326] text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Excursion Experiences ({experiences.length})
            </button>
            <button
              onClick={() => { setSubTab('destinations'); setSearchTerm(''); }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                subTab === 'destinations' 
                  ? 'bg-[#1A3326] text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Destination Guides ({destinations.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={`Search ${subTab === 'experiences' ? 'experiences...' : 'destinations...'}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-xs text-gray-800 bg-white focus:border-[#D4AF37] focus:ring-1 transition"
              />
            </div>

            {subTab === 'experiences' && (
              <>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 bg-white focus:border-[#D4AF37]"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select
                  value={destinationFilter}
                  onChange={e => setDestinationFilter(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 bg-white focus:border-[#D4AF37]"
                >
                  <option value="">All Locations</option>
                  {destinations.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </>
            )}
          </div>
        </div>
      )}

      {/* EXPERIENCES EDITOR FORM */}
      {editingExperienceId !== null && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          <div className="bg-gradient-to-r from-[#1A3326] to-[#224433] text-white p-6 md:p-8 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block">Reusable Content Registry</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Compass className="text-[#D4AF37] w-6 h-6" />
                {editingExperienceId === 'NEW' ? 'Register New Excursion Experience' : `Edit: ${expForm.name}`}
              </h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingExperienceId(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveExperience}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] text-xs font-bold transition shadow-sm"
              >
                Save to Library
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-gray-50/30">
            
            {/* Row 1: Core Fields */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Experience Name</label>
                <input
                  type="text"
                  value={expForm.name || ''}
                  onChange={e => setExpForm({ ...expForm, name: e.target.value })}
                  placeholder="e.g. Table Mountain Private Wine Tasting Picnic"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 font-semibold focus:border-[#D4AF37] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Category</label>
                <select
                  value={expForm.category || 'Sightseeing'}
                  onChange={e => setExpForm({ ...expForm, category: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-[#D4AF37]"
                >
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Nature & Wildlife">Nature & Wildlife</option>
                  <option value="Gastronomy">Gastronomy</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Wellness">Wellness</option>
                  <option value="Culture">Culture</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Linked Destination</label>
                <select
                  value={expForm.destination || ''}
                  onChange={e => setExpForm({ ...expForm, destination: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-[#D4AF37]"
                >
                  <option value="">Select Destination Guide...</option>
                  {destinations.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Duration Description</label>
                <input
                  type="text"
                  value={expForm.duration || ''}
                  onChange={e => setExpForm({ ...expForm, duration: e.target.value })}
                  placeholder="e.g. 3 hours, Full Day"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Physical Difficulty</label>
                <select
                  value={expForm.difficulty || 'Easy'}
                  onChange={e => setExpForm({ ...expForm, difficulty: e.target.value as any })}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:border-[#D4AF37]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Strenuous">Strenuous</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Featured Image URL</label>
                <input
                  type="text"
                  value={expForm.featuredImage || ''}
                  onChange={e => setExpForm({ ...expForm, featuredImage: e.target.value, images: [e.target.value] })}
                  placeholder="Unsplash picture link"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Local Coordinate Address</label>
                <input
                  type="text"
                  value={expForm.location || ''}
                  onChange={e => setExpForm({ ...expForm, location: e.target.value })}
                  placeholder="e.g. Tafelberg Road, Cape Town"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Default Supplier</label>
                <input
                  type="text"
                  value={expForm.supplier || ''}
                  onChange={e => setExpForm({ ...expForm, supplier: e.target.value })}
                  placeholder="Supplier name"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Default Rates (ZAR)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Adult Net"
                    value={expForm.priceAdult || ''}
                    onChange={e => setExpForm({ ...expForm, priceAdult: Number(e.target.value) })}
                    className="h-11 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                  />
                  <input
                    type="number"
                    placeholder="Child Net"
                    value={expForm.priceChild || ''}
                    onChange={e => setExpForm({ ...expForm, priceChild: Number(e.target.value) })}
                    className="h-11 px-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* AI Generator Box */}
            <div className="bg-gradient-to-r from-emerald-500/5 to-yellow-500/5 rounded-2xl border border-[#D4AF37]/25 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-[#1A3326] flex items-center gap-2">
                  <Sparkles className="text-[#D4AF37] w-4 h-4 animate-pulse" /> Gemini AI Luxury Copywriter
                </h3>
                <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                  Automatically generate high-end, bespoke Aman-style descriptions suited for your client brochure. Gemini will create five tailored styles.
                </p>
              </div>

              <button
                type="button"
                disabled={isAiGenerating}
                onClick={handleGenerateAiDescription}
                className={`px-5 py-3 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-2 shadow-md ${
                  isAiGenerating 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#1A3326] text-white hover:bg-[#12241b]'
                }`}
              >
                {isAiGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin"></span>
                    Generating Descriptions...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-[#D4AF37]" />
                    🪄 Generate Luxury Copy
                  </>
                )}
              </button>
            </div>

            {/* AI Loading Screen Overlay */}
            {isAiGenerating && (
              <div className="bg-white/80 rounded-2xl border border-gray-100 p-8 text-center space-y-4 animate-in fade-in duration-300">
                <div className="w-12 h-12 bg-emerald-50 text-[#1A3326] rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Sparkles size={20} className="text-[#D4AF37]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[#1A3326] text-xs uppercase tracking-wider">Whispering to Gemini Copywriters</h4>
                  <p className="text-xs text-gray-400 italic max-w-xs mx-auto">"{aiStep}"</p>
                </div>
              </div>
            )}

            {aiError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 text-xs flex items-center gap-3 animate-in shake">
                <AlertCircle size={16} className="text-rose-500" />
                <span><strong>AI Generation Failed:</strong> {aiError} (Please check your local .env key configuration).</span>
              </div>
            )}

            {/* Row 2: Description copy and tabs preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Direct Edit Fields */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-6">
                <h3 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider border-b border-gray-50 pb-2 flex items-center gap-2">
                  <FileText size={14} className="text-gray-400" /> Copywriting Vault
                </h3>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Primary Luxury Description (sensory prose)</label>
                  <textarea
                    rows={6}
                    value={expForm.luxuryDescription || ''}
                    onChange={e => setExpForm({ ...expForm, luxuryDescription: e.target.value })}
                    placeholder="Rich, beautifully paced, 2-3 paragraphs. Evocate scents, historic milestones, and exclusive perspectives."
                    className="w-full p-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37] transition font-sans leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Short Description</label>
                    <textarea
                      rows={3}
                      value={expForm.shortDescription || ''}
                      onChange={e => setExpForm({ ...expForm, shortDescription: e.target.value })}
                      placeholder="One punchy paragraph"
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">SEO Snippet / Hook</label>
                    <textarea
                      rows={3}
                      value={expForm.seoDescription || ''}
                      onChange={e => setExpForm({ ...expForm, seoDescription: e.target.value })}
                      placeholder="Catchy, marketing line"
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Family-Oriented Version</label>
                    <textarea
                      rows={3}
                      value={expForm.familyDescription || ''}
                      onChange={e => setExpForm({ ...expForm, familyDescription: e.target.value })}
                      placeholder="Emphasis on children/grandparents, safety, comfort"
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Adventure Focus Version</label>
                    <textarea
                      rows={3}
                      value={expForm.adventureDescription || ''}
                      onChange={e => setExpForm({ ...expForm, adventureDescription: e.target.value })}
                      placeholder="Emphasis on adrenaline, trekking, action"
                      className="w-full p-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Live Premium Preview Panel */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Bookmark className="text-[#D4AF37] w-4.5 h-4.5" />
                      <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-slate-400">Magazine Live Preview</span>
                    </div>
                    <div className="flex gap-1.5">
                      {(['luxury', 'short', 'seo', 'family', 'adventure'] as const).map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPreviewVersion(v)}
                          className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-extrabold transition ${
                            previewVersion === v 
                              ? 'bg-[#D4AF37] text-[#1A3326]' 
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulated Mobile/Device Magazine Preview container */}
                  <div className="bg-slate-950 rounded-xl p-6 border border-slate-800/80 space-y-4 max-h-[450px] overflow-y-auto">
                    {expForm.featuredImage && (
                      <div className="w-full h-40 rounded-lg overflow-hidden relative">
                        <img 
                          referrerPolicy="no-referrer"
                          src={expForm.featuredImage} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider font-bold border border-slate-700">
                          {expForm.category}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest block font-bold">{expForm.destination || 'LOCATION'} Guide</span>
                      <h4 className="text-lg font-serif font-semibold text-slate-100">{expForm.name || 'EXCURSION NAME'}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock size={11} /> {expForm.duration}</span>
                        <span className="flex items-center gap-1"><Compass size={11} /> {expForm.difficulty} Difficulty</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-800/50 pt-3">
                      <p className="text-[11.5px] leading-relaxed text-slate-300 font-sans italic whitespace-pre-wrap">
                        {previewVersion === 'luxury' && (expForm.luxuryDescription || 'No luxury prose loaded. Run the Gemini AI generator above!')}
                        {previewVersion === 'short' && (expForm.shortDescription || 'No short version.')}
                        {previewVersion === 'seo' && (expForm.seoDescription || 'No SEO snippet.')}
                        {previewVersion === 'family' && (expForm.familyDescription || 'No family version.')}
                        {previewVersion === 'adventure' && (expForm.adventureDescription || 'No adventure version.')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800/40 text-center">
                  <span className="text-[10px] text-slate-500 block">Viemma Tours Workspace OS Engine • Fully Synchronized</span>
                </div>
              </div>
            </div>

            {/* Row 3: Highlights and FAQ configurations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Highlights manager */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider border-b border-gray-50 pb-2">
                  Interactive Highlights (Badges)
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. ⭐ UNESCO World Heritage Site"
                    value={newHighlight}
                    onChange={e => setNewHighlight(e.target.value)}
                    className="flex-grow h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-4 bg-[#1A3326] text-white rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(expForm.highlights || []).map((hl, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#1A3326] border border-emerald-100 text-[11px] font-semibold flex items-center gap-1.5"
                    >
                      {hl}
                      <button 
                        type="button" 
                        onClick={() => removeHighlight(idx)}
                        className="text-red-500 hover:text-red-700 font-extrabold focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(expForm.highlights || []).length === 0 && (
                    <span className="text-xs text-gray-400 italic">No highlights registered yet. Add some above.</span>
                  )}
                </div>
              </div>

              {/* FAQs Manager */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider border-b border-gray-50 pb-2">
                  Fictional / Real Experience FAQs
                </h3>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Question (e.g. Is lunch included?)"
                    value={newFaqQ}
                    onChange={e => setNewFaqQ(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Answer (e.g. Yes, a gourmet basket is packed...)"
                      value={newFaqA}
                      onChange={e => setNewFaqA(e.target.value)}
                      className="flex-grow h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={addFaq}
                      className="px-4 bg-[#1A3326] text-white rounded-xl text-xs font-bold shrink-0"
                    >
                      Add FAQ
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pt-2">
                  {(expForm.faqs || []).map((faq, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-gray-100 flex justify-between items-start text-xs">
                      <div className="space-y-1">
                        <strong className="text-gray-900 font-bold block">Q: {faq.question}</strong>
                        <span className="text-gray-500 block">A: {faq.answer}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFaq(idx)}
                        className="text-red-500 hover:text-red-700 ml-2 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(expForm.faqs || []).length === 0 && (
                    <span className="text-xs text-gray-400 italic">No FAQs registered yet. Add some above.</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button 
              onClick={() => setEditingExperienceId(null)}
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveExperience}
              className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md transition"
            >
              Save Experience to Library
            </button>
          </div>

        </div>
      )}

      {/* DESTINATIONS EDITOR FORM */}
      {editingDestinationId !== null && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          
          <div className="bg-gradient-to-r from-[#1A3326] to-[#224433] text-white p-6 md:p-8 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#D4AF37] block">Reusable Content Registry</span>
              <h2 className="text-xl md:text-2xl font-bold font-sans flex items-center gap-2">
                <Globe className="text-[#D4AF37] w-6 h-6" />
                {editingDestinationId === 'NEW' ? 'Register New Destination Guide' : `Edit Guide: ${destForm.name}`}
              </h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingDestinationId(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveDestination}
                className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#1A3326] hover:bg-[#b89528] text-xs font-bold transition shadow-sm"
              >
                Save Destination
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6 bg-gray-50/30">
            
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Destination City/Region Name</label>
                <input
                  type="text"
                  value={destForm.name || ''}
                  onChange={e => setDestForm({ ...destForm, name: e.target.value })}
                  placeholder="e.g. Stellenbosch"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Province / Region</label>
                <input
                  type="text"
                  value={destForm.region || ''}
                  onChange={e => setDestForm({ ...destForm, region: e.target.value })}
                  placeholder="e.g. Cape Winelands"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Country</label>
                <input
                  type="text"
                  value={destForm.country || ''}
                  onChange={e => setDestForm({ ...destForm, country: e.target.value })}
                  placeholder="e.g. South Africa"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Featured Image URL</label>
                <input
                  type="text"
                  value={destForm.featuredImage || ''}
                  onChange={e => setDestForm({ ...destForm, featuredImage: e.target.value, images: [e.target.value] })}
                  placeholder="Unsplash scenic photo link"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Official Currency Code</label>
                <input
                  type="text"
                  value={destForm.currency || ''}
                  onChange={e => setDestForm({ ...destForm, currency: e.target.value })}
                  placeholder="e.g. ZAR (South African Rand)"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-gray-400 font-bold uppercase block">Emergency Contacts</label>
                <input
                  type="text"
                  value={destForm.emergencyContacts || ''}
                  onChange={e => setDestForm({ ...destForm, emergencyContacts: e.target.value })}
                  placeholder="e.g. Tourism helpline: +27 (0)21..."
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider border-b border-gray-50 pb-2">
                  Destination Overview (Luxury Editorial)
                </h3>
                <textarea
                  rows={4}
                  value={destForm.overview || ''}
                  onChange={e => setDestForm({ ...destForm, overview: e.target.value })}
                  placeholder="sensory, detailed Condé Nast styled overview..."
                  className="w-full p-3.5 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed font-sans"
                />
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider border-b border-gray-50 pb-2">
                  Cultural Insight & Heritage
                </h3>
                <textarea
                  rows={4}
                  value={destForm.culture || ''}
                  onChange={e => setDestForm({ ...destForm, culture: e.target.value })}
                  placeholder="Local history, Indigenous heritages, and fusion of stories..."
                  className="w-full p-3.5 rounded-xl border border-gray-200 text-xs text-gray-800 leading-relaxed font-sans"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-1.5">
              <label className="text-[11px] text-gray-400 font-bold uppercase block">Best Climate & Times to Visit</label>
              <input
                type="text"
                value={destForm.climate || ''}
                onChange={e => setDestForm({ ...destForm, climate: e.target.value })}
                placeholder="e.g. Mediterranean. Dry summers (November to March) average 26C..."
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Local Tips manager */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider border-b border-gray-50 pb-2">
                  Professional Local Tips & Secrets
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Uber is highly reliable around the main strip."
                    value={newLocalTip}
                    onChange={e => setNewLocalTip(e.target.value)}
                    className="flex-grow h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={addLocalTip}
                    className="px-4 bg-[#1A3326] text-white rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                  {(destForm.localTips || []).map((tip, idx) => (
                    <div key={idx} className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/30 text-xs text-[#1A3326] flex justify-between items-center">
                      <span>{tip}</span>
                      <button 
                        type="button" 
                        onClick={() => removeLocalTip(idx)}
                        className="text-red-500 font-bold ml-2 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(destForm.localTips || []).length === 0 && (
                    <span className="text-xs text-gray-400 italic">No expert tips registered yet.</span>
                  )}
                </div>
              </div>

              {/* Packing advice manager */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs uppercase font-extrabold text-gray-900 tracking-wider border-b border-gray-50 pb-2">
                  Tailored Packing Advice
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. earth-toned breathable linens for game drives."
                    value={newPackingAdvice}
                    onChange={e => setNewPackingAdvice(e.target.value)}
                    className="flex-grow h-10 px-3 rounded-xl border border-gray-200 text-xs text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={addPackingAdvice}
                    className="px-4 bg-[#1A3326] text-white rounded-xl text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                  {(destForm.packingAdvice || []).map((p, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-gray-100 text-xs text-gray-700 flex justify-between items-center">
                      <span>{p}</span>
                      <button 
                        type="button" 
                        onClick={() => removePackingAdvice(idx)}
                        className="text-red-500 font-bold ml-2 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(destForm.packingAdvice || []).length === 0 && (
                    <span className="text-xs text-gray-400 italic">No packing advice registered yet.</span>
                  )}
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button 
              onClick={() => setEditingDestinationId(null)}
              className="px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveDestination}
              className="px-6 py-3 rounded-xl bg-[#1A3326] text-white hover:bg-[#12241b] text-xs font-extrabold shadow-md transition"
            >
              Save Destination Guide
            </button>
          </div>

        </div>
      )}

      {/* EXPERIENCES GRID (READ WORKSPACE) */}
      {editingExperienceId === null && editingDestinationId === null && subTab === 'experiences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperiences.map(item => (
            <div 
              key={item.id} 
              className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-xs hover:shadow-md hover:translate-y-[-2px] transition duration-300 group flex flex-col justify-between"
            >
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img 
                  referrerPolicy="no-referrer"
                  src={item.featuredImage} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-[#1A3326]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold text-[#D4AF37] border border-[#D4AF37]/20">
                  {item.category}
                </div>
                <div className="absolute bottom-4 right-4 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white">
                  R{item.priceAdult} Adult
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">{item.destination} Guide</span>
                      <h3 className="font-bold text-gray-900 text-sm mt-0.5 line-clamp-1">{item.name}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {item.shortDescription || item.luxuryDescription || 'No description registered. Click edit to compile luxury prose with Gemini AI.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(item.highlights || []).slice(0, 2).map((hl, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-50 text-[#1A3326] border border-emerald-100 text-[9px] font-bold rounded-lg truncate max-w-full">
                      {hl}
                    </span>
                  ))}
                </div>

                <div className="border-t border-gray-50 pt-4 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{item.duration}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditExperience(item)}
                      className="w-8 h-8 rounded-lg border border-gray-100 text-gray-500 hover:text-gray-900 bg-white flex items-center justify-center transition"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(item.id)}
                      className="w-8 h-8 rounded-lg border border-rose-50 text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50/10 flex items-center justify-center transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredExperiences.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white border border-gray-100 rounded-[24px]">
              <Compass className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900">No Experiences Found</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Try adjusting your filters or add a new excursion experience using the action button.</p>
            </div>
          )}
        </div>
      )}

      {/* DESTINATIONS GRID (READ WORKSPACE) */}
      {editingExperienceId === null && editingDestinationId === null && subTab === 'destinations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map(item => (
            <div 
              key={item.id} 
              className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-xs hover:shadow-md hover:translate-y-[-2px] transition duration-300 group flex flex-col justify-between"
            >
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img 
                  referrerPolicy="no-referrer"
                  src={item.featuredImage} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold text-white">
                  {item.region}
                </div>
              </div>

              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest block">{item.country}</span>
                  <h3 className="font-bold text-gray-900 text-base mt-0.5">{item.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                    {item.overview}
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] text-gray-400 border-t border-gray-50 pt-4">
                  <p className="flex justify-between">
                    <span>Currency:</span>
                    <strong className="text-gray-700 font-bold">{item.currency}</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Best Time:</span>
                    <strong className="text-gray-700 font-semibold truncate max-w-[200px]">{item.climate}</strong>
                  </p>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                  <button
                    onClick={() => handleOpenEditDestination(item)}
                    className="w-8 h-8 rounded-lg border border-gray-100 text-gray-500 hover:text-gray-900 bg-white flex items-center justify-center transition"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteDestination(item.id)}
                    className="w-8 h-8 rounded-lg border border-rose-50 text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50/10 flex items-center justify-center transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredDestinations.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white border border-gray-100 rounded-[24px]">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-gray-900">No Destination Guides Found</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Create your first luxury destination overview using the add button in the right corner.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
