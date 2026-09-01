export type BusinessType = 'PRODUCT' | 'SERVICE';

export interface ServiceOfferingItem {
  service_id: number | string;
  vendor_id?: number;
  title: string;
  description?: string;
  indicative_price?: number | string;
  duration_estimate?: string;
  category?: string;
  is_available?: boolean | number;
  image_url?: string;
}

export interface ServiceEnquiryLead {
  enquiry_id: string | number;
  vendor_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  service_requested?: string;
  preferred_date?: string;
  preferred_time_slot?: string;
  message?: string;
  status: 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
}

export interface VendorLocationPayload {
  area?: string;
  location?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location_address?: string;
  address?: string;
  society_id?: number | null;
  society_name?: string;
}

export interface VendorUser {
  vendor_id: number;
  society_id?: number | null;
  society_name?: string;
  area?: string;
  location?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location_address?: string;
  address?: string;
  business_type?: BusinessType; // 'PRODUCT' (Default) | 'SERVICE'
  can_add_items?: boolean;
  vendor_name?: string;
  gst_number?: string;
  phone_number?: string;
  whatsapp_number?: string;
  email: string;
  store_name: string;
  profession_category?: string; // e.g. "Doctor / Clinic", "Electrician", "Tuition Teacher", "CA"
  experience_years?: number | string;
  qualifications?: string;
  about?: string;
  starting_price?: number | string;
  working_days?: string; // e.g. "Mon - Sat"
  service_areas?: string[];
  logo?: string;
  logo_url?: string;
  image_url?: string;
  store_logo?: string;
  gallery_urls?: string[];
  description?: string;
  opening_time?: string;
  closing_time?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'pending' | 'approved' | 'rejected' | 'active';
  created_at?: string;
  shop_number?: string;
  shop_image?: string;
  category?: string;
  gstin?: string;
  pan_number?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  account_holder_name?: string;
  upi_id?: string;
  qr_code_url?: string;
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
  location_type?: 'society' | 'area_sector';
  type?: 'society' | 'sector';
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

export interface UpdatePaymentDetailsPayload {
  vendor_id?: number | string;
  account_number?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  ifsc?: string;
  bank_name?: string;
  account_holder_name?: string;
  holder_name?: string;
  upi_id?: string;
  qr_code_url?: string;
  account_type?: string;
}

export interface RegisterVendorPayload {
  vendor_name: string;
  store_name: string;
  email: string;
  phone_number: string;
  password: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  whatsapp_number?: string;
  whatsapp?: string;
  shop_number?: string;
  shop_no?: string;
  shopNumber?: string;
  shop_image?: string;
  category?: string;
  gstin?: string;
  pan_number?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  account_holder_name?: string;
  upi_id?: string;
  qr_code_url?: string;
  society_id?: number | null;
  society_name?: string;
  business_type?: BusinessType;
  accepted_payment_methods?: string[];
  location?: string;
  location_address?: string;
  mobile?: string;
  phone?: string;
  owner_name?: string;
  shop_name?: string;
  business_name?: string;
  location_name?: string;
  gst_number?: string;
  gst?: string;
  pan?: string;
  panNumber?: string;
  logo?: string;
  image_url?: string;
  address?: string;
  otp?: string;
  account_type?: string;
  bank_account_number?: string;
  ifsc?: string;
  holder_name?: string;
}

export interface VendorSearchParams {
  area?: string;
  search?: string;
  location_id?: number | string;
  status?: 'active' | 'pending' | 'all' | string;
  category?: string;
  page?: number;
  limit?: number;
  societyId?: number | string;
}

export interface PublicVendorItem {
  vendor_id: number;
  id?: number;
  store_name: string;
  owner_name?: string;
  vendor_name?: string;
  email: string;
  phone?: string;
  phone_number?: string;
  category?: string;
  location_id?: number;
  society_id?: number;
  area?: string;
  society_name?: string;
  city?: string;
  state?: string;
  pincode?: string;
  whatsapp_number?: string;
  shop_number?: string;
  shop_image?: string;
  logo?: string;
  gstin?: string;
  pan_number?: string;
  status: 'active' | 'pending' | 'rejected' | 'ACTIVE' | 'PENDING' | 'REJECTED' | string;
  created_at?: string;
}

export interface VendorSearchResponse {
  success: boolean;
  message?: string;
  data: PublicVendorItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface VendorStatusResponse {
  success: boolean;
  vendor_id?: number | string;
  status: 'pending' | 'accepted' | 'active' | 'rejected' | 'blocked' | string;
  code?: string;
  is_pending?: boolean;
  is_accepted?: boolean;
  is_active?: boolean;
  is_rejected?: boolean;
  is_blocked?: boolean;
  is_on_hold?: boolean;
  action?: string;
  error?: string;
  message?: string;
  recommended_ui_text?: string;
  rejection_reason?: string;
  block_reason?: string;
  vendor?: Partial<VendorUser>;
}
