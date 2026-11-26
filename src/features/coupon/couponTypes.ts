export interface CouponUserDetails {
  _id: string;
  name: string;
  image: string | null;
}

export interface Coupon {
  _id: string;
  code: string;
  title: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number;
  per_user_limit: number;
  used_count: number;
  created_by: string;
  start_date: string;
  end_date: string;
  status: number;
  website_image: string | null;
  mobile_image: string | null;
  createdAt: string;
  updatedAt: string;
  user_details: CouponUserDetails | null;
}

export interface CouponPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CouponListResponse {
  success: boolean;
  code: number;
  message: string;
  data: Coupon[];
  pagination: CouponPagination;
}

export interface GetCouponListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}

export interface CreateCouponPayload {
  code: string;
  title: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  description?: string;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number;
  per_user_limit?: number;
}

export type UpdateCouponPayload = Partial<CreateCouponPayload>;
