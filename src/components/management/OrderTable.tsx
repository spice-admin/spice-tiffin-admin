// src/components/management/OrderTable.tsx
import React from "react";
import { supabase } from "../../lib/supabaseClient";
import { type IAdminOrder, AdminOrderStatus } from "../../types"; // Use new types
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineHashtag,
  HiOutlineUser,
} from "react-icons/hi2";

const formatDateOnly = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      // Canadian locale for date
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-CA", {
    // CAD Currency
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

// Order Status Badge Component
const OrderStatusDisplayBadge = ({
  status,
}: {
  status: AdminOrderStatus | string;
}) => {
  let badgeClass = "badge bg-secondary text-white"; // Default (using text-white for better contrast on colored bg)
  let icon = <HiOutlineClock className="me-1" size={14} />;
  let displayStatus = status
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  switch (status) {
    case AdminOrderStatus.CONFIRMED:
    case AdminOrderStatus.PROCESSING:
      badgeClass = "badge bg-info text-white"; // Blue/Info
      icon = <HiOutlineClock className="me-1" size={14} />;
      break;
    case AdminOrderStatus.OUT_FOR_DELIVERY:
      badgeClass = "badge bg-primary text-white"; // Primary (often blue)
      icon = <HiOutlineClock className="me-1" size={14} />; // Replace with a truck icon if you have one
      break;
    case AdminOrderStatus.DELIVERED:
      badgeClass = "badge bg-success text-white"; // Green
      icon = <HiOutlineCheckCircle className="me-1" size={14} />;
      break;
    case AdminOrderStatus.CANCELLED:
      badgeClass = "badge bg-danger text-white"; // Red
      icon = <HiOutlineXCircle className="me-1" size={14} />;
      break;
    case AdminOrderStatus.ON_HOLD:
    case AdminOrderStatus.PENDING_CONFIRMATION:
      badgeClass = "badge bg-warning text-dark"; // Yellow (use dark text for yellow bg)
      icon = <HiOutlineClock className="me-1" size={14} />;
      break;
  }
  return (
    <span
      className={`${badgeClass} d-inline-flex align-items-center p-1 px-2 rounded-pill`}
    >
      {icon} {displayStatus}
    </span>
  );
};

interface OrderTableProps {
  orders: IAdminOrder[];
  isLoading: boolean;
  refreshOrders: () => void;
  onViewDetails: (order: IAdminOrder) => void; // <-- ADD PROP
  // onUpdateStatus: (orderId: string, newStatus: AdminOrderStatus) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading,
  refreshOrders,
  onViewDetails,
}) => {
  // Placeholder for Update Status - This would typically open a modal or dropdown
  const handleUpdateStatus = async (
    orderId: string,
    newStatus: AdminOrderStatus
  ) => {
    console.log(`Attempting to update order ${orderId} to status ${newStatus}`);
    // Example: Directly update using Supabase client (ensure RLS allows admin updates)
    // This should ideally be in OrderManagerWrapper or a service, with error handling & success feedback.
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          order_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
      if (error) throw error;
      alert(`Order ${orderId} status updated to ${newStatus}.`); // Simple feedback
      refreshOrders(); // Refresh the list
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert(`Error updating status: ${(err as Error).message}`);
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover table-sm mb-0">
        {/* Added table-sm */}
        <thead className="table-light">
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Package</th>
            <th>Delivery Dates</th>
            <th>Total</th>
            <th>Order Date</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={8} className="text-center py-5 text-muted">
                Loading orders...
              </td>
            </tr>
          )}
          {!isLoading && orders.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-5 text-muted">
                No orders found matching your criteria.
              </td>
            </tr>
          )}
          {!isLoading &&
            orders.map((order) => (
              <tr key={order.id} style={{ verticalAlign: "middle" }}>
                <td className="fw-medium" title={order.id}>
                  <HiOutlineHashtag
                    className="d-inline-block me-1"
                    style={{ fontSize: "0.9em" }}
                  />
                  {order.id.substring(0, 8)}...
                </td>
                <td>
                  <div>{order.user_full_name || "N/A"}</div>
                  <div className="text-muted" style={{ fontSize: "0.8em" }}>
                    {order.user_email || "-"}
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.8em" }}>
                    {order.user_phone || "-"}
                  </div>
                </td>
                <td>
                  <div>{order.package_name || "N/A"}</div>
                  <div className="text-muted" style={{ fontSize: "0.8em" }}>
                    {order.package_type} - {order.package_days} days
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: "0.85em" }}>
                    Start: {formatDateOnly(order.delivery_start_date)}
                  </div>
                  <div style={{ fontSize: "0.85em" }}>
                    End: {formatDateOnly(order.delivery_end_date)}
                  </div>
                </td>
                <td className="fw-medium">
                  {formatCurrency(order.package_price)}
                </td>
                <td style={{ fontSize: "0.85em" }}>
                  {formatDateOnly(order.order_date)}
                </td>
                <td>
                  <OrderStatusDisplayBadge status={order.order_status} />
                </td>
                <td className="text-end">
                  <button
                    title="View Order Details"
                    className="btn btn-sm btn-outline-secondary p-1 me-1"
                    onClick={() => onViewDetails(order)}
                  >
                    <HiOutlineEye size={16} />
                  </button>
                  {/* Example Update Status Dropdown (Simplified) */}
                  <select
                    className="form-select form-select-sm d-inline-block p-1"
                    style={{ width: "auto", fontSize: "0.8rem" }}
                    value={order.order_status}
                    onChange={(e) =>
                      handleUpdateStatus(
                        order.id,
                        e.target.value as AdminOrderStatus
                      )
                    }
                    disabled={
                      order.order_status === AdminOrderStatus.DELIVERED ||
                      order.order_status === AdminOrderStatus.CANCELLED
                    }
                  >
                    {Object.entries(AdminOrderStatus).map(([key, val]) => (
                      <option
                        key={val}
                        value={val}
                        disabled={val === order.order_status}
                      >
                        {key.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
