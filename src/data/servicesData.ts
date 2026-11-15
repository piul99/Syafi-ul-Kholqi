import { LogoTier, SingleService } from '../types';

export const LOGO_TIERS: LogoTier[] = [
  {
    id: 'silver',
    name: 'Silver',
    tierLabel: 'Basic Tier',
    price: 'Rp100.000',
    priceNum: 100000,
    timeline: '2–3 Hari Kerja',
    revisions: '2x Revisi Minor',
    features: [
      { text: 'Logo Monokrom (Hitam & Putih)' },
      { text: 'Format Ekspor High-Res PNG transparan & JPG' },
      { text: 'Resolusi 300 DPI siap pakai di media sosial' },
    ],
    isPopular: false,
    orderValue: 'Paket Logo Silver (Rp100.000)'
  },
  {
    id: 'gold',
    name: 'Gold',
    tierLabel: 'Rekomendasi Utama',
    price: 'Rp200.000',
    priceNum: 200000,
    timeline: '1–2 Hari Prioritas',
    revisions: '3x Revisi Fleksibel',
    features: [
      { text: '(Varian palette warna primer & alternatif)', boldPrefix: 'Logo Full Color ' },
      { text: 'High-Res PNG Transparan, JPG & PDF Siap Cetak' },
      { text: '(Kaos, Kartu Nama, Toko)', boldPrefix: '3D Mockup Visualisasi Realistis ' },
      { text: 'Panduan kode warna HEX / RGB / CMYK' },
    ],
    isPopular: true,
    orderValue: 'Paket Logo Gold (Rp200.000)'
  },
  {
    id: 'platinum',
    name: 'Platinum',
    tierLabel: 'Lengkap & Master File',
    price: 'Rp350.000',
    priceNum: 350000,
    timeline: 'VIP Priority Express',
    revisions: 'Revisi Maksimal',
    features: [
      { text: 'Logo Full Color + Dokumen Filosofi & Konsep Makna Logo' },
      { text: ' (.AI, .EPS, .SVG, .PSD)', boldPrefix: 'Master File Mentah Editable' },
      { text: 'Mockup Komersial Eksklusif + Bebas Konsultasi Langsung' },
    ],
    isPopular: false,
    orderValue: 'Paket Logo Platinum (Rp400.000)'
  }
];

export const SINGLE_SERVICES: SingleService[] = [
  {
    id: 'ig-feed',
    title: 'IG Feed & Poster',
    badge: 'Sosmed',
    category: 'Sosial Media',
    price: 'Mulai Rp50.000',
    priceNum: 50000,
    turnaround: '1 Hari Pengerjaan',
    description: 'Desain visual konten feeds tunggal, carousel panduan, atau poster promosi online beresolusi tajam siap upload.',
    orderValue: 'IG Feed & Poster',
    icon: 'post_add'
  },
  {
    id: 'banner',
    title: 'Banner & Spanduk',
    badge: 'Outdoor',
    category: 'Branding & Cetak',
    price: 'Mulai Rp50.000',
    priceNum: 50000,
    turnaround: '1–2 Hari',
    description: 'Spanduk toko, roll-up banner pameran, atau billboard outdoor disesuaikan skala real & profil warna CMYK mesin cetak.',
    orderValue: 'Banner',
    icon: 'view_carousel'
  },
  {
    id: 'brosur',
    title: 'Brosur / Flyer',
    badge: 'Cetak',
    category: 'Branding & Cetak',
    price: 'Mulai Rp50.000',
    priceNum: 50000,
    turnaround: '1–2 Hari',
    description: 'Layout brosur 1 sisi, 2 sisi, maupun format lipat (trifold/bifold) dengan tipografi rapi dan visual informatif.',
    orderValue: 'Brosur',
    icon: 'menu_book'
  },
  {
    id: 'tshirt',
    title: 'Desain T-Shirt',
    badge: 'Merchandise',
    category: 'Branding & Cetak',
    price: 'Mulai Rp100.000',
    priceNum: 100000,
    turnaround: '2 Hari',
    description: 'Artwork kaos distro/event, file transparan resolusi ultra high 300 DPI siap cetak sablon DTF atau plastisol beserta mockup pakaian realistis.',
    orderValue: 'T-Shirt',
    icon: 'apparel'
  },
  {
    id: 'kaligrafi',
    title: 'Kaligrafi Digital',
    badge: 'Seni Grafis',
    category: 'Ilustrasi',
    price: 'Mulai Rp50.000',
    priceNum: 50000,
    turnaround: '1–2 Hari',
    description: 'Kaligrafi kufi, tsuluts, atau modern lettering digital untuk hiasan dinding, buku, suvenir acara perkawinan.',
    orderValue: 'Kaligrafi Digital',
    icon: 'draw'
  },
  {
    id: 'illustration',
    title: 'Digital Illustration',
    badge: 'Custom Art',
    category: 'Ilustrasi',
    price: 'Mulai Rp100.000',
    priceNum: 100000,
    turnaround: '2–3 Hari',
    description: 'Ilustrasi karakter, avatar potret, atau visual editorial bertema modern khas gaya Piulistrator.',
    orderValue: 'Digital Illustration',
    icon: 'palette'
  },
  {
    id: 'book-cover',
    title: 'Cover Buku',
    badge: 'Editorial',
    category: 'Branding & Cetak',
    price: 'Mulai Rp50.000',
    priceNum: 50000,
    turnaround: '1–2 Hari',
    description: 'Desain lengkap cover depan, punggung buku (spine), dan cover belakang disesuaikan tebal halaman penerbit.',
    orderValue: 'Cover Buku',
    icon: 'auto_stories'
  },
  {
    id: 'certificate',
    title: 'Sertifikat',
    badge: 'Formal',
    category: 'Formal',
    price: 'Mulai Rp25.000',
    priceNum: 25000,
    turnaround: '24 Jam',
    description: 'Sertifikat penghargaan / pelatihan / webinar dengan layout formal elegan & siap cetak nama massal.',
    orderValue: 'Sertifikat',
    icon: 'workspace_premium'
  },
  {
    id: 'twibbon',
    title: 'Twibbon Event',
    badge: 'Campaign',
    category: 'Sosial Media',
    price: 'Mulai Rp25.000',
    priceNum: 25000,
    turnaround: '24 Jam',
    description: 'Bingkai foto transparan untuk kampanye Instagram, kepanitiaan event kampus, atau hari besar nasional.',
    orderValue: 'Twibbon',
    icon: 'filter_frames'
  },
  {
    id: 'id-card',
    title: 'ID Card & Lanyard',
    badge: 'Kartu Tanda',
    category: 'Formal',
    price: 'Mulai Rp25.000',
    priceNum: 25000,
    turnaround: '24 Jam',
    description: 'Format ukuran standar cetak kartu PVC atau kertas laminasi, termasuk template nama panitia atau karyawan.',
    orderValue: 'ID Card',
    icon: 'badge'
  }
];

