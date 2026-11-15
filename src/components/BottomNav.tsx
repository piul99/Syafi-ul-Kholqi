import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center pointer-events-none pb-4">
      <div className="pointer-events-auto max-w-[360px] w-[calc(100%-2rem)] bg-white/85 backdrop-blur-2xl rounded-full border border-indigo-100/60 shadow-[0_12px_36px_rgba(79,70,229,0.12)] p-1.5 flex items-center justify-between ring-1 ring-white/60">
        {/* WORK TAB */}
        <button
          type="button"
          onClick={() => onChangeTab('work')}
          className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === 'work'
              ? 'bg-[#4f46e5] text-white rounded-full px-5 py-2 font-bold shadow-sm'
              : 'text-[#464555] px-4 py-2 font-medium hover:text-[#131b2e] hover:bg-indigo-50/40 rounded-full active:scale-95'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: activeTab === 'work' ? "'FILL' 1" : "'FILL' 0" }}
          >
            palette
          </span>
          <span className="text-[10px] tracking-wider uppercase mt-0.5">WORK</span>
        </button>

        {/* SERVICES TAB */}
        <button
          type="button"
          onClick={() => onChangeTab('services')}
          className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === 'services'
              ? 'bg-[#4f46e5] text-white rounded-full px-5 py-2 font-bold shadow-sm'
              : 'text-[#464555] px-4 py-2 font-medium hover:text-[#131b2e] hover:bg-indigo-50/40 rounded-full active:scale-95'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: activeTab === 'services' ? "'FILL' 1" : "'FILL' 0" }}
          >
            auto_awesome
          </span>
          <span className="text-[10px] tracking-wider uppercase mt-0.5">SERVICES</span>
        </button>

        {/* ORDER TAB */}
        <button
          type="button"
          onClick={() => onChangeTab('order')}
          className={`flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
            activeTab === 'order'
              ? 'bg-[#4f46e5] text-white rounded-full px-5 py-2 font-bold shadow-sm'
              : 'text-[#464555] px-4 py-2 font-medium hover:text-[#131b2e] hover:bg-indigo-50/40 rounded-full active:scale-95'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={{ fontVariationSettings: activeTab === 'order' ? "'FILL' 1" : "'FILL' 0" }}
          >
            shopping_bag
          </span>
          <span className="text-[10px] tracking-wider uppercase mt-0.5">ORDER</span>
        </button>
      </div>
    </nav>
  );
};
