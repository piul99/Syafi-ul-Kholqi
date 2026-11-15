import React, { useState, useEffect, useRef } from 'react';
import {
  normalizeImageUrl,
  getAlternativeImageUrls,
  FALLBACK_PORTFOLIO_IMAGE,
} from '../utils/imageUrlHelper';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  eager?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  eager = false,
}) => {
  const candidatesRef = useRef<string[]>([]);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [currentSrc, setCurrentSrc] = useState<string>(() => normalizeImageUrl(src));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const list = getAlternativeImageUrls(src);
    candidatesRef.current = list;
    setCandidateIndex(0);
    const initial = list[0] || normalizeImageUrl(src);
    setCurrentSrc(initial);
    setIsFailed(false);

    // If image is already cached or immediate base64
    if (imgRef.current && (imgRef.current.complete || imgRef.current.naturalWidth > 0)) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [src]);

  // Check if image is loaded after currentSrc changes
  useEffect(() => {
    if (imgRef.current && (imgRef.current.complete && imgRef.current.naturalWidth > 0)) {
      setIsLoading(false);
    }

    // Safety timeout: Never keep the image hidden if the browser didn't emit onLoad (e.g. cached or iframe quirks)
    const timer = setTimeout(() => {
      if (imgRef.current && (imgRef.current.complete || imgRef.current.naturalWidth > 0)) {
        setIsLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    setIsFailed(false);
  };

  const handleError = () => {
    const candidates = candidatesRef.current;
    const nextIndex = candidateIndex + 1;

    if (nextIndex < candidates.length) {
      setCandidateIndex(nextIndex);
      setCurrentSrc(candidates[nextIndex]);
      setIsLoading(true);
    } else if (currentSrc !== FALLBACK_PORTFOLIO_IMAGE) {
      setCurrentSrc(FALLBACK_PORTFOLIO_IMAGE);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setIsFailed(true);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-slate-100/90 backdrop-blur-xs flex items-center justify-center">
          <span className="material-symbols-outlined text-indigo-400 text-[22px] animate-spin">
            progress_activity
          </span>
        </div>
      )}

      {/* Main Image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        referrerPolicy="no-referrer"
        loading={eager ? 'eager' : 'lazy'}
      />

      {/* If completely failed and reached final state */}
      {isFailed && (
        <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center p-3 text-center text-[#464555]">
          <span className="material-symbols-outlined text-[26px] text-amber-500 mb-1">
            broken_image
          </span>
          <span className="text-[10px] font-semibold text-slate-500 line-clamp-1">{alt}</span>
          <span className="text-[9px] text-slate-400 mt-0.5">Gambar tidak dapat dimuat</span>
        </div>
      )}
    </div>
  );
};
