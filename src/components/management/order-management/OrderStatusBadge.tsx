import React from "react";
import { OrderStatusValues } from "@orders/index";
import type { OrderStatus } from "@orders/index";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusClasses: Record<OrderStatus, string> = {
  pending_confirmation: "badge badge-yellow",
  confirmed: "badge badge-blue",
  processing: "badge badge-blue",
  out_for_delivery: "badge badge-indigo",
  delivered: "badge badge-green",
  cancelled: "badge badge-red",
  on_hold: "badge badge-gray",
};

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const className = statusClasses[status] || "badge badge-gray";
  return <span className={className}>{OrderStatusValues[status]}</span>;
};

export default OrderStatusBadge;
