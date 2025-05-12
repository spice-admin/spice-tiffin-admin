import React from "react";
import type { IOrder } from "@orders/index";
import "./modal.css";
import { HiOutlineX } from "react-icons/hi";

interface OrderDetailModalProps {
  order: IOrder;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <button className="modal-close" onClick={onClose}>
          <HiOutlineX size={20} />
        </button>

        <h2 className="modal-title">Order Details</h2>

        <div className="modal-grid">
          <div className="modal-section">
            <h3>Order Information</h3>
            <p>
              <strong>Order ID:</strong> {order.id}
            </p>
            <p>
              <strong>Status:</strong> {order.order_status}
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {new Date(order.order_date).toLocaleDateString()}
            </p>
          </div>

          <div className="modal-section">
            <h3>Customer Details</h3>
            <p>
              <strong>Name:</strong> {order.user_full_name}
            </p>
            <p>
              <strong>Email:</strong> {order.user_email}
            </p>
            <p>
              <strong>Phone:</strong> {order.user_phone}
            </p>
          </div>

          <div className="modal-section">
            <h3>Package Details</h3>
            <p>
              <strong>Package:</strong> {order.package_name}
            </p>
            <p>
              <strong>Type:</strong> {order.package_type}
            </p>
            <p>
              <strong>Price:</strong> ${order.package_price}
            </p>
          </div>

          <div className="modal-section">
            <h3>Delivery Details</h3>
            <p>
              <strong>Start Date:</strong> {order.delivery_start_date || "N/A"}
            </p>
            <p>
              <strong>End Date:</strong> {order.delivery_end_date || "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {order.delivery_address}
            </p>
            <p>
              <strong>City:</strong> {order.delivery_city}
            </p>
            <p>
              <strong>Postal Code:</strong> {order.delivery_postal_code}
            </p>
          </div>

          <div className="modal-section">
            <h3>Payment Details</h3>
            <p>
              <strong>Payment ID:</strong> {order.stripe_payment_id || "N/A"}
            </p>
            <p>
              <strong>Customer ID:</strong> {order.stripe_customer_id || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
