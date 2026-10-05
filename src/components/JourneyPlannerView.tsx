import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, MapPin, Users, Calendar, 
  Home, Camera, Wine, Compass, Umbrella,
  Utensils, Coffee, Heart, CheckCircle, Car,
  Plane, Ship, Briefcase
} from 'lucide-react';
import { AppState, ExperienceLibraryItem } from '../types';
import { DEFAULT_EXPERIENCES } from '../data/libraryDefaults';

interface Props {
  onReturnHome: () => void;
  onSubmit: (data: any) => void;
}

const DESTINATIONS = [
  { name: 'South Africa', img: 'https://images.pexels.com/photos/1682748/pexels-photo-1682748.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Victoria Falls', img: 'https://images.pexels.com/photos/33829/waterfall-victoria-falls-zimbabwe-water.jpg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Mauritius', img: 'https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Seychelles', img: 'https://images.pexels.com/photos/1483053/pexels-photo-1483053.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Maldives', img: 'https://images.pexels.com/photos/3601456/pexels-photo-3601456.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Zanzibar', img: 'https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Mozambique', img: 'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Madagascar', img: 'https://images.pexels.com/photos/4577884/pexels-photo-4577884.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Reunion', img: 'https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=800' }
];

export const JourneyPlannerView: React.FC<Props> = ({ onReturnHome, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    inspiredBy: [] as string[],
    destination: '',
    journeyType: [] as string[],
    groupType: '',
    accommodation: '',
    experiences: [] as string[],
    duration: '',
    budget: '',
    specialRequests: '',
  });

  const updateForm = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const array = prev[key] as string[];
      if (array.includes(value)) {
        return { ...prev, [key]: array.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...array, value] };
      }
    });
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 9));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Determine experiences to show based on selected destination
  const recommendedExperiences = useMemo(() => {
    if (!formData.destination) return DEFAULT_EXPERIENCES.slice(0, 4);
    const destinationName = formData.destination;
    // Map selected destination to regions if necessary, or just filter.
    let filtered = DEFAULT_EXPERIENCES.filter(exp => 
      exp.destination.toLowerCase().includes(destinationName.toLowerCase()) || 
      exp.location.toLowerCase().includes(destinationName.toLowerCase()) ||
      (destinationName === 'South Africa' && (exp.destination.includes('Cape Town') || exp.destination.includes('Kruger')))
    );
    if (filtered.length === 0) {
      filtered = DEFAULT_EXPERIENCES.slice(0, 4);
    }
    return filtered.slice(0, 6);
  }, [formData.destination]);

  return (
    <div className="min-h-screen font-sans selection:bg-[#D4AF37] selection:text-white relative">
      
      {/* Top Navbar */}
      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex flex-col items-start cursor-pointer group" onClick={onReturnHome}>
          <span className="font-serif text-white text-xl font-bold tracking-tight">VIEMMA</span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold mt-0.5">TOURS</span>
        </div>
        
        <button 
          onClick={onReturnHome}
          className="text-xs font-bold text-gray-200 hover:text-white transition uppercase tracking-wider"
        >
          Close Planner
        </button>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-24 max-w-4xl mx-auto w-full">
        
        {/* Step Indicator */}
        <div className="w-full flex items-center justify-between mb-12">
          <div className="flex gap-1.5 md:gap-2">
            {[1,2,3,4,5,6,7,8,9].map(s => (
              <div 
                key={s} 
                className={`h-1 rounded-full transition-all duration-300 ${s === step ? 'w-6 md:w-8 bg-[#D4AF37]' : s < step ? 'w-3 md:w-4 bg-emerald-400' : 'w-3 md:w-4 bg-white/30'}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest shrink-0 ml-4">
            Step {step} of 9
          </span>
        </div>

        {/* Step 1: Inspired By */}
        {step === 1 && (
          <div className="w-full bg-white/95 backdrop-blur-md p-8 md:p-12 rounded-[32px] shadow-2xl border border-white/20 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-3">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1A3326]">What inspired this journey?</h1>
              <p className="text-sm text-gray-600 font-medium">Select what you're dreaming of to help us craft your perfect experience.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {[
                { name: 'Safari', icon: <Camera size={20} /> },
                { name: 'Honeymoon', icon: <Heart size={20} /> },
                { name: 'Wildlife', icon: <Camera size={20} /> },
                { name: 'Beaches', icon: <Umbrella size={20} /> },
                { name: 'Family Time', icon: <Users size={20} /> },
                { name: 'Culture', icon: <MapPin size={20} /> },
                { name: 'Business', icon: <Briefcase size={20} /> },
                { name: 'Food & Wine', icon: <Wine size={20} /> },
                { name: 'Adventure', icon: <Compass size={20} /> },
                { name: 'Relaxation', icon: <Coffee size={20} /> },
              ].map(item => (
                <button 
                  key={item.name}
                  onClick={() => toggleArrayItem('inspiredBy', item.name)}
                  className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                    formData.inspiredBy.includes(item.name)
                      ? 'bg-[#1A3326] border-[#1A3326] text-white shadow-lg'
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`${formData.inspiredBy.includes(item.name) ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                    {item.icon}
                  </div>
                  <span className="font-bold text-xs md:text-sm">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Destination */}
        {step === 2 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">Where would you like to travel?</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">Select your dream destinations.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {DESTINATIONS.map(dest => (
                <button 
                  key={dest.name}
                  onClick={() => { updateForm('destination', dest.name); nextStep(); }}
                  className={`group relative h-40 md:h-48 rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-300 ${
                    formData.destination === dest.name ? 'ring-4 ring-[#D4AF37] ring-offset-2' : 'hover:-translate-y-1 hover:shadow-xl'
                  }`}
                >
                  <img src={dest.img} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 text-left">
                    <h3 className="text-white font-serif font-bold text-lg md:text-xl drop-shadow-md">{dest.name}</h3>
                  </div>
                  {formData.destination === dest.name && (
                    <div className="absolute top-4 right-4 bg-[#D4AF37] text-white rounded-full p-1 shadow-md">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Type of Journey */}
        {step === 3 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">What type of journey?</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">Select the style of your trip.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {[
                'Safari', 'Romance', 'Family Holiday', 'Corporate', 
                'Cultural', 'Adventure', 'Beach Escape', 'Food & Wine', 
                'Photography', 'Wellness'
              ].map(type => (
                <button 
                  key={type}
                  onClick={() => toggleArrayItem('journeyType', type)}
                  className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 text-left transition-all duration-300 flex items-center justify-between ${
                    formData.journeyType.includes(type)
                      ? 'bg-[#1A3326] border-[#1A3326] text-white shadow-lg'
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-sm md:text-base">{type}</span>
                  {formData.journeyType.includes(type) && <CheckCircle size={18} className="text-[#D4AF37]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Who is Travelling */}
        {step === 4 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">Who is travelling?</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">Tell us about your group.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {['Couple', 'Family', 'Friends', 'Solo', 'Corporate Group', 'Wedding Group', 'Incentive Group'].map(type => (
                <button 
                  key={type}
                  onClick={() => { updateForm('groupType', type); nextStep(); }}
                  className={`p-6 rounded-3xl border-2 text-center transition-all duration-300 flex flex-col items-center justify-center gap-3 ${
                    formData.groupType === type 
                      ? 'bg-[#1A3326] border-[#1A3326] text-white shadow-lg scale-105'
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold">{type}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Accommodation Style */}
        {step === 5 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">Accommodation Style</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">What level of comfort do you prefer?</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { level: 'Ultra Luxury', img: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800' },
                { level: 'Luxury', img: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800' },
                { level: 'Boutique', img: 'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=800' },
                { level: 'Beach Resort', img: 'https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg?auto=compress&cs=tinysrgb&w=800' },
                { level: 'Private Villa', img: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800' },
                { level: 'Safari Lodge', img: 'https://images.pexels.com/photos/1122410/pexels-photo-1122410.jpeg?auto=compress&cs=tinysrgb&w=800' },
                { level: 'No Preference', img: 'https://images.pexels.com/photos/2507010/pexels-photo-2507010.jpeg?auto=compress&cs=tinysrgb&w=800' }
              ].map(acc => (
                <button 
                  key={acc.level}
                  onClick={() => { updateForm('accommodation', acc.level); nextStep(); }}
                  className={`group relative h-32 md:h-40 rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-300 text-left ${
                    formData.accommodation === acc.level 
                      ? 'ring-4 ring-[#D4AF37] ring-offset-2'
                      : 'hover:-translate-y-1 hover:shadow-xl'
                  }`}
                >
                  <img src={acc.img} alt={acc.level} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-center">
                    <h3 className="font-serif font-bold text-white text-xl md:text-2xl drop-shadow-md">
                      {acc.level}
                    </h3>
                  </div>
                  {formData.accommodation === acc.level && (
                    <div className="absolute top-4 right-4 bg-[#D4AF37] text-white rounded-full p-1 shadow-md">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Experiences */}
        {step === 6 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">Recommended Experiences</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">Select any experiences that catch your eye in {formData.destination || 'your destination'}.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedExperiences.map((exp) => (
                <button 
                  key={exp.id}
                  onClick={() => toggleArrayItem('experiences', exp.name)}
                  className={`group flex items-center p-4 rounded-3xl border-2 transition-all duration-300 text-left ${
                    formData.experiences.includes(exp.name)
                      ? 'bg-[#1A3326] border-[#1A3326] text-white shadow-lg'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-slate-50 text-gray-900'
                  }`}
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 mr-4">
                    <img src={exp.featuredImage} alt={exp.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-sm md:text-base mb-1">{exp.name}</h4>
                    <p className={`text-xs line-clamp-2 ${formData.experiences.includes(exp.name) ? 'text-gray-300' : 'text-gray-500'}`}>
                      {exp.shortDescription}
                    </p>
                  </div>
                  <div className="shrink-0 pl-2">
                    {formData.experiences.includes(exp.name) ? (
                      <CheckCircle size={24} className="text-[#D4AF37]" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-[#D4AF37] transition-colors" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Duration */}
        {step === 7 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">Expected Duration</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">How long would you like to travel?</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                '1-3 Days', '4-7 Days', '8-14 Days', '15+ Days'
              ].map(dur => (
                <button 
                  key={dur}
                  onClick={() => { updateForm('duration', dur); nextStep(); }}
                  className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 flex items-center justify-between ${
                    formData.duration === dur 
                      ? 'bg-[#1A3326] border-[#1A3326] text-white shadow-lg scale-105'
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-lg">{dur}</span>
                  {formData.duration === dur && <CheckCircle className="text-[#D4AF37]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Budget */}
        {step === 8 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">Estimated Budget</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">Helping us tailor the perfect experiences within your range.</p>
            </div>
            
            <div className="space-y-4">
              {[
                'Ultra Luxury ($20,000+)',
                'Luxury ($10,000 - $20,000)',
                'Premium ($5,000 - $10,000)',
                'No Preference'
              ].map(budget => (
                <button 
                  key={budget}
                  onClick={() => { updateForm('budget', budget); nextStep(); }}
                  className={`w-full p-6 rounded-3xl border-2 text-left transition-all duration-300 flex items-center justify-between ${
                    formData.budget === budget 
                      ? 'bg-[#1A3326] border-[#1A3326] text-white shadow-lg scale-[1.02]'
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-800 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-lg">{budget}</span>
                  {formData.budget === budget && <CheckCircle className="text-[#D4AF37]" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 9: Special Requests & Submit */}
        {step === 9 && (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1A3326]">Final Details</h1>
              <p className="text-sm md:text-base text-gray-500 font-medium">Tell us anything else that would make this trip unforgettable...</p>
            </div>
            
            <div>
              <textarea 
                value={formData.specialRequests}
                onChange={(e) => updateForm('specialRequests', e.target.value)}
                placeholder="e.g., We are celebrating our 10th anniversary. I am allergic to shellfish. We'd love to have a private dinner in the bush..."
                rows={6}
                className="w-full bg-white border-2 border-gray-100 rounded-3xl p-6 text-lg font-medium text-gray-900 focus:outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition placeholder-gray-300 resize-none"
              />
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="w-full mt-12 flex items-center justify-between">
          <button 
            onClick={prevStep}
            className={`px-6 py-4 rounded-2xl font-bold text-sm transition ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white hover:bg-slate-50 text-gray-600 shadow-sm border border-gray-100'
            }`}
          >
            Back
          </button>
          
          {step < 9 ? (
            <button 
              onClick={nextStep}
              className="px-8 py-4 rounded-2xl font-bold text-sm transition bg-[#1A3326] hover:bg-[#12241b] text-white shadow-md flex items-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              onClick={() => onSubmit(formData)}
              className="px-10 py-4 rounded-2xl font-bold text-base transition bg-[#D4AF37] hover:bg-[#b08d29] text-white shadow-lg flex items-center gap-2 uppercase tracking-widest"
            >
              Submit Request <ArrowRight size={18} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
