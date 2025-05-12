import React, { useState, useEffect } from "react";
import { supabase } from "@lib/supabaseClient";
import type { IOrder } from "@orders/index";
import OrderTable from "./OrderTable";
import OrderForm from "./OrderForm";
import OrderDetailModal from "./OrderDetailModal";
import "./order-management.css";

const OrderManagerWrapper: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch Orders
   */
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data as IOrder[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Delete Order
   */
  const handleDeleteOrder = async (orderId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this order?"
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) throw error;

      alert("Order deleted successfully.");
      fetchOrders(); // Refresh orders after deletion
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order.");
    }
  };

  /**
   * Handle Edit Order
   */
  const handleEditOrder = (order: IOrder) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  /**
   * Handle Close
   */
  const handleClose = () => {
    setSelectedOrder(null);
    setIsFormOpen(false);
    setIsDetailModalOpen(false);
  };

  /**
   * Handle Refresh After Update
   */
  const handleRefreshAfterUpdate = () => {
    fetchOrders();
    handleClose();
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="order-management-wrapper">
      <div className="header">
        <h2>Order Management</h2>
      </div>

      <OrderTable
        orders={orders}
        onEditOrder={handleEditOrder}
        onDeleteOrder={handleDeleteOrder}
        onViewOrder={(order) => {
          setSelectedOrder(order);
          setIsDetailModalOpen(true);
        }}
      />

      {isFormOpen && selectedOrder && (
        <OrderForm
          initialOrder={selectedOrder}
          onSubmit={handleRefreshAfterUpdate}
          onCancel={handleClose}
        />
      )}

      {isDetailModalOpen && selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={handleClose} />
      )}
    </div>
  );
};

export default OrderManagerWrapper;
