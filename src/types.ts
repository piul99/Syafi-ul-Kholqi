export type TabType = 'work' | 'services' | 'order';

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  client: string;
  year: string;
  date: string;
  description: string;
  tools: string[];
  deliverables: string;
  imageUrl: string;
  hiResImageUrl: string;
  badge?: string;
  badgeType?: 'primary' | 'tertiary' | 'amber' | 'neutral';
  orderCategoryValue: string;
}

export interface LogoTier {
  id: string;
  name: string;
  tierLabel: string;
  price: string;
  priceNum: number;
  timeline: string;
  revisions: string;
  features: { text: string; boldPrefix?: string }[];
  isPopular?: boolean;
  orderValue: string;
}

export interface SingleService {
  id: string;
  title: string;
  badge: string;
  category: 'Branding & Cetak' | 'Sosial Media' | 'Ilustrasi' | 'Formal';
  price: string;
  priceNum: number;
  turnaround: string;
  description: string;
  orderValue: string;
  icon: string;
}

export interface OrderFormData {
  clientName: string;
  designCategory: string;
  brief: string;
  phoneNumber: string;
}
