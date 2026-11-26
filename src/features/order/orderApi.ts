import { baseApi } from "../../store/api/baseApi";
import type {
  GetOrderByIdResponse,
  GetOrdersParams,
  GetOrdersResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
} from "./orderTypes";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrders: builder.query<GetOrdersResponse, GetOrdersParams>({
      query: ({ page, limit, status, search, user_id }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        if (user_id) params.set("user_id", user_id);

        const qs = params.toString();
        return {
          url: `/admin/orders${qs ? `?${qs}` : ""}`,
          method: "GET",
        };
      },
      extraOptions: { requiresAuth: true },
      providesTags: ["Order"],
    }),

    getOrderById: builder.query<GetOrderByIdResponse, string>({
      query: (orderId) => ({
        url: `/admin/orders/${orderId}`,
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Order"],
    }),

    updateOrderStatus: builder.mutation<
      UpdateOrderStatusResponse,
      UpdateOrderStatusRequest
    >({
      query: ({ orderId, status }) => ({
        url: `/admin/orders/${orderId}/status`,
        method: "PATCH",
        body: { status },
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
} = orderApi;
