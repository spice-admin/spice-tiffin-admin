// src/components/management/OrderTable.tsx (Admin Panel)
import React from "react";
// Use the Admin-specific order type
import type { IOrderAdminFE, OrderStatus } from "../../types";
// Import react-icons if needed for status badges/actions
import {
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineHashtag,
  HiOutlineUser,
  HiOutlineEye,
} from "react-icons/hi2";

// --- Helper: Format Date (Only Date part) ---
const formatDateOnly = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      // Canadian locale
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// --- Helper: Format Currency (CAD) ---
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

// --- Status Badge Component ---
const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  let badgeClass = "badge bg-secondary-subtle text-secondary"; // Default
  let icon = <HiOutlineClock className="me-1" size={14} />; // Default icon

  switch (status) {
    case "Active":
      badgeClass = "badge bg-success-subtle text-success";
      icon = <HiOutlineCheckCircle className="me-1" size={14} />;
      break;
    case "Expired":
      badgeClass = "badge bg-dark-subtle text-dark"; // Example: Darker gray for expired
      icon = <HiOutlineClock className="me-1" size={14} />;
      break;
    case "Cancelled":
      badgeClass = "badge bg-danger-subtle text-danger";
      icon = <HiOutlineXCircle className="me-1" size={14} />;
      break;
  }

  return (
    <span className={`${badgeClass} d-inline-flex align-items-center`}>
      {icon} {status}
    </span>
  );
};

// --- Props Interface ---
interface OrderTableProps {
  orders: IOrderAdminFE[]; // Use Admin Order type
  isLoading: boolean;
  // TODO: Add handlers for admin actions later
  // onViewDetails: (orderId: string) => void;
  // onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

// --- The Table Component ---
const OrderTable: React.FC<OrderTableProps> = ({ orders, isLoading }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="">
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Package</th>
            <th>Dates (Start/End)</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Order Date</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-muted">
                Loading orders...
              </td>
            </tr>
          )}
          {!isLoading && orders.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-muted">
                No orders found.
              </td>
            </tr>
          )}
          {!isLoading &&
            orders.map((order) => (
              <tr key={order._id} style={{ verticalAlign: "middle" }}>
                {/* Order Number */}
                <td className="fw-medium">
                  <HiOutlineHashtag className="d-inline-block me-1" size={14} />
                  {order.orderNumber}
                </td>
                {/* Customer Info - Now populated */}
                <td>
                  <div>
                    <HiOutlineUser className="d-inline-block me-1" size={14} />
                    {order.customer?.fullName || "N/A"}
                  </div>
                  <div className="text-muted fs-sm">
                    {order.customer?.email || "-"}
                  </div>
                  <div className="text-muted fs-sm">
                    {order.customer?.mobile || "-"}
                  </div>
                </td>
                {/* Package Name - Populated */}
                <td>{order.package?.name || order.packageName || "N/A"}</td>
                {/* Dates */}
                <td>
                  <div className="fs-sm">
                    Start: {formatDateOnly(order.startDate)}
                  </div>
                  <div className="fs-sm">
                    End: {formatDateOnly(order.endDate)}
                  </div>
                </td>
                {/* Status */}
                <td>
                  <OrderStatusBadge status={order.status} />
                </td>
                {/* Amount */}
                <td className="fw-medium">
                  {formatCurrency(order.packagePrice)}
                </td>
                {/* Order Date */}
                <td>{formatDateOnly(order.createdAt)}</td>
                {/* Action Buttons (Placeholders for Admin) */}
                <td className="text-end">
                  <button
                    title="View Order Details"
                    className="btn btn-sm btn-link p-0"
                    // onClick={() => onViewDetails(order._id)} // Add later
                    disabled={false} // Enable later
                    style={{ color: "inherit" }}
                  >
                    <HiOutlineEye size={18} className="text-secondary" />
                  </button>
                  {/* Add other admin actions like 'Update Status' button later */}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
