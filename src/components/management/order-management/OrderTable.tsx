import React from "react";
import type { IOrder } from "@orders/index";
import "./order-management.css";
import { HiOutlineEye, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";

interface OrderTableProps {
  orders: IOrder[];
  onViewOrder: (order: IOrder) => void;
  onEditOrder: (order: IOrder) => void;
  onDeleteOrder: (orderId: string) => void;
  isLoading?: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  isLoading,
}) => {
  return (
    <div className="order-table-wrapper">
      <div className="table-container">
        {isLoading ? (
          <div className="loading-state">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <table className="order-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Package</th>
                <th>Total</th>
                <th>Order Date</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id.substring(0, 8)}</td>
                  <td>{order.user_full_name}</td>
                  <td>{order.package_name}</td>
                  <td>${order.package_price}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{order.delivery_start_date || "N/A"}</td>
                  <td>{order.delivery_end_date || "N/A"}</td>
                  <td>
                    <span className={`status-badge ${order.order_status}`}>
                      {order.order_status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>

                  <td className="actions-cell">
                    <div className="actions-wrapper">
                      <button
                        className="btn-action btn-view"
                        onClick={() => onViewOrder(order)}
                      >
                        <HiOutlineEye size={16} />
                      </button>
                      <button
                        className="btn-action btn-edit"
                        onClick={() => onEditOrder(order)}
                      >
                        <HiOutlinePencil size={16} />
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => onDeleteOrder(order.id)}
                      >
                        <HiOutlineTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OrderTable;
