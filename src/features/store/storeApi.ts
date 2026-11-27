import { baseApi } from "../../store/api/baseApi";
import type {
  CreateStorePayload,
  CreateStoreResponse,
  DeleteStoreResponse,
  GetStoreResponse,
  UpdateStorePayload,
  UpdateStoreResponse,
} from "./storeTypes";

const createStoreFormData = (payload: object): FormData => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "boolean") {
      formData.append(key, String(value));
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
};

export const storeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStore: builder.query<GetStoreResponse, void>({
      query: () => ({
        url: "/admin/store",
        method: "GET",
      }),
      extraOptions: { requiresAuth: true },
      providesTags: ["Store"],
    }),

    createStore: builder.mutation<CreateStoreResponse, CreateStorePayload>({
      query: (payload) => ({
        url: "/admin/store",
        method: "POST",
        body: createStoreFormData(payload),
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    updateStore: builder.mutation<UpdateStoreResponse, UpdateStorePayload>({
      query: (payload) => ({
        url: "/admin/store",
        method: "PUT",
        body: createStoreFormData(payload),
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),

    deleteStore: builder.mutation<DeleteStoreResponse, void>({
      query: () => ({
        url: "/admin/store",
        method: "DELETE",
      }),
      extraOptions: { requiresAuth: true },
      invalidatesTags: ["Store"],
    }),
  }),
});

export const {
  useGetStoreQuery,
  useLazyGetStoreQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoreMutation,
} = storeApi;