export const DESIGN_CATEGORIES_OPTIONS = [
  { value: 'Paket Logo Silver (Rp100.000)', label: 'Paket Logo Silver (Rp100.000)', price: 'Rp 100.000', timeline: '⚡ 2–3 Hari Kerja' },
  { value: 'Paket Logo Gold (Rp200.000)', label: 'Paket Logo Gold (Rp200.000)', price: 'Rp 200.000', timeline: '⚡ 2–3 Hari Kerja' },
  { value: 'Paket Logo Platinum (Rp350.000)', label: 'Paket Logo Platinum (Rp350.000)', price: 'Rp 400.000', timeline: '⚡ 1–2 Hari Prioritas' },
  { value: 'IG Feed & Poster', label: 'IG Feed & Poster', price: 'Rp 50.000', timeline: '⚡ 1 Hari Kerja' },
  { value: 'Banner', label: 'Banner Promosi / Spanduk', price: 'Rp 50.000', timeline: '⚡ 1–2 Hari Kerja' },
  { value: 'Brosur', label: 'Brosur & Flyer', price: 'Rp 50.000', timeline: '⚡ 1–2 Hari Kerja' },
  { value: 'T-Shirt', label: 'Desain Kaos / Merchandise', price: 'Rp 100.000', timeline: '⚡ 2 Hari Kerja' },
  { value: 'Kaligrafi Digital', label: 'Kaligrafi Digital Custom', price: 'Rp 50.000', timeline: '⚡ 1–2 Hari Kerja' },
  { value: 'Digital Illustration', label: 'Digital Illustration & Fanart', price: 'Rp 100.000', timeline: '⚡ 2–3 Hari Kerja' },
  { value: 'Cover Buku', label: 'Cover Buku / E-Book', price: 'Rp 50.000', timeline: '⚡ 1–2 Hari Kerja' },
  { value: 'Sertifikat', label: 'Desain Sertifikat Resmi', price: 'Rp 25.000', timeline: '⚡ 24 Jam' },
  { value: 'Twibbon', label: 'Twibbon Event / Organisasi', price: 'Rp 25.000', timeline: '⚡ 24 Jam' },
  { value: 'ID Card', label: 'ID Card & Name Tag', price: 'Rp 25.000', timeline: '⚡ 24 Jam' },
  { value: 'Lainnya', label: 'Lainnya (Custom Request)', price: 'Fleksibel', timeline: '⚡ Konsultasi di Chat' },
];

export function getDesignDetails(value: string) {
  const found = DESIGN_CATEGORIES_OPTIONS.find(item => item.value === value || item.label.includes(value));
  if (found) return found;
  return {
    value,
    label: value,
    price: 'Rp 200.000',
    timeline: '⚡ 2–3 Hari Kerja'
  };
}
