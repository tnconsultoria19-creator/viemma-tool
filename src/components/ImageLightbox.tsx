import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Compass, Image as ImageIcon } from 'lucide-react';

export interface LightboxImage {
  url: string;
  title?: string;
  caption?: string;
  category?: string;
}

interface ImageLightboxProps {
  isOpen: boolean;
  images: (string | LightboxImage)[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  images,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Normalize image list
  const normalizedImages: LightboxImage[] = images.map((img) => {
    if (typeof img === 'string') {
      return { url: img, title: 'South African Journey Experience' };
    }
    return img;
  }).filter(img => Boolean(img.url));

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, normalizedImages.length - 1)));
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex, normalizedImages.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : normalizedImages.length - 1));
  }, [normalizedImages.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < normalizedImages.length - 1 ? prev + 1 : 0));
  }, [normalizedImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!isOpen || normalizedImages.length === 0) return null;

  const current = normalizedImages[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between z-10 max-w-5xl mx-auto w-full pt-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white/15 text-[#D4AF37] text-xs font-bold tracking-wider uppercase border border-white/10">
            {current.category || 'Viemma Gallery'}
          </span>
          <span className="text-gray-300 text-xs font-medium">
            {currentIndex + 1} / {normalizedImages.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition border border-white/10 active:scale-95"
            aria-label="Close Image Viewer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full my-auto overflow-hidden">
        {/* Previous Button (Desktop) */}
        {normalizedImages.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/20 flex items-center justify-center transition shadow-lg active:scale-95"
            aria-label="Previous Image"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Current Image Display */}
        <div className="relative max-h-[75vh] w-full flex items-center justify-center">
          <img
            src={current.url}
            alt={current.title || 'Itinerary photograph'}
            className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300 animate-in zoom-in-95"
            onError={(e) => {
              // Graceful fallback to luxury safari image on load error
              (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/32456962/pexels-photo-32456962.jpeg?auto=compress&cs=tinysrgb&w=1920';
            }}
          />
        </div>

        {/* Next Button (Desktop) */}
        {normalizedImages.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/20 flex items-center justify-center transition shadow-lg active:scale-95"
            aria-label="Next Image"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Bottom Caption & Thumbnail Strip */}
      <div className="max-w-5xl mx-auto w-full space-y-2.5 z-10 pb-1">
        {/* Caption */}
        {(current.title || current.caption) && (
          <div className="text-center px-4">
            <h4 className="text-sm sm:text-base font-serif font-bold text-white leading-tight drop-shadow-sm">
              {current.title}
            </h4>
            {current.caption && (
              <p className="text-xs text-gray-300 max-w-xl mx-auto line-clamp-2 mt-0.5">
                {current.caption}
              </p>
            )}
          </div>
        )}

        {/* Swipe Hint on Mobile */}
        <div className="sm:hidden text-center text-[10px] text-gray-400 font-medium">
          ← Swipe left/right to browse gallery →
        </div>

        {/* Thumbnail Preview Strip */}
        {normalizedImages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 px-2 max-w-full scrollbar-none">
            {normalizedImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-12 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                  idx === currentIndex
                    ? 'border-[#D4AF37] scale-105 shadow-md ring-2 ring-[#D4AF37]/40'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
