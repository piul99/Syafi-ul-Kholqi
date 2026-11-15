import React, { useState } from 'react';
import { Instagram } from 'lucide-react';
import { PORTFOLIO_ITEMS, CATEGORY_CHIPS } from '../data/portfolioData';
import { PortfolioItem, TabType } from '../types';
import { PortfolioLightbox } from './PortfolioLightbox';
import { SmartImage } from './SmartImage';

interface WorkViewProps {
  onNavigateTab: (tab: TabType, categoryToSelect?: string) => void;
  items?: PortfolioItem[];
  onOpenSpreadsheetMenu?: () => void;
  isCustomLoaded?: boolean;
}

export const WorkView: React.FC<WorkViewProps> = ({
  onNavigateTab,
  items,
}) => {
  const allItems = items && items.length > 0 ? items : PORTFOLIO_ITEMS;
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const filteredItems = allItems.filter((item) => {
    return activeCategory === 'all' || item.categorySlug === activeCategory || item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleOrderThis = (categoryValue: string) => {
    setSelectedItem(null);
    onNavigateTab('order', categoryValue);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* 1. Compact Intro & CTA */}
      <section className="rounded-2xl p-3.5 backdrop-blur-[18px] bg-white/75 border border-white/90 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.05),0_4px_12px_-2px_rgba(99,102,241,0.04)] relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-gradient-to-br from-indigo-200/40 via-cyan-200/30 to-transparent rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 space-y-2.5">
          <p className="text-[11.5px] font-bold text-[#131b2e] leading-relaxed">
            Graphic Designer & Digital Illustrator berbasis di Kudus. Berpengalaman menangani Branding Product, Logo, Social Media Specialist, Brosur, Poster, Banner, Pixel Art, Sertifikat, Twibbon, dll.
          </p>

          <button
            type="button"
            onClick={() => onNavigateTab('order')}
            className="w-full h-[36px] flex items-center justify-center gap-1.5 px-4 rounded-full bg-[#3525cd] hover:bg-[#4f46e5] text-white text-[12.5px] font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>Konsultasi/Order</span>
          </button>

          {/* IG & TikTok di bawah Konsultasi/Order */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://www.instagram.com/kang_piul05/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-[32px] flex items-center justify-center gap-1.5 px-3 rounded-full bg-white hover:bg-gradient-to-r hover:from-[#fd5949]/10 hover:to-[#d6249f]/15 border border-pink-200/80 hover:border-pink-300 text-[#131b2e] hover:text-[#d6249f] transition-all text-[11px] font-semibold shadow-2xs active:scale-95 group"
              title="Kunjungi Instagram @kang_piul05"
            >
              <Instagram className="w-3.5 h-3.5 text-[#e1306c] group-hover:scale-110 transition-transform shrink-0" />
              <span>@kang_piul05</span>
            </a>

            <a
              href="https://www.tiktok.com/@pikpukkkk"
              target="_blank"
              rel="noopener noreferrer"
              className="h-[32px] flex items-center justify-center gap-1.5 px-3 rounded-full bg-white hover:bg-slate-900 hover:text-white border border-slate-200/80 hover:border-slate-800 text-[#131b2e] transition-all text-[11px] font-semibold shadow-2xs active:scale-95 group"
              title="Kunjungi TikTok @pikpukkkk"
            >
              <svg
                className="w-3.5 h-3.5 fill-current text-slate-800 group-hover:text-white group-hover:scale-110 transition-transform shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43V12.1a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.53z" />
              </svg>
              <span>@pikpukkkk</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Main Portfolio Grid Section (immediately visible above the fold) */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[19px] font-bold text-[#131b2e] tracking-tight">Portofolio Karya</h2>
            <p className="text-[11.5px] text-[#464555] mt-0.5">
              {allItems.length} Desain & Ilustrasi Digital Terpilih
            </p>
          </div>
        </div>

        {/* Category Filter Chips (Horizontal Scrollable) */}
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-2 py-2.5 bg-[#e5e6fd]">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = activeCategory === chip.slug;
            return (
              <button
                key={chip.slug}
                type="button"
                onClick={() => setActiveCategory(chip.slug)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#3525cd] text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white/70 backdrop-blur-md border border-slate-200/80 text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                {chip.slug === 'all' && (
                  <span className="material-symbols-outlined text-[14px]">apps</span>
                )}
                <span>{chip.label}</span>
                {chip.count && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#464555]'
                    }`}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Portfolio 2-Column Responsive Grid with Compact Glass Overlay Preview */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative rounded-2xl bg-white/80 backdrop-blur-lg border border-white/90 overflow-hidden shadow-[0_6px_18px_-4px_rgba(15,23,42,0.06)] hover:shadow-xl hover:border-indigo-300 transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Full Uncropped Aspect Ratio Showcase Container */}
              <div className="relative w-full aspect-square sm:aspect-[4/3] overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/60 flex items-center justify-center p-1">
                <SmartImage
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges on Top */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1 pointer-events-none z-10">
                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#3525cd]/90 backdrop-blur-xs text-white text-[9px] font-bold tracking-tight shadow-2xs inline-flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[10px]">
                        {item.badgeType === 'tertiary' ? 'stars' : 'emoji_events'}
                      </span>
                      {item.badge}
                    </span>
                  ) : <div />}
                  <span className="w-5 h-5 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white shadow-2xs ml-auto border border-white/20">
                    <span className="material-symbols-outlined text-[11px]">open_in_full</span>
                  </span>
                </div>

                {/* Ultra-Sleek Glass Overlay: Minimal height, translucent dark-tint gradient for maximum image visibility and high-contrast text */}
                <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/85 via-black/55 to-transparent backdrop-blur-[2px] transition-all duration-300 group-hover:from-black/95">
                  <div className="flex items-center justify-between gap-1 leading-none">
                    <span className="text-[8.5px] text-amber-300 font-black uppercase tracking-wider truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      {item.category}
                    </span>
                    <span className="text-[8px] font-bold text-white bg-black/50 border border-white/25 px-1 py-0.2 rounded shrink-0 shadow-xs">
                      {item.year || '2025'}
                    </span>
                  </div>

                  <h3 className="text-[11.5px] font-normal text-white leading-tight line-clamp-1 mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[9px] text-zinc-100 mt-0.5 leading-none">
                    <span className="truncate max-w-[85px] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" title={item.client}>
                      {item.client}
                    </span>
                    <span className="text-[8.5px] font-bold text-white group-hover:text-amber-200 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                      Lihat <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* 3. Value Proposition Chips */}
        <section className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar -mx-4 px-4">
          <div className="h-[30.33px] shrink-0 flex items-center gap-1.5 px-3 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-2xs text-[#131b2e]">
            <span className="material-symbols-outlined text-[#006e4b] text-[15px]">bolt</span>
            <span className="text-[11px] font-medium">Respon Cepat</span>
          </div>
          <div className="h-[30.33px] shrink-0 flex items-center gap-1.5 px-3 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-2xs text-[#131b2e]">
            <span className="material-symbols-outlined text-[#00687a] text-[15px]">print</span>
            <span className="text-[11px] font-medium">Format Digital & Siap Cetak</span>
          </div>
          <div className="h-[30.33px] shrink-0 flex items-center gap-1.5 px-3 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-2xs text-[#131b2e]">
            <span className="material-symbols-outlined text-[#4f46e5] text-[15px]">draw</span>
            <span className="text-[11px] font-medium">Revisi Memuaskan</span>
          </div>
        </section>

        {/* 4. Highlight & Pencapaian (2x2 Bento) */}
        <section className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[#4f46e5] shadow-2xs">
                <span className="material-symbols-outlined text-[16px]">emoji_events</span>
              </div>
              <h2 className="text-[15px] font-bold text-[#131b2e] tracking-tight">
                Highlight & Pencapaian
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#4f46e5] px-2 py-0.5 rounded-full bg-indigo-100">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Card 1 */}
            <div className="rounded-2xl p-3 backdrop-blur-md bg-white/70 border border-white/90 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shadow-2xs">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    trophy
                  </span>
                </div>
                <h3 className="text-[12px] font-bold text-[#131b2e] leading-tight">
                  Juara 3 Rebranding Logo
                </h3>
              </div>
              <p className="text-[10px] text-[#464555] leading-snug mt-auto pt-2 border-t border-slate-200/50">
                SD 'Aisyiyah Multilingual Darussalam Kudus (2024)
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl p-3 backdrop-blur-md bg-white/70 border border-white/90 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-[#4f46e5] shadow-2xs">
                  <span className="material-symbols-outlined text-[20px]">military_tech</span>
                </div>
                <h3 className="text-[12px] font-bold text-[#131b2e] leading-tight">
                  Best Creative Design
                </h3>
              </div>
              <p className="text-[10px] text-[#464555] leading-snug mt-auto pt-2 border-t border-slate-200/50">
                OSINAS Cover Buku Sejarah Islam (2025)
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl p-3 backdrop-blur-md bg-white/70 border border-white/90 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-[#00687a] shadow-2xs">
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </div>
                <h3 className="text-[12px] font-bold text-[#131b2e] leading-tight">
                  150+ Karya Selesai
                </h3>
              </div>
              <p className="text-[10px] text-[#464555] leading-snug mt-auto pt-2 border-t border-slate-200/50">
                Portofolio beragam klien & institusi
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl p-3 backdrop-blur-md bg-white/70 border border-white/90 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#464555] shadow-2xs">
                  <span className="material-symbols-outlined text-[20px]">work_history</span>
                </div>
                <h3 className="text-[12px] font-bold text-[#131b2e] leading-tight">
                  Freelance sejak 2024
                </h3>
              </div>
              <p className="text-[10px] text-[#464555] leading-snug mt-auto pt-2 border-t border-slate-200/50">
                Fokus kepuasan & ketepatan waktu
              </p>
            </div>
          </div>
        </section>

        {/* Gallery Micro Footer */}
        <div className="pt-4 text-center">
          <div className="inline-flex items-center justify-center gap-1.5 p-2 px-4 rounded-full bg-white/60 border border-slate-200/50 text-[#464555] text-[11px] font-medium">
            <span className="material-symbols-outlined text-[14px] text-[#3525cd]">bolt</span>
            <span>Semua karya asli karya Syafi'ul Kholqi (Piulistrator)</span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <PortfolioLightbox
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onOrderThis={handleOrderThis}
        currentIndex={selectedItem ? allItems.findIndex((i) => i.id === selectedItem.id) + 1 : 1}
        totalCount={allItems.length}
      />
    </div>
  );
};
