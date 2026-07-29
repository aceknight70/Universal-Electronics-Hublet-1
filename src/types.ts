export type Role = 'master' | 'manager' | 'staff' | 'customer';

export interface WatermarkConfig {
  url: string;
  opacity: number;
  position: 'center' | 'bottom-right' | 'diagonal';
  scale: number;
}

export interface BusinessTheme {
  primary_color?: string;
  accent_color?: string;
  logo_url?: string;
  display_name?: string;
  watermark?: WatermarkConfig;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  color: string;
  theme?: BusinessTheme;
}

export interface User {
  id: string;
  role: Role;
  name: string;
}

export interface Product {

  id: string;
  catalog_id: string;
  client_id: string;
  brand: string;
  category: string;
  product_name: string;
  spec: string;
  reference_photo_url: string;
  price: number;
  in_stock: boolean;
  tag: 'hot_deal' | 'display_floor' | 'arcade' | 'live_sheet' | null;
}
