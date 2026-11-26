export type BannerRedirectType = "none" | "internal" | "external";

export type BannerUploadArea = "website" | "app";

export type BannerPosition =
  | "home_top"
  | "home_middle"
  | "home_bottom"
  | "category"
  | "product"
  | "promotional";

export type BannerDeviceType = "all" | "desktop" | "mobile" | "tablet";

export type BannerStatus = 0 | 1; // 1 = active, 0 = inactive

export interface Banner {
  _id: string;
  title: string;
  description?: string;
  banner_image: string;
  redirect_url?: string;
  redirect_type: BannerRedirectType;
  upload_area: BannerUploadArea;
  position: BannerPosition;
  device_type: BannerDeviceType;
  sort_order: number;
  start_date?: string | null;
  end_date?: string | null;
  status: BannerStatus;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface BannerPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BannerApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  pagination?: BannerPagination;
}

// Params

export interface FetchBannerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BannerStatus;
  position?: BannerPosition;
  device_type?: BannerDeviceType;
  upload_area?: BannerUploadArea;
}

// Create Payload

export interface CreateBannerPayload {
  title: string;
  description?: string;
  banner_image: File;
  redirect_url?: string;
  redirect_type: BannerRedirectType;
  upload_area: BannerUploadArea;
  position: BannerPosition;
  device_type: BannerDeviceType;
  sort_order: number;
  start_date?: string;
  end_date?: string;
}

// Update Payload

export interface UpdateBannerPayload extends Partial<
  Omit<CreateBannerPayload, "banner_image">
> {
  bannerId: string;
  banner_image?: File | null;
}

// Responses

export type FetchBannerListResponse = BannerApiResponse<Banner[]>;
export type GetBannerByIdResponse = BannerApiResponse<Banner>;
export type CreateBannerResponse = BannerApiResponse<Banner>;
export type UpdateBannerResponse = BannerApiResponse<Banner>;
export type ToggleBannerStatusResponse = BannerApiResponse<Banner>;
export type DeleteBannerResponse = BannerApiResponse<null>;
