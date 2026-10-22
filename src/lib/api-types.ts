export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

export interface SizeChartRow {
  waist: string;
  thigh: string;
  legOpening: string;
  long: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  description: string;
  highlights: string[];
  price: number;
  comparePrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  discountedPrice?: number;
  category: string;
  images: string[];
  variants: ProductVariant[];
  sizeChart: SizeChartRow[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  variantSku: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  altPhone?: string;
  street: string;
  city: string;
  country: string;
  note?: string;
}

export interface OrderStatusHistoryItem {
  status: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  note?: string;
}

export interface Order {
  _id: string;
  userId?: { _id: string; name: string; email: string; phone?: string };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  discountAmount: number;
  totalAmount: number;
  exchangeAmount?: number;
  paymentMethod: 'cod' | 'bkash' | 'card';
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  status: 'PENDING' | 'ACCEPTED' | 'COURIERED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'EXCHANGE';
  statusHistory?: OrderStatusHistoryItem[];
  couponCode?: string;
  bkashNumber?: string;
  bkashTxnId?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SliderCta {
  text: string;
  href: string;
}

export interface Slider {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  primaryCta?: SliderCta;
  secondaryCta?: SliderCta;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface FeaturedCategorySectionConfig {
  enabled: boolean;
  category: string;
  title: string;
  tagline: string;
  badge: string;
  bannerImage: string;
  buttonText: string;
}

export interface SiteSettings {
  title: string;
  tagline: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  locationMapUrl?: string;
  businessHours?: string;
  announcement?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    whatsapp?: string;
    tiktok?: string;
  };
  featuredCategorySection?: FeaturedCategorySectionConfig;
}

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  permissions?: string[];
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  salesHistory: Array<{ _id: string; totalSales: number; orderCount: number }>;
  orderStatusDistribution: Array<{ _id: string; count: number }>;
}

export interface ActivityLogItem {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityTitle?: string;
  description: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
