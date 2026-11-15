import React, { useState } from 'react';
import { LOGO_TIERS, SINGLE_SERVICES } from '../data/servicesData';
import { TabType, LogoTier, SingleService } from '../types';

interface ServicesViewProps {
  onSelectPackage: (categoryValue: string) => void;
  onNavigateTab: (tab: TabType) => void;
  tiers?: LogoTier[];
  singles?: SingleService[];
  onOpenSpreadsheetMenu?: () => void;
  isCustomLoaded?: boolean;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  onSelectPackage,
  onNavigateTab,
  tiers,
  singles,
  onOpenSpreadsheetMenu,
  isCustomLoaded,
}) => {
  const activeTiers = tiers && tiers.length > 0 ? tiers : LOGO_TIERS;
  const activeSingles = singles && singles.length > 0 ? singles : SINGLE_SERVICES;

  const [catalogType, setCatalogType] = useState<'logo' | 'single'>('logo');
  const [singleCategoryFilter, setSingleCategoryFilter] = useState<string>('Semua');

  const filteredSingleServices = activeSingles.filter((svc) => {
    if (singleCategoryFilter === 'Semua') return true;
    return svc.category === singleCategoryFilter;
  });

  return (
    <div className="space-y-5 pb-24">
      {/* Page Title & Value Proposition */}
      <section className="text-left space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#4f46e5] text-[10px] font-bold border border-indigo-100">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>Katalog Produk Kreatif 2025</span>
            </div>
            {isCustomLoaded && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#006e4b] text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006e4b]"></span>
                <span>Google Sheets Sync</span>
              </span>
            )}
          </div>

          {onOpenSpreadsheetMenu && (
            <button
              type="button"
              onClick={onOpenSpreadsheetMenu}
              title="Kelola data lewat Google Sheets"
              className="p-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006e4b] text-[11px] font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">table_chart</span>
              <span>Edit Sheet</span>
            </button>
          )}
        </div>
        <h1 className="text-[24px] font-bold text-[#131b2e] tracking-tight">
          Katalog Layanan & Paket
        </h1>
        <p className="text-[12px] text-[#464555] leading-relaxed">
          Pilih paket terstandarisasi untuk branding cepat atau kustom desain satuan.
        </p>
      </section>

      {/* Segmented Catalog Switcher */}
      <section>
        <div className="p-1 rounded-2xl bg-slate-200/60 backdrop-blur-md flex items-center border border-slate-300/40 shadow-2xs">
          <button
            type="button"
            onClick={() => setCatalogType('logo')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[12px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              catalogType === 'logo'
                ? 'bg-white text-[#3525cd] shadow-xs'
                : 'text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span>Paket Logo Komplit</span>
          </button>
          <button
            type="button"
            onClick={() => setCatalogType('single')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-[12px] font-medium transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              catalogType === 'single'
                ? 'bg-white text-[#3525cd] font-bold shadow-xs'
                : 'text-[#464555] hover:text-[#131b2e]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Layanan Satuan Desain</span>
          </button>
        </div>
      </section>

      {/* SECTION 1: PAKET LOGO KOMPLIT */}
      {catalogType === 'logo' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-[17px] font-bold text-[#131b2e]">Paket Desain Logo</h2>
              <p className="text-[11px] text-[#464555]">Solusi identitas brand bisnis & UMKM</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-[#3525cd]">
              Garansi Kualitas
            </span>
          </div>

          {/* Tier Cards Stack */}
          <div className="space-y-3.5">
            {activeTiers.map((tier) => {
              if (tier.id === 'gold' || tier.isPopular) {
                return (
                  <div
                    key={tier.id}
                    className="relative rounded-2xl backdrop-blur-2xl bg-white/95 border-2 border-[#3525cd] p-5 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-200/50 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-bl-xl text-[10px] bg-[#3525cd] text-white font-bold shadow-2xs">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span>Paling Populer</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-start mb-2 mt-1">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-[#3525cd] font-bold mb-1.5">
                          {tier.tierLabel}
                        </span>
                        <h3 className="text-[20px] font-bold text-[#3525cd]">{tier.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[20px] font-extrabold text-[#3525cd]">{tier.price}</div>
                        <span className="text-[11px] text-[#464555]">estimasi 1–2 hari</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-indigo-100 text-[11px] text-[#131b2e]">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#3525cd]">
                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                        <span>{tier.timeline}</span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#3525cd]">
                        <span className="material-symbols-outlined text-[14px]">published_with_changes</span>
                        <span>{tier.revisions}</span>
                      </span>
                    </div>

                    <ul className="space-y-2.5 mb-5 text-[12px] text-[#131b2e]">
                      {tier.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[#3525cd] text-[18px] shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <span>
                            {feat.boldPrefix && <strong>{feat.boldPrefix}</strong>}
                            {feat.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => onSelectPackage(tier.orderValue)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#4f46e5] text-white text-[13px] font-bold shadow-md shadow-indigo-500/25 hover:bg-[#3525cd] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span>Pilih & Pesan Sekarang</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl backdrop-blur-xl bg-white/70 border p-5 shadow-2xs hover:shadow-md transition-all relative overflow-hidden ${
                    tier.id === 'platinum' ? 'border-[#00687a]/30' : 'border-white/90'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1.5 ${
                          tier.id === 'platinum'
                            ? 'bg-cyan-100 text-[#00687a]'
                            : 'bg-slate-100 text-[#464555]'
                        }`}
                      >
                        {tier.tierLabel}
                      </span>
                      <h3 className="text-[18px] font-bold text-[#131b2e]">{tier.name}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-[18px] font-extrabold text-[#131b2e]">{tier.price}</div>
                      <span className="text-[11px] text-[#464555]">
                        {tier.id === 'platinum' ? 'VIP Antrean Prioritas' : 'estimasi 2–3 hari'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3.5 pb-3 border-b border-slate-200/50 text-[11px] text-[#464555]">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        tier.id === 'platinum' ? 'text-[#00687a] font-semibold' : 'text-[#3525cd]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {tier.id === 'platinum' ? 'priority_high' : 'schedule'}
                      </span>
                      <span>{tier.timeline}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`inline-flex items-center gap-1 ${
                        tier.id === 'platinum' ? 'text-[#00687a] font-semibold' : 'text-[#3525cd]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {tier.id === 'platinum' ? 'all_inclusive' : 'update'}
                      </span>
                      <span>{tier.revisions}</span>
                    </span>
                  </div>

                  <ul className="space-y-2 mb-4 text-[12px] text-[#464555]">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span
                          className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${
                            tier.id === 'platinum' ? 'text-[#00687a]' : 'text-slate-400'
                          }`}
                        >
                          check_circle
                        </span>
                        <span>
                          {feat.boldPrefix && <strong>{feat.boldPrefix}</strong>}
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => onSelectPackage(tier.orderValue)}
                    className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-[13px] font-bold active:scale-[0.98] transition-all cursor-pointer ${
                      tier.id === 'platinum'
                        ? 'bg-[#00687a] text-white hover:bg-[#005260] shadow-sm'
                        : 'bg-white border border-slate-300/80 text-[#131b2e] hover:bg-slate-50'
                    }`}
                  >
                    <span>Pilih & Pesan Sekarang</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Comparison Table */}
          <section className="rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60 p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#3525cd] text-[18px]">table_chart</span>
              <h3 className="text-[14px] font-bold text-[#131b2e]">Bandingkan Fitur Paket</h3>
            </div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200/60 text-[#464555]">
                    <th className="py-2 px-1.5 font-semibold">Fitur</th>
                    <th className="py-2 px-1 text-center font-semibold">Silver</th>
                    <th className="py-2 px-1 text-center font-bold text-[#3525cd]">Gold</th>
                    <th className="py-2 px-1 text-center font-bold text-[#00687a]">Platinum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#131b2e]">
                  <tr>
                    <td className="py-2 px-1.5 font-medium">Warna Logo</td>
                    <td className="py-2 px-1 text-center text-[#464555]">B/W</td>
                    <td className="py-2 px-1 text-center font-bold text-[#3525cd]">Full Color</td>
                    <td className="py-2 px-1 text-center font-bold text-[#00687a]">Full Color</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1.5 font-medium">Format File</td>
                    <td className="py-2 px-1 text-center text-[#464555]">PNG, JPG</td>
                    <td className="py-2 px-1 text-center font-medium">PNG, JPG, PDF</td>
                    <td className="py-2 px-1 text-center font-semibold">Lengkap + Master</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1.5 font-medium">Master File (AI/EPS)</td>
                    <td className="py-2 px-1 text-center text-slate-300">—</td>
                    <td className="py-2 px-1 text-center text-slate-300">—</td>
                    <td className="py-2 px-1 text-center text-[#00687a] font-bold">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1.5 font-medium">3D Mockup Realistis</td>
                    <td className="py-2 px-1 text-center text-slate-300">—</td>
                    <td className="py-2 px-1 text-center text-[#3525cd] font-bold">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </td>
                    <td className="py-2 px-1 text-center text-[#00687a] font-bold">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1.5 font-medium">Maksimal Revisi</td>
                    <td className="py-2 px-1 text-center text-[#464555]">2x Minor</td>
                    <td className="py-2 px-1 text-center font-bold text-[#3525cd]">3x Fleksibel</td>
                    <td className="py-2 px-1 text-center font-bold text-[#00687a]">Maksimal</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1.5 font-medium">Waktu Pengerjaan</td>
                    <td className="py-2 px-1 text-center text-[#464555]">2–3 Hari</td>
                    <td className="py-2 px-1 text-center font-bold text-[#3525cd]">1–2 Hari</td>
                    <td className="py-2 px-1 text-center font-bold text-[#00687a]">Prioritas VIP</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* SECTION 2: LAYANAN SATUAN DESAIN */}
      {catalogType === 'single' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-[17px] font-bold text-[#131b2e]">Layanan Satuan Desain</h2>
              <p className="text-[11px] text-[#464555]">Pesan kebutuhan satuan dengan cepat</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-[#4f46e5] text-[10px] font-semibold">
              10 Layanan Aktif
            </span>
          </div>

          {/* Category Tag Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
            {['Semua', 'Branding & Cetak', 'Sosial Media', 'Ilustrasi', 'Formal'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSingleCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-[11px] shrink-0 font-medium transition-all cursor-pointer ${
                  singleCategoryFilter === cat
                    ? 'bg-[#3525cd] text-white font-bold shadow-2xs'
                    : 'bg-white/80 border border-slate-200 text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Productized Services List / Accordions */}
          <div className="space-y-2">
            {filteredSingleServices.map((svc, index) => (
              <details
                key={svc.id}
                open={index === 0}
                className="group rounded-xl backdrop-blur-lg bg-white/80 border border-white/95 p-3 shadow-2xs transition-all open:ring-1 open:ring-indigo-300 open:shadow-xs"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded bg-indigo-50 text-[#3525cd] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">{svc.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[12px] font-bold text-[#131b2e] leading-tight truncate">{svc.title}</h3>
                        <span className="px-1 py-[2px] rounded text-[8px] font-bold bg-indigo-100 text-[#3525cd] tracking-wide leading-none shrink-0">
                          {svc.badge}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-[#3525cd] leading-tight mt-0.5 block">{svc.price}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-open:rotate-180 transition-transform text-[16px] shrink-0">
                    expand_more
                  </span>
                </summary>

                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                  <p className="text-[11px] text-[#464555] leading-snug">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#464555] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-[#006e4b]">timer</span>
                      <span>{svc.turnaround}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectPackage(svc.orderValue)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#4f46e5] text-white text-[10px] font-bold shadow-2xs hover:bg-[#3525cd] active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">add</span>
                      <span>Pesan</span>
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Consultation Card */}
      <section className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-100/60 via-cyan-100/40 to-white/70 border border-white/90 backdrop-blur-md text-center space-y-2">
        <div className="w-9 h-9 mx-auto rounded-full bg-white text-[#3525cd] flex items-center justify-center shadow-2xs">
          <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
        </div>
        <h3 className="text-[14px] font-bold text-[#131b2e]">
          Butuh Paket Kustom atau Bundling?
        </h3>
        <p className="text-[12px] text-[#464555]">
          Diskusikan kebutuhan spesifik proyek Anda langsung dengan desainer.
        </p>
        <button
          type="button"
          onClick={() => onNavigateTab('order')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#4f46e5] text-white text-[12px] font-bold shadow-sm hover:bg-[#3525cd] active:scale-95 transition-all cursor-pointer mt-1"
        >
          <span className="material-symbols-outlined text-[15px]">support_agent</span>
          <span>Mulai Konsultasi Gratis</span>
        </button>
      </section>

      {/* Sticky Bottom WhatsApp Order / Quick Help Banner */}
      <aside className="fixed bottom-20 left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="max-w-[420px] mx-auto pointer-events-auto">
          <div className="rounded-2xl bg-[#131b2e]/90 text-white backdrop-blur-xl px-3.5 py-2.5 shadow-lg border border-white/15 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#6ffbbe] text-[#002113] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </div>
              <div className="truncate">
                <p className="text-[12px] font-bold text-white truncate">Bingung memilih paket?</p>
                <p className="text-[10px] text-slate-300 truncate">Konsultasi cepat via WhatsApp</p>
              </div>
            </div>
            <a
              href="https://wa.me/6285326683150?text=Halo%20Syafi'ul%20Kholqi%2C%20saya%20ingin%20konsultasi%20paket%20desain%20Piulistrator."
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-[11px] font-bold hover:bg-[#20ba5a] transition-colors shadow-2xs cursor-pointer"
            >
              <span>Tanya WA</span>
              <span className="material-symbols-outlined text-[13px]">arrow_outward</span>
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
};
