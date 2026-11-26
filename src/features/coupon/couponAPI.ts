import { baseApi } from "../../store/api/baseApi";
import type {
  CouponListResponse,
  CreateCouponPayload,
  GetCouponListParams,
  UpdateCouponPayload,
} from "./couponTypes";

export const couponApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Super Admin

    getAdminCouponList: builder.query<CouponListResponse, GetCouponListParams>({
      query: ({ page, limit, search, status }) => {
        const params = new URLSearchParams();

        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (search !== undefined) params.set("search", search.trim());
        if (status !== undefined) params.set("status", String(status));

        const qs = params.toString();

        return {
          url: `/admin/coupon${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Coupon"],
    }),

    createAdminCoupon: builder.mutation<unknown, CreateCouponPayload>({
      query: (payload) => ({
        url: "/admin/coupon",
        method: "POST",
        body: payload,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    getAdminCouponById: builder.query({
      query: (couponId: string) => ({
        url: `/admin/coupon/${couponId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Coupon"],
    }),

    updateAdminCoupon: builder.mutation<
      unknown,
      { couponId: string; payload: UpdateCouponPayload }
    >({
      query: ({ couponId, payload }) => ({
        url: `/admin/coupon/${couponId}`,
        method: "PUT",
        body: payload,
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    updateAdminCouponStatus: builder.mutation<unknown, string>({
      query: (couponId) => ({
        url: `/admin/coupon/${couponId}/status`,
        method: "PATCH",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    deleteAdminCoupon: builder.mutation<unknown, string>({
      query: (couponId) => ({
        url: `/admin/coupon/${couponId}`,
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),

    uploadAdminCouponImage: builder.mutation<
      unknown,
      {
        couponId: string;
        image: File;
        coupon_image_type: "website" | "mobile";
      }
    >({
      query: ({ couponId, image, coupon_image_type }) => {
        const formData = new FormData();

        formData.append("coupon_image", image);
        formData.append("coupon_image_type", coupon_image_type);

        return {
          url: `/admin/coupon/${couponId}/image`,
          method: "POST",
          body: formData,
        };
      },
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Coupon"],
    }),
  }),
});

export const {
  useGetAdminCouponListQuery,
  useCreateAdminCouponMutation,
  useGetAdminCouponByIdQuery,
  useUpdateAdminCouponMutation,
  useUpdateAdminCouponStatusMutation,
  useDeleteAdminCouponMutation,
  useUploadAdminCouponImageMutation,
} = couponApi;
