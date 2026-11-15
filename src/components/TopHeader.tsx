import React, { useState, useEffect } from 'react';
import { TabType } from '../types';
import { SmartImage } from './SmartImage';

const DEFAULT_PROFILE_PHOTO =
  'https://lh3.googleusercontent.com/a/ACg8ocKpq8olx-Ng7YTnZ81M_Zw3gzwHIl61bGJMYPtTsj2yqzn9iNdD=s96-c';

interface TopHeaderProps {
  activeTab: TabType;
  onSearchClick?: () => void;
  onOpenSpreadsheetMenu?: () => void;
  isSyncing?: boolean;
  onRefreshClick?: () => void;
  profilePhotoUrl?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  onOpenSpreadsheetMenu,
  isSyncing,
  onRefreshClick,
  profilePhotoUrl,
}) => {
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [prevSyncing, setPrevSyncing] = useState(isSyncing);

  useEffect(() => {
    if (prevSyncing && !isSyncing) {
      // Sync just finished
      setShowCheckmark(true);
      const timer = setTimeout(() => {
        setShowCheckmark(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    setPrevSyncing(isSyncing);
  }, [isSyncing, prevSyncing]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-indigo-100/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)] transition-all">
      <div className="flex items-center gap-2.5 w-full px-3.5 py-2.5 max-w-[430px] mx-auto">
        {/* Foto Syafi'ul Kholqi di pojok kiri atas */}
        <div className="w-11 h-11 rounded-2xl border-[1.5px] border-[#3525cd] ring-2 ring-indigo-100/80 shadow-xs overflow-hidden bg-white p-[1.5px] shrink-0">
          <SmartImage
            src={profilePhotoUrl || DEFAULT_PROFILE_PHOTO}
            alt="Syafi'ul Kholqi"
            eager={true}
            className="w-full h-full object-cover rounded-[11px] bg-white"
          />
        </div>

        {/* Info Identitas + Tombol Kanan */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[14px] font-bold text-[#131b2e] tracking-tight truncate">
                Syafi'ul Kholqi
              </span>
              <span
                className="material-symbols-outlined text-[#3525cd] text-[15px] shrink-0 select-none inline-flex items-center"
                style={{ fontVariationSettings: "'FILL' 1" }}
                title="Terverifikasi"
              >
                verified
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isSyncing ? (
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-800 transition-all shadow-2xs">
                  <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                </div>
              ) : showCheckmark ? (
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-emerald-50 border border-emerald-200 text-emerald-600 transition-all shadow-2xs">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                </div>
              ) : onRefreshClick ? (
                <button
                  type="button"
                  onClick={onRefreshClick}
                  title="Perbarui data terbaru dari Google Sheets"
                  className="h-6 w-6 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[12px]">sync</span>
                </button>
              ) : null}

              {onOpenSpreadsheetMenu && (
                <button
                  type="button"
                  onClick={onOpenSpreadsheetMenu}
                  aria-label="Pengaturan Sistem"
                  className="h-6 w-6 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
                  title="Sistem & Pengaturan"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                </button>
              )}

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#006e4b]/10 border border-[#006e4b]/20 text-[#006e4b] text-[9.5px] font-bold tracking-tight shadow-2xs">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e4b] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#006e4b]"></span>
                </span>
                <span className="whitespace-nowrap">{activeTab === 'work' ? 'Available' : 'Open'}</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#4f46e5] font-semibold leading-tight truncate mt-0.5">
            Graphic Designer & Digital Illustrator
          </p>
        </div>
      </div>
    </header>
  );
};
