import React from 'react';
import { PortfolioItem } from '../types';
import { SmartImage } from './SmartImage';

interface PortfolioLightboxProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onOrderThis: (categoryValue: string) => void;
  currentIndex?: number;
  totalCount?: number;
}

export const PortfolioLightbox: React.FC<PortfolioLightboxProps> = ({
  item,
  onClose,
  onOrderThis,
  currentIndex = 1,
  totalCount = 150,
}) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#131b2e]/60 backdrop-blur-xl p-0 sm:p-4 transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] bg-white rounded-t-[32px] sm:rounded-[28px] overflow-hidden shadow-2xl border border-white/80 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-white/90 backdrop-blur-md border-b border-indigo-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006e4b] animate-pulse"></span>
            <span className="text-[13px] font-bold text-[#131b2e]">Detail Portofolio</span>
            <span className="text-[11px] text-[#4f46e5] bg-[#e2dfff]/60 px-2 py-0.5 rounded-full font-semibold">
              {currentIndex} / {totalCount}
            </span>
          </div>
          <button
            type="button"
            aria-label="Tutup Lightbox"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#131b2e] hover:bg-slate-200 transition-colors active:scale-90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="overflow-y-auto no-scrollbar p-5 space-y-4">
          {/* Showcase Image - Full uncropped ratio */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/5 to-slate-900/10 border border-slate-200/80 overflow-hidden shadow-inner flex items-center justify-center p-2.5 min-h-[240px] max-h-[52vh]">
            <SmartImage
              src={item.hiResImageUrl || item.imageUrl}
              alt={item.title}
              eager={true}
              className="w-full h-auto max-h-[48vh] object-contain rounded-xl shadow-xs"
            />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <a
                href={item.hiResImageUrl || item.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-[#131b2e]/80 hover:bg-[#131b2e] text-white font-semibold text-[10px] backdrop-blur-md flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title="Buka gambar ukuran penuh di tab baru"
              >
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                <span>Resolusi Penuh</span>
              </a>
            </div>
            {item.badge && (
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-[#4f46e5] text-white font-bold text-[10px] shadow-sm inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  {item.badge}
                </span>
              </div>
            )}
          </div>

          {/* Direct CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onOrderThis(item.orderCategoryValue)}
              className="w-full py-3.5 px-4 rounded-full bg-[#4f46e5] hover:bg-[#3525cd] text-white font-bold text-[14px] text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              <span>Pesan Desain Seperti Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
