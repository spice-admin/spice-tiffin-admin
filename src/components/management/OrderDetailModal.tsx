// src/components/management/OrderDetailModal.tsx
import React from "react";
import type { IAdminOrder } from "../../types"; // Assuming IAdminOrder is defined
import {
  HiOutlineXMark,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineHashtag,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineMapPin,
  HiOutlineBuildingOffice2,
  HiOutlineIdentification,
  HiOutlineTag,
  HiOutlineSparkles,
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineXCircle,
  HiOutlineCheckCircle,
  HiOutlineUserCircle,
} from "react-icons/hi2";

// Helper to format dates (you might have this globally)
const formatDateReadable = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      // Use en-CA for YYYY-MM-DD consistently or choose preferred locale
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const formatDateOnly = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const formatCurrency = (amount?: number | null): string => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-CA", {
    // CAD Currency
    style: "currency",
    currency: "CAD",
  }).format(amount);
};

// Re-using the OrderStatusDisplayBadge from OrderTable or define a similar one here
// For simplicity, I'll assume you can import it or redefine:
const OrderStatusDisplayBadge = ({ status }: { status: string }) => {
  let badgeClass = "badge-status-default"; // Define these classes in your CSS
  let icon = <HiOutlineClock className="icon" />;
  const displayStatus = status
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  switch (status) {
    case "confirmed":
      badgeClass = "badge-status-confirmed";
      icon = <HiOutlineCheckCircle className="icon" />;
      break;
    case "processing":
      badgeClass = "badge-status-processing";
      icon = <HiOutlineClock className="icon" />;
      break;
    case "out_for_delivery":
      badgeClass = "badge-status-delivery";
      icon = <HiOutlineClock className="icon" />;
      break; /* Use truck icon */
    case "delivered":
      badgeClass = "badge-status-delivered";
      icon = <HiOutlineCheckCircle className="icon" />;
      break;
    case "cancelled":
      badgeClass = "badge-status-cancelled";
      icon = <HiOutlineXCircle className="icon" />;
      break;
    case "on_hold":
    case "pending_confirmation":
      badgeClass = "badge-status-hold";
      icon = <HiOutlineClock className="icon" />;
      break;
  }
  return (
    <span className={`order-status-badge ${badgeClass}`}>
      {icon} {displayStatus}
    </span>
  );
};

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: IAdminOrder | null;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen || !order) {
    return null;
  }

  // Helper for rendering a detail item
  const DetailItem: React.FC<{
    label: string;
    value?: string | number | null | React.ReactNode;
    icon?: React.ElementType;
  }> = ({ label, value, icon: Icon }) => (
    <div className="detail-item">
      <strong className="detail-label">
        {Icon && <Icon className="icon" />} {label}:
      </strong>
      <span className="detail-value">
        {value ?? <span className="text-muted">N/A</span>}
      </span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close-button"
          onClick={onClose}
          aria-label="Close modal"
        >
          <HiOutlineXMark size={24} />
        </button>

        <h2 className="modal-title">
          <HiOutlineClipboardDocumentList className="icon" /> Order Details
        </h2>
        <p className="modal-order-id">ID: {order.id}</p>

        <div className="modal-section">
          <h3 className="section-title">Summary</h3>
          <DetailItem
            label="Status"
            value={<OrderStatusDisplayBadge status={order.order_status} />}
          />
          <DetailItem
            label="Order Date"
            value={formatDateReadable(order.order_date)}
            icon={HiOutlineCalendarDays}
          />
          <DetailItem
            label="Total Amount"
            value={formatCurrency(order.package_price)}
            icon={HiOutlineCurrencyDollar}
          />
        </div>

        <div className="modal-section">
          <h3 className="section-title">Customer Information</h3>
          <DetailItem
            label="Name"
            value={order.user_full_name}
            icon={HiOutlineUser}
          />
          <DetailItem
            label="Email"
            value={order.user_email}
            icon={HiOutlineEnvelope}
          />
          <DetailItem
            label="Phone"
            value={order.user_phone}
            icon={HiOutlineDevicePhoneMobile}
          />
        </div>

        <div className="modal-section">
          <h3 className="section-title">Package Details</h3>
          <DetailItem
            label="Name"
            value={order.package_name}
            icon={HiOutlineTag}
          />
          <DetailItem
            label="Type"
            value={order.package_type}
            icon={HiOutlineSparkles}
          />
          <DetailItem
            label="Duration"
            value={order.package_days ? `${order.package_days} days` : "N/A"}
            icon={HiOutlineCalendarDays}
          />
          <DetailItem
            label="Price (at order)"
            value={formatCurrency(order.package_price)}
            icon={HiOutlineCurrencyDollar}
          />
        </div>

        <div className="modal-section">
          <h3 className="section-title">Delivery Information</h3>
          <DetailItem
            label="Address"
            value={
              `${order.delivery_address || ""}, ${order.delivery_city || ""} ${
                order.delivery_postal_code || ""
              }`
                .replace(/, $/, "")
                .replace(/^, /, "") || "N/A"
            }
            icon={HiOutlineMapPin}
          />
          {/* <DetailItem label="City" value={order.delivery_city} icon={HiOutlineBuildingOffice2} />
          <DetailItem label="Postal Code" value={order.delivery_postal_code} icon={HiOutlineIdentification} /> */}
          <DetailItem
            label="User's Current Location (at order)"
            value={order.delivery_current_location}
            icon={HiOutlineMapPin}
          />
          <DetailItem
            label="Delivery Start Date"
            value={formatDateOnly(order.delivery_start_date)}
            icon={HiOutlineCalendarDays}
          />
          <DetailItem
            label="Delivery End Date"
            value={formatDateOnly(order.delivery_end_date)}
            icon={HiOutlineCalendarDays}
          />
        </div>

        <div className="modal-section">
          <h3 className="section-title">Payment Information</h3>
          <DetailItem
            label="Stripe Payment ID"
            value={order.stripe_payment_id}
            icon={HiOutlineCreditCard}
          />
          <DetailItem
            label="Stripe Customer ID"
            value={order.stripe_customer_id}
            icon={HiOutlineUserCircle}
          />
        </div>

        <div className="modal-section timestamps">
          <DetailItem
            label="Created At"
            value={formatDateReadable(order.created_at)}
          />
          <DetailItem
            label="Last Updated At"
            value={formatDateReadable(order.updated_at)}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
