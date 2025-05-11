// src/components/dashboard/TodaysOrdersTable.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path if needed
import { type IAdminOrder, AdminOrderStatus } from "../../types"; // Use your existing admin order types
import OrderDetailModal from "../management/OrderDetailModal"; // Path to your OrderDetailModal
import { format as formatDateFns } from "date-fns"; // For formatting today's date
import {
  HiOutlineEye,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineTag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineDevicePhoneMobile,
  HiOutlineHashtag,
} from "react-icons/hi2";

// Helper function to format dates (you might have this globally or in a utils file)
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      // Consistent date format
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// Order Status Badge Component (can be imported if it's a shared component)
const OrderStatusDisplayBadge = ({ status }: { status: string }) => {
  let badgeClass = "badge-status-default";
  let icon = <HiOutlineClock className="icon" size={14} />;
  const displayStatus = status
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  switch (status) {
    case AdminOrderStatus.CONFIRMED:
      badgeClass = "badge-status-confirmed";
      icon = <HiOutlineCheckCircle className="icon" size={14} />;
      break;
    case AdminOrderStatus.PROCESSING:
      badgeClass = "badge-status-processing";
      icon = <HiOutlineClock className="icon" size={14} />;
      break;
    case AdminOrderStatus.OUT_FOR_DELIVERY:
      badgeClass = "badge-status-delivery";
      icon = <HiOutlineClock className="icon" size={14} />;
      break; // Replace with truck icon
    case AdminOrderStatus.DELIVERED:
      badgeClass = "badge-status-delivered";
      icon = <HiOutlineCheckCircle className="icon" size={14} />;
      break;
    case AdminOrderStatus.CANCELLED:
      badgeClass = "badge-status-cancelled";
      icon = <HiOutlineXCircle className="icon" size={14} />;
      break;
    case AdminOrderStatus.ON_HOLD:
    case AdminOrderStatus.PENDING_CONFIRMATION:
      badgeClass = "badge-status-hold";
      icon = <HiOutlineClock className="icon" size={14} />;
      break;
    default:
      badgeClass = "badge-status-default";
      break;
  }
  return (
    <span className={`order-status-badge ${badgeClass}`}>
      {icon} {displayStatus}
    </span>
  );
};

const TodaysOrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<IAdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<IAdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchTodaysActiveOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = formatDateFns(new Date(), "yyyy-MM-dd");

      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          id,
          user_full_name,
          user_email,
          user_phone,
          package_name,
          package_type,
          package_days,
          package_price,
          delivery_address,
          delivery_city,
          delivery_postal_code,
          delivery_current_location,
          stripe_payment_id,
          stripe_customer_id,
          order_status,
          order_date,
          delivery_start_date,
          delivery_end_date,
          created_at,
          updated_at
        `
        )
        .gte("delivery_end_date", today) // Key condition: end date is today or in the future
        .not(
          "order_status",
          "in",
          `("${AdminOrderStatus.DELIVERED}","${AdminOrderStatus.CANCELLED}")`
        ) // Exclude completed/cancelled
        .order("delivery_start_date", { ascending: true }); // Show upcoming ones first

      if (fetchError) throw fetchError;

      setOrders((data as IAdminOrder[]) || []);
    } catch (err) {
      console.error("[TodaysOrdersTable] Error fetching active orders:", err);
      setError((err as Error).message || "Failed to load active orders.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysActiveOrders();
  }, [fetchTodaysActiveOrders]);

  const handleViewDetails = (order: IAdminOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Ongoing & Upcoming Deliveries</h4>
      </div>
      <div className="card-body pt-0">
        {isLoading && (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}
        {!isLoading && !error && orders.length === 0 && (
          <div className="text-center p-4 text-muted">
            No active or upcoming deliveries found for today or future dates.
          </div>
        )}
        {!isLoading && !error && orders.length > 0 && (
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              {" "}
              {/* Using table-sm for more compact view */}
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Package</th>
                  <th>Delivery Starts</th>
                  <th>Delivery Ends</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ verticalAlign: "middle" }}>
                    <td title={order.id} className="fw-medium">
                      <HiOutlineHashtag className="me-1 icon" />
                      {order.id.substring(0, 8)}...
                    </td>
                    <td>
                      <div>
                        <HiOutlineUser className="me-1 icon" />
                        {order.user_full_name || "N/A"}
                      </div>
                      {order.user_phone && (
                        <div className="text-muted small">
                          <HiOutlineDevicePhoneMobile className="me-1 icon" />
                          {order.user_phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        <HiOutlineTag className="me-1 icon" />
                        {order.package_name || "N/A"}
                      </div>
                      <div className="text-muted small">
                        {order.package_type} - {order.package_days} days
                      </div>
                    </td>
                    <td>
                      <HiOutlineCalendarDays className="me-1 icon" />
                      {formatDate(order.delivery_start_date)}
                    </td>
                    <td>
                      <HiOutlineCalendarDays className="me-1 icon" />
                      {formatDate(order.delivery_end_date)}
                    </td>
                    <td>
                      <OrderStatusDisplayBadge status={order.order_status} />
                    </td>
                    <td className="text-end">
                      <button
                        title="View Order Details"
                        className="btn btn-sm btn-outline-secondary p-1"
                        onClick={() => handleViewDetails(order)}
                      >
                        <HiOutlineEye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
      />
    </div>
  );
};

export default TodaysOrdersTable;
