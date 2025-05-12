// src/types/index.ts

export type OrderStatus =
  | "pending_confirmation"
  | "confirmed"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "on_hold";

export interface IOrder {
  id: string;
  user_id: string | null;
  user_full_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  package_id: string | null;
  package_name: string | null;
  package_type: string | null;
  package_days: number | null;
  package_price: number;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_postal_code: string | null;
  delivery_current_location: string | null;
  stripe_payment_id: string | null;
  stripe_customer_id: string | null;
  order_status: OrderStatus;
  order_date: string;
  created_at: string;
  updated_at: string;
  delivery_start_date: string | null;
  delivery_end_date: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
}

export interface IOrderFilters {
  search?: string;
  status?: OrderStatus | "";
  sortBy?:
    | "order_date_asc"
    | "order_date_desc"
    | "package_price_asc"
    | "package_price_desc";
  limit?: number;
  offset?: number;
}

export interface IPaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export const OrderStatusValues: Record<OrderStatus, string> = {
  pending_confirmation: "Pending Confirmation",
  confirmed: "Confirmed",
  processing: "Processing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  on_hold: "On Hold",
};
