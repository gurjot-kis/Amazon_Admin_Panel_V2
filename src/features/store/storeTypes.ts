export type StoreStatus = "active" | "inactive" | "suspended";

export type StoreDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface StoreTiming {
  day: StoreDay;
  is_closed?: boolean;
  open_time?: string; // HH:MM (24h), required when is_closed is false
  close_time?: string; // HH:MM (24h), required when is_closed is false
}

export interface StoreLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Store {
  _id: string;
  store_name: string;
  store_description?: string;
  store_logo?: string;
  store_banner?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  address: string;
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  location: StoreLocation;
  gst_number?: string;
  status: StoreStatus;
  timings: StoreTiming[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreApiResponse<T> {
  success: boolean;
  code?: number;
  message: string;
  data: T;
}

export interface CreateStorePayload {
  store_name: string;
  store_description?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  address: string;
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  gst_number?: string;
  latitude: number | string;
  longitude: number | string;
  timings?: StoreTiming[] | string | null;
  store_logo?: File | null;
  store_banner?: File | null;
}

export interface UpdateStorePayload {
  store_name?: string;
  store_description?: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  gst_number?: string;
  latitude?: number | string;
  longitude?: number | string;
  timings?: StoreTiming[] | string | null;
  store_logo?: File | null;
  store_banner?: File | null;
  remove_logo?: boolean;
  remove_banner?: boolean;
}

export type GetStoreResponse = StoreApiResponse<Store | null>;
export type CreateStoreResponse = StoreApiResponse<Store>;
export type UpdateStoreResponse = StoreApiResponse<Store>;
export type DeleteStoreResponse = StoreApiResponse<null>;
