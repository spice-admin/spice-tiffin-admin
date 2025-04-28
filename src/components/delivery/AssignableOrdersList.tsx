// src/components/delivery/AssignableOrdersList.tsx

import React from "react";
import type { IOrderAdminFE } from "../../types"; // Adjust path

interface AssignableOrdersListProps {
  orders: IOrderAdminFE[];
  selectedOrderIds: Set<string>; // Set of selected order IDs
  onSelectionChange: (selectedIds: Set<string>) => void; // Callback when selection changes
  isLoading: boolean;
}

// Helper to format address concisely
const formatShortAddress = (order: IOrderAdminFE): string => {
  const parts = [
    order.deliveryAddress?.address,
    order.deliveryAddress?.city,
    order.deliveryAddress?.postalCode,
  ].filter(Boolean); // Remove null/empty strings
  return parts.join(", ") || "Address not available";
};

const AssignableOrdersList: React.FC<AssignableOrdersListProps> = ({
  orders,
  selectedOrderIds,
  onSelectionChange,
  isLoading,
}) => {
  const handleCheckboxChange = (orderId: string, isChecked: boolean) => {
    const newSelectedIds = new Set(selectedOrderIds); // Clone the set
    if (isChecked) {
      newSelectedIds.add(orderId);
    } else {
      newSelectedIds.delete(orderId);
    }
    onSelectionChange(newSelectedIds); // Notify parent component
  };

  return (
    <div
      className="list-group overflow-auto"
      style={{ maxHeight: "400px" }} // Make list scrollable
    >
      {isLoading && (
        <div className="list-group-item text-center text-muted">
          Loading orders...
        </div>
      )}
      {!isLoading && orders.length === 0 && (
        <div className="list-group-item text-center text-muted">
          No pending orders found.
        </div>
      )}
      {!isLoading &&
        orders.map((order) => (
          <label // Use label for better accessibility with checkbox
            key={order._id}
            className="list-group-item list-group-item-action d-flex align-items-center" // Use action style
            style={{ cursor: "pointer" }} // Indicate clickable
          >
            <input
              className="form-check-input me-2"
              type="checkbox"
              value={order._id}
              checked={selectedOrderIds.has(order._id)}
              onChange={(e) =>
                handleCheckboxChange(order._id, e.target.checked)
              }
              aria-label={`Select order ${order.orderNumber}`}
              disabled={isLoading} // Disable during parent loading state
            />
            <div className="flex-grow-1">
              <div className="d-flex w-100 justify-content-between">
                <h6 className="mb-1">Order #{order.orderNumber}</h6>
                <small className="text-muted">
                  {order.package?.name || "N/A"}
                </small>
              </div>
              <p className="mb-1 small text-muted">
                {order.customer?.fullName || "Unknown Customer"}
              </p>
              <small className="text-muted">{formatShortAddress(order)}</small>
            </div>
          </label>
        ))}
    </div>
  );
};

export default AssignableOrdersList;
