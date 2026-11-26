export type OrderStatus =
  | "payment_pending"
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "COD" | "ONLINE" | "WALLET";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CancellationCancelledBy = "user" | "admin" | null;

/* ── Shared order pieces ─────────────────────────────────── */
export interface OrderItemVariantOption {
  name: string;
  value: string;
}

export interface OrderItemVariant {
  sku: string;
  options: OrderItemVariantOption[];
}

export interface OrderDetailItem {
  product_id: string;
  variant_id: string | null;
  variant: OrderItemVariant | null;
  name: string;
  slug: string;
  mainImage: string;
  currency: string;
  price: number;
  sellingPrice: number;
  quantity: number;
  itemTotal: number;
}

export interface OrderShippingAddress {
  address_id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  label: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
}

/* ── List item (backend: listAdminOrders → mapOrder + user_name) ── */
export interface OrderSummary {
  items_total: number;
  price_total: number;
  discount: number;
  grandTotal: number;
  handling_charge?: number;
  delivery_waived?: boolean;
  delivery_charge?: number;
  small_cart_charge?: number;
  coupon_discount?: number;
}

export interface Order {
  _id: string;
  orderId: string;
  user_id: string;
  user_name: string | null;
  items: OrderDetailItem[];
  shippingAddress: OrderShippingAddress | null;
  totalItems: number;
  grandTotal: number;
  summary: OrderSummary;
  paymentMethod: PaymentMethod;
  coupon_code: string;
  paymentReceived: 0 | 1;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

/* ── Details (backend: getAdminOrderById / updateOrderStatus → mapOrderDetails) ── */
export interface OrderCoupon {
  applied: boolean;
  code: string;
  discount: number;
}

export interface OrderBillBreakdown {
  price_total: number;
  discount: number;
  items_total: number;
  handling_charge: number;
  delivery_charge: number;
  delivery_waived: boolean;
  small_cart_charge: number;
  coupon: OrderCoupon;
  grandTotal: number;
}

export interface OrderDetails {
  _id: string;
  orderId: string;
  user_name: string | null;
  items: OrderDetailItem[];
  totalItems: number;
  vendorTotal: number;
  billBreakdown: OrderBillBreakdown;
  grandTotal: number;
  shippingAddress: OrderShippingAddress | null;
  paymentMethod: PaymentMethod;
  paymentReceived: 0 | 1;
  status: OrderStatus;
  nextStatuses: OrderStatus[];
  createdAt: string;
  updatedAt: string;
}

/* ── Pagination ──────────────────────────────────────────── */
export interface OrderPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* ── API params / responses ──────────────────────────────── */
export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  user_id?: string;
}

export interface GetOrdersResponse {
  success: boolean;
  code: number;
  message: string;
  data: Order[];
  pagination: OrderPagination;
}

export interface GetOrderByIdResponse {
  success: boolean;
  code: number;
  message: string;
  data: OrderDetails;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  code: number;
  message: string;
  data: OrderDetails;
}

/* ── Other existing types ────────────────────────────────── */
export interface OrderPricing {
  itemsTotal: number;
  taxAmount: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
}

export interface OrderCancellation {
  cancelledBy: CancellationCancelledBy;
  reason: string | null;
  cancelledAt: string | null;
  refundAmount: number | null;
}

export interface OrderPayment {
  _id: string;
  user: string;
  order_id: string;
  slotBooking_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: string;
  status: PaymentStatus;
  providerOrderId: string | null;
  transactionId: string | null;
  signature: string | null;
  gatewayResponse: unknown | null;
  paidAt: string | null;
  failureReason: string | null;
  attempt: number;
  refunds: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  status: string;
  note: string;
  changedAt: string;
}
