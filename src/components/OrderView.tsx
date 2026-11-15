import React, { useState, useEffect, useRef } from 'react';
import { DESIGN_CATEGORIES_OPTIONS, getDesignDetails } from '../data/servicesData';
import { OrderFormData } from '../types';

interface OrderViewProps {
  initialCategory?: string;
}

export const OrderView: React.FC<OrderViewProps> = ({ initialCategory }) => {
  const [formData, setFormData] = useState<OrderFormData>({
    clientName: 'tulis nama',
    designCategory: initialCategory || 'Paket Logo Gold (Rp200.000)',
    brief:
      "masukkan ide desain kamu disini.",
    phoneNumber: '8222-1111-0000',
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategory) {
      setFormData((prev) => ({ ...prev, designCategory: initialCategory }));
    }
  }, [initialCategory]);

  const designInfo = getDesignDetails(formData.designCategory);

  const formatCleanPhone = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const generateWhatsAppUrl = () => {
    const adminNumber = '6285326683150';
    const message = `Halo Syafi'ul Kholqi (Piulistrator),
Saya ingin memesan jasa desain:

*Nama:* ${formData.clientName || '-'}
*Jenis Desain:* ${formData.designCategory}
*Estimasi Biaya:* ${designInfo.price}
*Estimasi Waktu:* ${designInfo.timeline.replace('⚡ ', '')}
*Nomor WA:* ${formData.phoneNumber || '-'}

*Brief / Keterangan:*
${formData.brief || '-'}

Mohon informasi langkah selanjutnya untuk pembayaran DP / draft awal. Terima kasih!`;

    return `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      confirmationRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDirectWhatsApp = () => {
    window.open(generateWhatsAppUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header Section */}
      <section className="space-y-1 text-left">
        <div className="inline-flex items-center gap-1 text-[#3525cd] text-[10px] uppercase tracking-wider font-bold">
          <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
          <span>Order Commission</span>
        </div>
        <h1 className="text-[24px] font-bold text-[#131b2e] tracking-tight">
          Formulir Pemesanan Desain
        </h1>
        <p className="text-[12px] text-[#464555] leading-relaxed">
          Isi brief kebutuhan desain Anda, langsung terhubung ke WhatsApp Syafi'ul Kholqi.
        </p>
      </section>

      {/* Order Form Panel (Frosted Glass Container) */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl p-5 space-y-4 shadow-sm"
      >
        {/* Field 1: Nama Lengkap */}
        <div className="space-y-1.5">
          <label
            htmlFor="client-name"
            className="block text-[12px] text-[#131b2e] font-semibold"
          >
            Nama Lengkap <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </span>
            <input
              id="client-name"
              name="client-name"
              type="text"
              required
              placeholder="Masukkan nama lengkap Anda"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="glass-input w-full rounded-xl pl-10 pr-3.5 py-2.5 text-[#131b2e] text-[13px] placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Field 2: Jenis Desain */}
        <div className="space-y-1.5">
          <label
            htmlFor="design-category"
            className="block text-[12px] text-[#131b2e] font-semibold"
          >
            Jenis Desain <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#3525cd]">
              <span className="material-symbols-outlined text-[20px]">category</span>
            </span>
            <select
              id="design-category"
              name="design-category"
              value={formData.designCategory}
              onChange={(e) => setFormData({ ...formData, designCategory: e.target.value })}
              className="glass-input w-full rounded-xl pl-10 pr-9 py-2.5 text-[#131b2e] text-[13px] font-semibold appearance-none bg-none cursor-pointer"
            >
              {DESIGN_CATEGORIES_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#464555]">
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </span>
          </div>
        </div>

        {/* Auto-filled Estimation Row: Field 3 & 4 */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          {/* Field 3: Estimasi Harga */}
          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/60 flex flex-col justify-between">
            <span className="text-[10px] text-[#464555] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#3525cd]">payments</span>
              <span>Estimasi Biaya</span>
            </span>
            <div className="mt-1">
              <span className="text-[17px] text-[#3525cd] font-bold">
                {designInfo.price}
              </span>
            </div>
            <p className="text-[10px] leading-tight text-slate-400 mt-1">
              Lainnya: konsultasi di chat
            </p>
          </div>

          {/* Field 4: Estimasi Pengerjaan */}
          <div className="p-3 rounded-xl bg-teal-50/40 border border-teal-100/60 flex flex-col justify-between">
            <span className="text-[10px] text-[#464555] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#006e4b]">schedule</span>
              <span>Pengerjaan</span>
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#006e4b]/10 text-[#006e4b] text-[11px] font-bold">
                {designInfo.timeline}
              </span>
            </div>
            <p className="text-[10px] leading-tight text-slate-400 mt-1">
              Bisa nego express delivery
            </p>
          </div>
        </div>

        {/* Field 5: Brief / Keterangan Desain */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="design-brief"
              className="block text-[12px] text-[#131b2e] font-semibold"
            >
              Brief / Keterangan Desain <span className="text-[#ba1a1a]">*</span>
            </label>
            <span className="text-[10px] text-[#464555]">Opsional format bebas</span>
          </div>
          <textarea
            id="design-brief"
            name="design-brief"
            required
            rows={3}
            placeholder="Deskripsikan konsep, warna yang disukai, teks yang ingin dicantumkan, atau referensi visual..."
            value={formData.brief}
            onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
            className="glass-input w-full rounded-xl p-3 text-[#131b2e] text-[12px] placeholder:text-slate-400 resize-none leading-relaxed"
          ></textarea>
        </div>

        {/* Field 6: Nomor WhatsApp */}
        <div className="space-y-1.5">
          <label
            htmlFor="phone-number"
            className="block text-[12px] text-[#131b2e] font-semibold"
          >
            Nomor WhatsApp Anda <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="flex rounded-xl glass-input overflow-hidden focus-within:ring-2 focus-within:ring-[#4f46e5]/30 focus-within:border-[#4f46e5]">
            <div className="px-3 py-2.5 bg-slate-100/80 border-r border-slate-200 flex items-center space-x-1">
              <span className="material-symbols-outlined text-[#006e4b] text-[17px]">chat</span>
              <span className="text-[12px] font-bold text-[#131b2e]">+62</span>
            </div>
            <input
              id="phone-number"
              name="phone-number"
              type="tel"
              required
              placeholder="812-xxxx-xxxx"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full bg-transparent border-0 px-3 py-2.5 text-[#131b2e] text-[13px] font-semibold focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-[#464555] flex items-center gap-1 pt-0.5">
            <span className="material-symbols-outlined text-[13px] text-[#006e4b]">verified_user</span>
            <span>Nomor hanya digunakan untuk pengiriman draft dan revisi desain.</span>
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-[#3525cd] to-[#4f46e5] hover:from-[#3021be] hover:to-[#4338ca] text-white py-3.5 px-6 text-[14px] font-bold shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 border border-white/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          <span>Kirim & Lanjut ke WhatsApp</span>
        </button>
      </form>

      {/* Order Confirmation & Success Card (Preview Sheet) */}
      <section
        ref={confirmationRef}
        id="confirmation-modal"
        className="glass-modal rounded-3xl p-5 space-y-4 border-2 border-[#4f46e5]/25 relative overflow-hidden transition-all"
      >
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-[#6ffbbe]/30 rounded-full blur-2xl pointer-events-none"></div>

        {/* Success Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#006e4b] text-white flex items-center justify-center shadow-md shadow-[#006e4b]/30">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 rounded-md bg-[#6ffbbe]/60 text-[#005338] text-[10px] font-bold uppercase tracking-wider">
              Siap Terhubung
            </span>
            <h2 className="text-[16px] text-[#131b2e] font-bold">
              Pesanan Anda Siap Diteruskan!
            </h2>
          </div>
        </div>

        {/* Ringkasan Pesanan Box */}
        <div className="bg-white/80 rounded-2xl p-4 border border-slate-200/60 space-y-2.5">
          <div className="flex justify-between items-center border-b border-slate-200/40 pb-2">
            <span className="text-[#464555] text-[12px]">Pemesan</span>
            <span className="text-[#131b2e] text-[13px] font-bold">
              {formData.clientName || 'Ahmad Fauzi'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/40 pb-2">
            <span className="text-[#464555] text-[12px]">Jenis Desain</span>
            <span className="text-[#3525cd] text-[13px] font-bold text-right truncate max-w-[190px]">
              {formData.designCategory}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200/40 pb-2">
            <span className="text-[#464555] text-[12px]">Estimasi Biaya</span>
            <span className="text-[#131b2e] text-[13px] font-bold">
              {designInfo.price}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#464555] text-[12px]">Waktu Pengerjaan</span>
            <span className="text-[#006e4b] text-[12px] font-bold">
              {designInfo.timeline}
            </span>
          </div>
        </div>

        {/* WhatsApp Direct CTA */}
        <a
          href={generateWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDirectWhatsApp}
          className="w-full py-3.5 px-5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-[14px] font-bold shadow-lg shadow-[#25D366]/30 flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">forum</span>
          <span>Lanjutkan ke WhatsApp</span>
        </a>

        {/* Admin Contact Note */}
        <div className="text-center pt-1">
          <p className="text-[12px] text-[#464555]">
            Admin:{' '}
            <span className="font-bold text-[#131b2e]">0853-2668-3150</span>{' '}
            (Syafi'ul Kholqi)
          </p>
          <span className="text-[10px] text-slate-400">
            Respons kilat 08.00 – 22.00 WIB
          </span>
        </div>
      </section>

      {/* Trust Badges Glass Strip */}
      <div className="flex items-center justify-around py-3 px-2 rounded-xl bg-white/60 border border-white/80 text-[#464555] text-[11px] font-medium shadow-2xs">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[#3525cd] text-[15px]">verified</span>
          <span>Revisi Minor Gratis</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[#3525cd] text-[15px]">high_quality</span>
          <span>File HD & Vektor</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[#3525cd] text-[15px]">lock</span>
          <span>Aman & Terpercaya</span>
        </span>
      </div>
    </div>
  );
};
