export interface VendorUser {
  vendor_id: number;
  society_id?: number | null;
  vendor_name?: string;
  gst_number?: string;
  phone_number?: string;
  email: string;
  store_name: string;
  logo?: string;
  logo_url?: string;
  image_url?: string;
  store_logo?: string;
  description?: string;
  opening_time?: string;
  closing_time?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE';
  created_at?: string;
  society_name?: string;
  location?: string;
}

export interface VendorItem {
  item_id: number;
  vendor_id?: number;
  item_name: string;
  description?: string;
  price: number | string;
  stock: number;
  category?: string;
  unit?: string;
  is_available?: boolean | number;
  in_stock?: boolean;
  image_url?: string;
  created_at?: string;
}

export interface OrderItemDetail {
  order_id?: number | string;
  item_id?: number;
  quantity: number;
  unit_price?: number | string;
  item_total?: number | string;
  item_name: string;
  unit?: string;
  price?: number | string;
}

export type OrderStatusType =
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface VendorOrder {
  order_id: string | number;
  vendor_id?: number;
  customer_id?: number;
  customer_name: string;
  phone?: string;
  phone_number?: string;
  delivery_address?: string;
  address?: string;
  flat?: string | number;
  flat_no?: string | number;
  flat_number?: string | number;
  order_timestamp?: string;
  status: OrderStatusType;
  total_amount: number | string;
  items: OrderItemDetail[];
}

export interface VendorSubscription {
  subscription_id?: number;
  vendor_id?: number;
  start_date?: string;
  end_date?: string;
  status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface VendorPayment {
  payment_id?: number;
  amount?: number | string;
  status?: string;
  paid_at?: string;
}

export interface Society {
  society_id: number;
  society_name: string;
  location: string;
  pincode?: string;
  total_flats?: number;
  vendor_count?: number;
  status?: string;
}

export interface VendorDashboardData {
  vendor: VendorUser;
  items: VendorItem[];
  orders: VendorOrder[];
  subscription?: VendorSubscription | null;
  payments?: VendorPayment[];
}

export interface SupportContactInfo {
  phone: string;
  email: string;
  toll_free?: string;
  whatsapp?: string;
  address?: string;
  working_hours?: string;
  updated_at?: string;
}

export interface CmsPageData {
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  phone?: string;
  email?: string;
  contact?: SupportContactInfo;
  updated_at?: string;
}

export interface CmsPageSummary {
  slug: string;
  title: string;
  meta_description?: string;
  updated_at?: string;
}

