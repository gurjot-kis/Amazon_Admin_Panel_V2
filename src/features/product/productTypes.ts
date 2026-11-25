export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  pagination?: Pagination;
}

// ====================
// Product
// ====================

export type ProductStatus = "pending" | "active" | "rejected" | "inactive";

export type StockStatus = "in_stock" | "out_of_stock";

export interface ProductCategory {
  _id: string;
  name: string;
  category_image: string;
}

export interface Product {
  _id: string;
  name: string;
  mainImage: string;
  // sku / currency / prices are optional: variant products don't have them
  sku?: string;
  currency?: string;
  costPrice?: number;
  sellingPrice?: number;
  price?: number;
  stock: number;
  stockStatus: StockStatus;
  status: ProductStatus;
  hasVariants: boolean;
  createdAt: string;
  category: ProductCategory;
  unit?: string;
  priceRange?: { min: number; max: number } | null;
}

export type GetProductsResponse = ApiResponse<Product[]>;

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  status?: ProductStatus;
}

// ====================
// Product Create
// ====================

export interface ProductVariantCombination {
  variant_type_id: string;
  variant_option_id: string;
}

export interface CreateProductVariant {
  combination: ProductVariantCombination[];
  sku?: string;
  costPrice?: number;
  sellingPrice?: number;
  price?: number;
  stock?: number;
  images?: (File | string)[];
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  short_description?: string;
  category_id: string;
  // required only when hasVariants is false
  sku?: string;
  currency?: string;
  costPrice?: number;
  sellingPrice?: number;
  price?: number;
  stock?: number;
  mainImage: File | string;
  featuredImages?: File[];
  hasVariants?: boolean;
  variantTypes?: string[];
  variants?: CreateProductVariant[];
  imageGroupTypeId?: string | null;
  unit?: string;
}

// ====================
// Product Details
// ====================

export interface ProductCategoryDetails {
  _id: string;
  name: string;
  category_image: string;
}

export interface ProductVariantType {
  _id: string;
  name: string;
}

export interface ProductVariantOption {
  _id: string;
  value: string;
  meta: Record<string, string>;
}

export interface ProductVariantCombinationDetails {
  variant_type_id: ProductVariantType;
  variant_option_id: ProductVariantOption;
  _id: string;
}

export interface ProductVariant {
  _id: string;
  product_id: string;
  combination: ProductVariantCombinationDetails[];
  sku: string;
  costPrice: number;
  sellingPrice: number;
  price: number;
  stock: number;
  stockStatus: StockStatus;
  images: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetails {
  _id: string;
  category_id: ProductCategoryDetails;
  name: string;
  description: string;
  short_description: string;
  mainImage: string;
  featuredImages: string[];
  // optional: variant products don't have these at product level
  sku?: string;
  slug: string;
  currency?: string;
  costPrice?: number;
  sellingPrice?: number;
  price?: number;
  stock: number;
  stockStatus: StockStatus;
  status: ProductStatus;
  user_id: string;
  role: "SuperAdmin" | "User" | "Vendor";
  hasVariants: boolean;
  variantTypes: ProductVariantType[];
  variants: ProductVariant[];
  imageGroupTypeId?: string | null;
  unit?: string;
  createdAt: string;
  updatedAt: string;
}

export type GetProductByIdResponse = ApiResponse<ProductDetails>;

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  sku?: string;
  currency?: string;
  costPrice?: number;
  sellingPrice?: number;
  price?: number;
  stock?: number;
  mainImage?: File | string;
  featuredImages?: File[];
  hasVariants?: boolean;
  variantTypes?: string[];
  variants?: CreateProductVariant[];
  imageGroupTypeId?: string | null;
  unit?: string;
}

export interface UpdateProductStatusPayload {
  status: ProductStatus;
}
