// src/components/management/OrderManagerWrapper.tsx (Admin Panel)
import React, { useState, useEffect, useCallback } from "react"; // Added useEffect, useCallback
import type { IOrderAdminFE } from "../../types"; // Use admin order type
import { getAllOrdersAdminApi } from "../../services/order.service"; // Import admin service function
import OrderTable from "./OrderTable"; // Import the table component

// Removed dummy data

// --- The Wrapper Component ---
const OrderManagerWrapper: React.FC = () => {
  // State for orders, loading, and errors
  const [orders, setOrders] = useState<IOrderAdminFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders function
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[OrderManagerWrapper] Fetching all orders...");
      const result = await getAllOrdersAdminApi(); // Call the admin API function
      if (result.success && Array.isArray(result.data)) {
        console.log(
          `[OrderManagerWrapper] Fetched ${result.data.length} orders.`
        );
        setOrders(result.data);
      } else {
        throw new Error(
          result.message || "Failed to fetch orders or invalid data format."
        );
      }
    } catch (err) {
      console.error("[OrderManagerWrapper] Error fetching orders:", err);
      setError((err as Error).message);
      setOrders([]); // Clear orders on error
    } finally {
      setIsLoading(false);
      console.log("[OrderManagerWrapper] Finished fetching orders.");
    }
  }, []);

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // TODO: Add handlers for actions later (view details, update status)

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">All Customer Orders</h4>{" "}
            {/* Updated title */}
          </div>
          {/* Add filter/search controls here later if needed */}
        </div>
      </div>
      <div className="card-body pt-0">
        {/* Display error message if fetch failed */}
        {error && (
          <div className="alert alert-danger" role="alert">
            Error fetching orders: {error}
            {/* Optional: Add retry button */}
            <button
              onClick={fetchOrders}
              className="btn btn-sm btn-danger ms-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pass fetched orders and loading state to table */}
        {/* Ensure OrderTable component can handle IOrderAdminFE type */}
        <OrderTable orders={orders} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default OrderManagerWrapper;
